import { ChevronRight, Settings, LogOut, Wallet, Shield, Unlink, BarChart3, Swords, User as UserIcon, Monitor, ArrowLeftRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useFaceitLink } from "@/hooks/useFaceitLink";
import FaceitStats from "@/components/FaceitStats";
import FaceitMatchHistory from "@/components/FaceitMatchHistory";
import { FaceitLevelIcon, LEVEL_COLORS } from "@/components/FaceitLevelIcon";
import TransferPage from "@/pages/TransferPage";

const LEVEL_BG: Record<number, string> = {
  1: "#CCCCCC15",
  2: "#1EE60015", 3: "#1EE60015",
  4: "#FFD00015", 5: "#FFD00015",
  6: "#FF8C0015", 7: "#FF8C0015",
  8: "#FE3F0015", 9: "#FE3F0015",
  10: "#FE000015",
};

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, token, updateUser, logout } = useAuth();
  const { start: startFaceit, loading: faceitLoading } = useFaceitLink();
  const [unlinking, setUnlinking] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "stats" | "matches" | "transfer">("profile");

  const faceitConnected = !!user?.faceit_id;
  const level = user?.faceit_level ?? null;
  const levelColor = level ? (LEVEL_COLORS[level] ?? "#808080") : null;
  const levelBg = level ? (LEVEL_BG[level] ?? "#80808015") : null;

  const handleUnlinkFaceit = async () => {
    setUnlinking(true);
    try {
      const res = await fetch("/api/public/profile/faceit", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Ошибка отвязки");
      const data = await res.json();
      updateUser({ faceit_id: null, faceit_elo: null, faceit_level: null, avatar_url: data.avatar_url });
    } catch {
      // silently ignore
    } finally {
      setUnlinking(false);
    }
  };

  return (
    <div className="min-h-screen pb-24">

      {/* Hero */}
      <div className="relative px-4 pt-14 pb-8 flex flex-col items-center text-center overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-40 bg-[#FF7800]/12 rounded-full blur-[60px] pointer-events-none" />

        {/* Avatar */}
        <div className="relative mb-4">
          <div className="w-20 h-20 rounded-full ring-2 ring-[#FF7800]/40 ring-offset-2 ring-offset-[#121315] overflow-hidden bg-gradient-to-br from-[#FF7800] to-[#cc5500] flex items-center justify-center font-display font-bold text-3xl text-white">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              user?.username?.[0]?.toUpperCase() || "?"
            )}
          </div>
          {faceitConnected && (
            <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-[#121315] flex items-center justify-center ring-1 ring-white/10">
              {level != null ? (
                <FaceitLevelIcon level={level} elo={user?.faceit_elo} size={36} />
              ) : (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="#FF5500">
                  <path d="M3.234 15.93L0 12.696l8.055-8.055 3.234 3.234L3.234 15.93zm9.512-9.512l3.234-3.234L24 11.304l-3.234 3.234-8.02-8.12zM3.234 8.07L11.29 0l3.234 3.234-8.055 8.055L3.234 8.07zM12.746 24l-3.234-3.234 8.055-8.055L20.8 15.93 12.746 24z"/>
                </svg>
              )}
            </div>
          )}
        </div>

        <h1 className="text-xl font-display font-bold mb-0.5">{user?.username}</h1>
        {user?.email && <p className="text-xs text-muted-foreground mb-4">{user.email}</p>}

      </div>

      {/* Tabs */}
      <div className="flex gap-1 mx-4 mb-4 p-1 rounded-2xl glass border border-white/8">
        {([
          { id: "profile", label: "Профиль", icon: UserIcon, always: true },
          { id: "stats", label: "Стата", icon: BarChart3, always: false },
          { id: "matches", label: "Матчи", icon: Swords, always: false },
          { id: "transfer", label: "Трансфер", icon: ArrowLeftRight, always: true },
        ] as const)
          .filter(({ always }) => always || faceitConnected)
          .map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-bold uppercase tracking-wider rounded-xl transition-colors ${
                activeTab === id
                  ? "bg-[#FF7800]/15 text-[#FF7800]"
                  : "text-muted-foreground hover:text-white"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
      </div>

      {/* Tab content */}
      {activeTab === "stats" && faceitConnected && <FaceitStats token={token} />}
      {activeTab === "matches" && faceitConnected && <FaceitMatchHistory token={token} />}
      {activeTab === "transfer" && <TransferPage />}

      {/* Menu */}
      {activeTab === "profile" && <div className="px-4 space-y-2">
        <button
          type="button"
          onClick={() => navigate("/profile/cashback")}
          className="w-full flex items-center gap-3 rounded-2xl glass border border-white/8 px-4 py-3.5 hover:bg-white/5 transition-colors"
        >
          <div className="w-8 h-8 rounded-xl bg-[#FF7800]/15 flex items-center justify-center">
            <Wallet className="w-4 h-4 text-primary" />
          </div>
          <span className="flex-1 text-left text-sm font-medium">Кешбек</span>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>

        <button
          type="button"
          onClick={() => navigate("/booking")}
          className="w-full flex items-center gap-3 rounded-2xl glass border border-white/8 px-4 py-3.5 hover:bg-white/5 transition-colors"
        >
          <div className="w-8 h-8 rounded-xl bg-emerald-500/15 flex items-center justify-center">
            <Monitor className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="flex-1 text-left text-sm font-medium">Бронирование ПК</span>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>

        <button
          type="button"
          onClick={() => navigate("/profile/settings")}
          className="w-full flex items-center gap-3 rounded-2xl glass border border-white/8 px-4 py-3.5 hover:bg-white/5 transition-colors"
        >
          <div className="w-8 h-8 rounded-xl bg-white/8 flex items-center justify-center">
            <Settings className="w-4 h-4 text-muted-foreground" />
          </div>
          <span className="flex-1 text-left text-sm font-medium">Настройки</span>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>

        {faceitConnected ? (
          <button
            type="button"
            onClick={handleUnlinkFaceit}
            disabled={unlinking}
            className="w-full flex items-center gap-3 rounded-2xl glass border border-white/8 px-4 py-3.5 hover:bg-white/5 transition-colors disabled:opacity-60"
          >
            <div className="w-8 h-8 rounded-xl bg-white/8 flex items-center justify-center">
              <Unlink className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium">{unlinking ? "Отвязка..." : "Отвязать FACEIT"}</p>
              <p className="text-xs text-muted-foreground">Сменить аккаунт FACEIT</p>
            </div>
          </button>
        ) : (
          <button
            type="button"
            onClick={startFaceit}
            disabled={faceitLoading}
            className="w-full flex items-center gap-3 rounded-2xl glass border border-[#FF5500]/20 px-4 py-3.5 hover:bg-[#FF5500]/5 transition-colors disabled:opacity-60"
          >
            <div className="w-8 h-8 rounded-xl bg-[#FF5500]/15 flex items-center justify-center">
              <Shield className="w-4 h-4 text-[#FF5500]" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium">{faceitLoading ? "Ожидание..." : "Привязать FACEIT"}</p>
              <p className="text-xs text-muted-foreground">Показывать ELO и уровень</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        )}

        <div className="pt-2">
          <button
            type="button"
            onClick={logout}
            className="w-full flex items-center gap-3 rounded-2xl px-4 py-3.5 hover:bg-destructive/10 transition-colors text-destructive"
          >
            <div className="w-8 h-8 rounded-xl bg-destructive/10 flex items-center justify-center">
              <LogOut className="w-4 h-4" />
            </div>
            <span className="flex-1 text-left text-sm font-medium">Выйти</span>
          </button>
        </div>
      </div>}
    </div>
  );
}
