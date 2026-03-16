import { ChevronRight, Settings, LogOut, Wallet, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/auth/AuthProvider";

const FACEIT_LEVEL_COLORS: Record<number, { bg: string; text: string; border: string }> = {
  1:  { bg: "#ffffff0f", text: "#888888", border: "#ffffff18" },
  2:  { bg: "#ffffff0f", text: "#888888", border: "#ffffff18" },
  3:  { bg: "#ffffff0f", text: "#888888", border: "#ffffff18" },
  4:  { bg: "#e6b80015", text: "#e6b800", border: "#e6b80030" },
  5:  { bg: "#e6b80015", text: "#e6b800", border: "#e6b80030" },
  6:  { bg: "#FF780015", text: "#FF7800", border: "#FF780030" },
  7:  { bg: "#FF780015", text: "#FF7800", border: "#FF780030" },
  8:  { bg: "#e74c3c15", text: "#e74c3c", border: "#e74c3c30" },
  9:  { bg: "#e74c3c15", text: "#e74c3c", border: "#e74c3c30" },
  10: { bg: "#e74c3c15", text: "#e74c3c", border: "#e74c3c30" },
};

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const levelColors = user?.faceit_level ? FACEIT_LEVEL_COLORS[user.faceit_level] ?? FACEIT_LEVEL_COLORS[1] : null;

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
          {user?.faceit_level != null && (
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#121315] flex items-center justify-center ring-1 ring-white/10">
              <img
                src={`https://assets.faceit-cdn.net/frontend/561/assets/images-compress/skill_level/skill_level_${user.faceit_level}_lg.png`}
                alt={`level ${user.faceit_level}`}
                className="w-5 h-5 object-contain"
              />
            </div>
          )}
        </div>

        <h1 className="text-xl font-display font-bold mb-0.5">{user?.username}</h1>
        {user?.email && <p className="text-xs text-muted-foreground mb-3">{user.email}</p>}

        {/* FACEIT stats pill */}
        {user?.faceit_level != null && levelColors && (
          <div
            className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full text-xs font-bold"
            style={{ background: levelColors.bg, color: levelColors.text, border: `1px solid ${levelColors.border}` }}
          >
            <img
              src={`https://assets.faceit-cdn.net/frontend/561/assets/images-compress/skill_level/skill_level_${user.faceit_level}_lg.png`}
              alt=""
              className="w-4 h-4 object-contain"
            />
            <span>Уровень {user.faceit_level}</span>
            {user.faceit_elo != null && (
              <>
                <span style={{ color: levelColors.text, opacity: 0.4 }}>·</span>
                <span>{user.faceit_elo} ELO</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Menu */}
      <div className="px-4 space-y-2">
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
          onClick={() => navigate("/profile/settings")}
          className="w-full flex items-center gap-3 rounded-2xl glass border border-white/8 px-4 py-3.5 hover:bg-white/5 transition-colors"
        >
          <div className="w-8 h-8 rounded-xl bg-white/8 flex items-center justify-center">
            <Settings className="w-4 h-4 text-muted-foreground" />
          </div>
          <span className="flex-1 text-left text-sm font-medium">Настройки</span>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>

        {!user?.faceit_level && (
          <button
            type="button"
            onClick={() => navigate("/auth")}
            className="w-full flex items-center gap-3 rounded-2xl glass border border-[#FF5500]/20 px-4 py-3.5 hover:bg-[#FF5500]/5 transition-colors"
          >
            <div className="w-8 h-8 rounded-xl bg-[#FF5500]/15 flex items-center justify-center">
              <Shield className="w-4 h-4 text-[#FF5500]" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium">Привязать FACEIT</p>
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
      </div>
    </div>
  );
}
