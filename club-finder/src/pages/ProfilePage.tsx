import { useMemo } from "react";
import { QrCode, Wallet, Clock, ChevronRight, Settings, LogOut, Copy } from "lucide-react";
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

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, token, logout } = useAuth();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["cashback_me", token],
    queryFn: async (): Promise<CashbackMePayload> => {
      const resp = await fetch("/api/public/cashback/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
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
      toast.success("QR payload copied");
    } catch {
      toast.error("Failed to copy QR payload");
    }
  };

  return (
    <div className="min-h-screen pb-24">
      <div className="px-4 pt-12 pb-4">
        <h1 className="text-xl font-display font-bold">Профиль</h1>
      </div>

      <div className="mx-4 rounded-lg glass p-4 mb-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-display font-bold text-xl uppercase overflow-hidden">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              user?.username?.[0] || "?"
            )}
          </div>
          <div className="flex-1">
            <h2 className="font-display font-bold text-lg">{user?.username}</h2>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
        </div>
      </div>

      <div className="mx-4 grid grid-cols-2 gap-3 mb-4">
        <div className="rounded-lg glass p-4 text-center">
          <Wallet className="w-6 h-6 mx-auto mb-2 text-primary" />
          <p className="text-2xl font-display font-bold text-primary">
            {isLoading ? "..." : formatSum(data?.total_cashback ?? 0)}
          </p>
          <p className="text-xs text-muted-foreground">Кешбек баланс</p>
        </div>
        <button
          type="button"
          onClick={copyQrPayload}
          className="rounded-lg glass p-4 text-center hover:bg-white/5 transition-colors"
        >
          <QrCode className="w-6 h-6 mx-auto mb-2 text-accent" />
          <p className="text-sm font-display font-bold text-accent">QR-карта</p>
          <p className="text-xs text-muted-foreground">Покажи на кассе</p>
        </button>
      </div>

      {qrImageUrl ? (
        <div className="mx-4 rounded-lg glass p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold">QR для начисления кешбека</p>
            <button
              type="button"
              onClick={copyQrPayload}
              className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80"
            >
              <Copy className="w-3.5 h-3.5" /> Копировать payload
            </button>
          </div>
          <div className="flex justify-center">
            <img src={qrImageUrl} alt="cashback-qr" className="w-44 h-44 rounded-md border border-white/10 bg-white p-2" />
          </div>
        </div>
      ) : null}

      <div className="px-4 mb-4">
        <h2 className="text-lg font-display font-bold mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" /> История кешбека
        </h2>
        <div className="space-y-2">
          {isError ? (
            <div className="rounded-lg glass p-3 text-sm text-muted-foreground">
              Не удалось загрузить кешбек, попробуйте позже
            </div>
          ) : (data?.transactions || []).length === 0 ? (
            <div className="rounded-lg glass p-3 text-sm text-muted-foreground">Пока нет начислений кешбека</div>
          ) : (
            (data?.transactions || []).map((tx) => (
              <div key={tx.id} className="rounded-lg glass p-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{tx.club_name || `Клуб #${tx.club_id}`}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(tx.created_at)} · чек {formatSum(tx.amount)} · {tx.cashback_percent.toFixed(2)}%
                  </p>
                  {tx.note ? <p className="text-xs text-muted-foreground mt-1">{tx.note}</p> : null}
                </div>
                <span className="text-primary font-display font-bold">+{formatSum(tx.cashback_amount)}</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="px-4 space-y-1">
        <button
          type="button"
          onClick={() => navigate("/profile/settings")}
          className="w-full flex items-center gap-3 rounded-lg p-3 transition hover:bg-secondary text-foreground"
        >
          <Settings className="w-5 h-5" />
          <span className="flex-1 text-left text-sm">Настройки</span>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 rounded-lg p-3 transition hover:bg-secondary text-destructive"
        >
          <LogOut className="w-5 h-5" />
          <span className="flex-1 text-left text-sm">Выйти</span>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}
