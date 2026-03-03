import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { QrCode, Percent, Save, Wallet, History } from "lucide-react";
import { toast } from "sonner";

function formatDate(value: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const CashbackPanel = () => {
  const queryClient = useQueryClient();
  const { data: config, isLoading: isConfigLoading } = useQuery({
    queryKey: ["cashback_config"],
    queryFn: api.cashbackConfig,
  });
  const { data: txData, isLoading: isTxLoading } = useQuery({
    queryKey: ["cashback_transactions"],
    queryFn: () => api.cashbackTransactions(100),
  });

  const [enabled, setEnabled] = useState(false);
  const [percent, setPercent] = useState("5");
  const [qrPayload, setQrPayload] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!config) return;
    setEnabled(Boolean(config.cashback_enabled));
    setPercent(String(config.cashback_percent ?? 5));
  }, [config]);

  const saveConfigMutation = useMutation({
    mutationFn: () => {
      const parsed = Number(percent);
      if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) {
        throw new Error("Процент кешбека должен быть от 0 до 100");
      }
      return api.saveCashbackConfig({
        cashback_enabled: enabled,
        cashback_percent: parsed,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cashback_config"] });
      toast.success("Настройки кешбека сохранены");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Ошибка сохранения кешбека");
    },
  });

  const accrueMutation = useMutation({
    mutationFn: async () => {
      const parsedAmount = Number(amount);
      if (!qrPayload.trim()) throw new Error("Scan member QR payload");
      if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
        throw new Error("Enter a valid amount");
      }

      const parsedPercent = Number(percent);
      if (!Number.isFinite(parsedPercent) || parsedPercent < 0 || parsedPercent > 100) {
        throw new Error("Cashback percent must be between 0 and 100");
      }
      if (!enabled) {
        throw new Error("Enable cashback in club settings first");
      }

      if (!config?.cashback_enabled || Number(config?.cashback_percent ?? -1) !== parsedPercent) {
        await api.saveCashbackConfig({
          cashback_enabled: true,
          cashback_percent: parsedPercent,
        });
        await queryClient.invalidateQueries({ queryKey: ["cashback_config"] });
      }

      return api.accrueCashback({
        qr_payload: qrPayload.trim(),
        amount: parsedAmount,
        note: note.trim() || undefined,
      });
    },
    onSuccess: (resp) => {
      queryClient.invalidateQueries({ queryKey: ["cashback_transactions"] });
      toast.success(`Начислено ${resp.transaction.cashback_amount.toFixed(2)} кешбека`);
      setQrPayload("");
      setAmount("");
      setNote("");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Ошибка начисления кешбека");
    },
  });
  const cashbackPreview = useMemo(() => {
    const p = Number(percent);
    const a = Number(amount);
    if (!Number.isFinite(p) || !Number.isFinite(a) || a <= 0) return 0;
    return Math.round((a * p)) / 100;
  }, [amount, percent]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Кешбек</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Начисление бонусов по QR-коду участника и журнал операций.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Percent className="h-5 w-5 text-primary" /> Настройки кешбека
          </h3>

          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="h-4 w-4 accent-primary"
            />
            Включить кешбек для клуба
          </label>

          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Процент кешбека (%)</label>
            <input
              value={percent}
              onChange={(e) => setPercent(e.target.value)}
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              placeholder="5"
              inputMode="decimal"
            />
          </div>

          <button
            type="button"
            onClick={() => saveConfigMutation.mutate()}
            disabled={saveConfigMutation.isPending || isConfigLoading}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            <Save className="h-4 w-4" /> Сохранить
          </button>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <QrCode className="h-5 w-5 text-primary" /> Начислить по QR
          </h3>

          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">QR payload</label>
            <textarea
              value={qrPayload}
              onChange={(e) => setQrPayload(e.target.value)}
              className="w-full min-h-[84px] rounded-md border border-input bg-background p-3 text-sm"
              placeholder='Пример: ICAFE_MEMBER:12345 или {"member_id":12345}'
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Сумма оплаты</label>
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                placeholder="100000"
                inputMode="decimal"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">К начислению</label>
              <div className="h-10 rounded-md border border-input bg-background px-3 text-sm flex items-center">
                {cashbackPreview.toFixed(2)}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Комментарий (опционально)</label>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              placeholder="Оплата по брони #123"
            />
          </div>

          <button
            type="button"
            onClick={() => accrueMutation.mutate()}
            disabled={accrueMutation.isPending}
            className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
          >
            <Wallet className="h-4 w-4" /> Начислить кешбек
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <History className="h-5 w-5 text-primary" /> История начислений
        </h3>
        {isTxLoading ? (
          <div className="text-sm text-muted-foreground">Загрузка...</div>
        ) : (txData?.transactions?.length || 0) === 0 ? (
          <div className="text-sm text-muted-foreground">Операций пока нет.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border">
                  <th className="py-2 pr-3">Дата</th>
                  <th className="py-2 pr-3">Участник</th>
                  <th className="py-2 pr-3">Сумма</th>
                  <th className="py-2 pr-3">%</th>
                  <th className="py-2 pr-3">Кешбек</th>
                  <th className="py-2">Комментарий</th>
                </tr>
              </thead>
              <tbody>
                {txData?.transactions?.map((tx) => (
                  <tr key={tx.id} className="border-b border-border/60">
                    <td className="py-2 pr-3">{formatDate(tx.created_at)}</td>
                    <td className="py-2 pr-3">{tx.member_account || (tx.member_id ? `ID ${tx.member_id}` : "—")}</td>
                    <td className="py-2 pr-3">{tx.amount.toFixed(2)}</td>
                    <td className="py-2 pr-3">{tx.cashback_percent.toFixed(2)}</td>
                    <td className="py-2 pr-3 text-emerald-400 font-semibold">{tx.cashback_amount.toFixed(2)}</td>
                    <td className="py-2">{tx.note || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CashbackPanel;
