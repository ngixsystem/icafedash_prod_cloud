import { useMemo } from "react";
import { ArrowLeft, QrCode, Copy, Clock, Wallet } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/auth/AuthProvider";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

interface CashbackTx {
  id: number;
  club_id: number;
  club_name: string;
  amount: number;
  cashback_percent: number;
  cashback_amount: number;
  note: string;
  created_at: string | null;
}

interface CashbackMePayload {
  cashback_enabled: boolean;
  member_id: number;
  member_account: string | null;
  qr_payload: string;
  total_cashback: number;
  transactions: CashbackTx[];
}

function formatDate(value: string | null): string {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatSum(value: number): string {
  return `${Math.round(value).toLocaleString("ru-RU")} СУМ`;
}

export default function CashbackPage() {
  const navigate = useNavigate();
  const { token } = useAuth();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["cashback_me", token],
    queryFn: async (): Promise<CashbackMePayload> => {
      const resp = await fetch("/api/public/cashback/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!resp.ok) throw new Error("Failed to load cashback profile");
      return resp.json();
    },
    enabled: !!token,
  });

  const qrImageUrl = useMemo(() => {
    if (!data?.qr_payload) return "";
    return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(data.qr_payload)}`;
  }, [data?.qr_payload]);

  const copyQrPayload = async () => {
    if (!data?.qr_payload) return;
    try {
      await navigator.clipboard.writeText(data.qr_payload);
      toast.success("Скопировано");
    } catch {
      toast.error("Не удалось скопировать");
    }
  };

  return (
    <div className="min-h-screen pb-24">
      <div className="px-4 pt-12 pb-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate("/profile")}
          className="w-8 h-8 rounded-full bg-white/8 flex items-center justify-center hover:bg-white/12 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-xl font-display font-bold">Кешбек</h1>
      </div>

      {/* Balance */}
      <div className="mx-4 mb-4 rounded-2xl overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-[#FF7800]/20 to-transparent pointer-events-none" />
        <div className="relative p-5 border border-white/10 rounded-2xl glass">
          <p className="text-xs uppercase tracking-widest text-white/40 mb-1">Баланс кешбека</p>
          <p className="text-3xl font-display font-bold text-primary">
            {isLoading ? "..." : formatSum(data?.total_cashback ?? 0)}
          </p>
          <Wallet className="absolute right-5 top-1/2 -translate-y-1/2 w-8 h-8 text-primary/20" />
        </div>
      </div>

      {/* QR Card */}
      {qrImageUrl && (
        <div className="mx-4 rounded-2xl glass border border-white/10 p-5 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <QrCode className="w-4 h-4 text-primary" />
              <p className="text-sm font-semibold">QR для кассы</p>
            </div>
            <button
              type="button"
              onClick={copyQrPayload}
              className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
            >
              <Copy className="w-3.5 h-3.5" /> Копировать
            </button>
          </div>
          <div className="flex justify-center">
            <div className="p-3 bg-white rounded-xl">
              <img src={qrImageUrl} alt="cashback-qr" className="w-44 h-44" />
            </div>
          </div>
          <p className="text-center text-xs text-muted-foreground mt-3">Покажи QR на кассе для начисления кешбека</p>
        </div>
      )}

      {/* History */}
      <div className="px-4">
        <h2 className="text-sm font-display font-bold mb-3 flex items-center gap-2 uppercase tracking-widest text-white/40">
          <Clock className="w-3.5 h-3.5" /> История
        </h2>
        <div className="space-y-2">
          {isError ? (
            <div className="rounded-xl glass p-4 text-sm text-muted-foreground text-center">
              Не удалось загрузить, попробуйте позже
            </div>
          ) : (data?.transactions || []).length === 0 ? (
            <div className="rounded-xl glass p-4 text-sm text-muted-foreground text-center">
              Пока нет начислений
            </div>
          ) : (
            (data?.transactions || []).map((tx) => (
              <div key={tx.id} className="rounded-xl glass p-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{tx.club_name || `Клуб #${tx.club_id}`}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDate(tx.created_at)} · {tx.cashback_percent.toFixed(2)}%
                  </p>
                  {tx.note ? <p className="text-xs text-muted-foreground">{tx.note}</p> : null}
                </div>
                <div className="text-right">
                  <span className="text-primary font-display font-bold text-sm">+{formatSum(tx.cashback_amount)}</span>
                  <p className="text-xs text-muted-foreground">чек {formatSum(tx.amount)}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
