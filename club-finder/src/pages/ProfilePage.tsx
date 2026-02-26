import { QrCode, Wallet, Clock, ChevronRight, Settings, LogOut } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";

const history = [
  { id: 1, club: "CyberArena", zone: "VIP", date: "25 февраля", duration: "3 ч", cost: 600 },
  { id: 2, club: "FragZone", zone: "Standard", date: "22 февраля", duration: "2 ч", cost: 160 },
  { id: 3, club: "NeonPlay", zone: "Bootcamp", date: "18 февраля", duration: "5 ч", cost: 1500 },
];

export default function ProfilePage() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen pb-24">
      <div className="px-4 pt-12 pb-4">
        <h1 className="text-xl font-display font-bold">👤 Профиль</h1>
      </div>

      {/* User card */}
      <div className="mx-4 rounded-lg glass p-4 mb-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-display font-bold text-xl uppercase">
            {user?.username?.[0] || "?"}
          </div>
          <div className="flex-1">
            <h2 className="font-display font-bold text-lg">{user?.username}</h2>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Balance + QR */}
      <div className="mx-4 grid grid-cols-2 gap-3 mb-4">
        <div className="rounded-lg glass p-4 text-center">
          <Wallet className="w-6 h-6 mx-auto mb-2 text-primary" />
          <p className="text-2xl font-display font-bold text-primary">2 450 ₽</p>
          <p className="text-xs text-muted-foreground">Баланс</p>
        </div>
        <div className="rounded-lg glass p-4 text-center">
          <QrCode className="w-6 h-6 mx-auto mb-2 text-accent" />
          <p className="text-sm font-display font-bold text-accent">QR-карта</p>
          <p className="text-xs text-muted-foreground">Покажи на кассе</p>
        </div>
      </div>

      {/* History */}
      <div className="px-4 mb-4">
        <h2 className="text-lg font-display font-bold mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" /> История (БЕТА)
        </h2>
        <div className="space-y-2">
          {history.map((h) => (
            <div key={h.id} className="rounded-lg glass p-3 flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">{h.club} · {h.zone}</p>
                <p className="text-xs text-muted-foreground">{h.date} · {h.duration}</p>
              </div>
              <span className="text-primary font-display font-bold">{h.cost} ₽</span>
            </div>
          ))}
        </div>
      </div>

      {/* Menu */}
      <div className="px-4 space-y-1">
        <button className="w-full flex items-center gap-3 rounded-lg p-3 transition hover:bg-secondary text-foreground">
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
