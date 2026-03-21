import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft, User, Users, Trophy, Calendar, Loader2,
  MessageCircle, Crosshair, Target, Swords, ExternalLink,
} from "lucide-react";
import { FaceitLevelIcon } from "@/components/FaceitLevelIcon";
import { usePlayerProfile } from "@/hooks/use-transfer";
import { useQuery } from "@tanstack/react-query";
import type { FaceitStatsPayload } from "@/hooks/use-faceit-stats";

const API = import.meta.env.VITE_API_URL ?? "";

function useFaceitStatsByUserId(userId: number | null) {
  return useQuery<FaceitStatsPayload>({
    queryKey: ["faceit_stats_public", userId],
    queryFn: async () => {
      const resp = await fetch(`${API}/api/public/players/${userId}/faceit-stats`);
      if (!resp.ok) throw new Error("No FACEIT stats");
      const data = await resp.json();
      return { lifetime: data.lifetime, maps: data.maps };
    },
    enabled: userId != null,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("ru-RU", {
    day: "2-digit", month: "long", year: "numeric",
  });
}

const STATUS_LABEL: Record<string, string> = {
  draft: "Черновик",
  open: "Регистрация",
  live: "Идёт",
  finished: "Завершён",
  cancelled: "Отменён",
};

export default function PlayerProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const userId = id ? parseInt(id) : null;

  const { data: profile, isLoading, isError } = usePlayerProfile(userId);
  const { data: faceitStats } = useFaceitStatsByUserId(userId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-4">
        <User className="w-12 h-12 text-muted-foreground" />
        <p className="text-sm text-muted-foreground text-center">Игрок не найден</p>
        <button onClick={() => navigate(-1)} className="text-[#FF7800] text-sm">
          Назад
        </button>
      </div>
    );
  }

  const lt = faceitStats?.lifetime;
  const maps = faceitStats?.maps ?? [];

  return (
    <div className="pb-24 min-h-screen">
      {/* Шапка */}
      <div className="relative">
        {/* Фоновый градиент */}
        <div className="absolute inset-0 h-48 bg-gradient-to-b from-[#FF7800]/20 to-transparent pointer-events-none" />

        <div className="relative px-4 pt-4 pb-0">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-sm text-muted-foreground mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Назад
          </button>

          {/* Аватар + имя */}
          <div className="flex items-end gap-4 mb-4">
            <div className="relative">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.username}
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-[#FF7800]/40"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-[#2a2b2e] border-2 border-white/10 flex items-center justify-center">
                  <User className="w-10 h-10 text-muted-foreground" />
                </div>
              )}
              {profile.faceit_level != null && (
                <div className="absolute -bottom-2 -right-2">
                  <FaceitLevelIcon
                    level={profile.faceit_level}
                    elo={profile.faceit_elo}
                    size={32}
                  />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0 pb-1">
              <h1 className="text-xl font-bold truncate">{profile.username}</h1>
              {profile.faceit_elo != null && (
                <p className="text-[#FF7800] text-sm font-semibold">
                  {profile.faceit_elo} ELO
                </p>
              )}
              {profile.member_since && (
                <p className="text-[11px] text-muted-foreground">
                  На платформе с {formatDate(profile.member_since)}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-4">

        {/* Команда */}
        {profile.team ? (
          <div className="rounded-2xl bg-[#1a1b1e] border border-white/8 p-4 flex items-center gap-3">
            {profile.team.logo_url ? (
              <img
                src={profile.team.logo_url}
                alt={profile.team.name}
                className="w-10 h-10 rounded-xl object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-[#2a2b2e] flex items-center justify-center">
                <Users className="w-5 h-5 text-muted-foreground" />
              </div>
            )}
            <div>
              <p className="font-semibold text-sm">{profile.team.name}</p>
              <p className="text-[11px] text-muted-foreground capitalize">
                {profile.team.tag && `[${profile.team.tag}] · `}
                {profile.team.role_in_team === "captain" ? "Капитан" : "Игрок"}
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl bg-[#1a1b1e] border border-white/8 p-4 flex items-center gap-3 text-muted-foreground">
            <Users className="w-5 h-5" />
            <span className="text-sm">Без команды</span>
          </div>
        )}

        {/* FACEIT статистика */}
        {lt ? (
          <div>
            <h2 className="text-xs uppercase tracking-widest font-bold text-muted-foreground mb-2">
              Статистика FACEIT
            </h2>
            <div className="grid grid-cols-2 gap-2.5">
              {([
                { key: "matches", label: "Матчей", icon: Swords, color: "#FF7800" },
                { key: "win_rate", label: "Винрейт", icon: Trophy, suffix: "%", color: "#22c55e" },
                { key: "kd_ratio", label: "K/D", icon: Crosshair, color: "#3b82f6" },
                { key: "headshots", label: "HS %", icon: Target, suffix: "%", color: "#a855f7" },
              ] as const).map(({ key, label, icon: Icon, suffix, color }) => {
                const raw = lt[key as keyof typeof lt] ?? "0";
                const value = suffix && !String(raw).includes("%") ? `${raw}${suffix}` : raw;
                return (
                  <div
                    key={key}
                    className="rounded-2xl bg-[#1a1b1e] border border-white/8 p-4 flex flex-col gap-2"
                  >
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center"
                      style={{ background: `${color}15` }}
                    >
                      <Icon className="w-4 h-4" style={{ color }} />
                    </div>
                    <span className="text-2xl font-bold leading-none">{value}</span>
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Карты */}
            {maps.length > 0 && (
              <div className="mt-3 rounded-2xl bg-[#1a1b1e] border border-white/8 p-4">
                <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-3">
                  Карты
                </p>
                <div className="space-y-3">
                  {maps.slice(0, 5).map((m) => {
                    const wr = parseFloat(m.win_rate) || 0;
                    const col = wr >= 55 ? "#22c55e" : wr >= 45 ? "#eab308" : "#ef4444";
                    return (
                      <div key={m.name}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium">{m.name}</span>
                          <div className="flex gap-3 text-[11px] text-muted-foreground">
                            <span>K/D {m.avg_kd}</span>
                            <span>{m.matches} игр</span>
                            <span className="font-bold" style={{ color: col }}>
                              {m.win_rate}%
                            </span>
                          </div>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${wr}%`, background: col }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-2xl bg-[#1a1b1e] border border-white/8 p-4 text-center text-muted-foreground text-sm">
            FACEIT не привязан
          </div>
        )}

        {/* Объявление о трансфере */}
        {profile.transfer_listing && (
          <div>
            <h2 className="text-xs uppercase tracking-widest font-bold text-muted-foreground mb-2">
              Трансфер
            </h2>
            <div className="rounded-2xl bg-[#1a1b1e] border border-[#FF7800]/20 p-4 space-y-2">
              <span
                className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                  profile.transfer_listing.listing_type === "lft"
                    ? "bg-[#FF7800]/15 text-[#FF7800]"
                    : "bg-[#3b82f6]/15 text-[#3b82f6]"
                }`}
              >
                {profile.transfer_listing.listing_type === "lft"
                  ? "Ищет команду"
                  : "Ищет игрока"}
              </span>
              {profile.transfer_listing.roles && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {profile.transfer_listing.roles.split(",").map((r) => (
                    <span
                      key={r}
                      className="text-[10px] bg-white/5 border border-white/8 rounded-full px-2 py-0.5 text-muted-foreground"
                    >
                      {r.trim()}
                    </span>
                  ))}
                </div>
              )}
              {profile.transfer_listing.description && (
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {profile.transfer_listing.description}
                </p>
              )}
              {profile.transfer_listing.contact && (
                <div className="flex items-center gap-2 pt-1">
                  <MessageCircle className="w-3.5 h-3.5 text-[#FF7800]" />
                  <span className="text-xs text-[#FF7800]">
                    {profile.transfer_listing.contact}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Турниры */}
        {profile.tournaments.length > 0 && (
          <div>
            <h2 className="text-xs uppercase tracking-widest font-bold text-muted-foreground mb-2">
              Турниры
            </h2>
            <div className="space-y-2">
              {profile.tournaments.map((t) => (
                <Link
                  key={t.id}
                  to={`/tournaments/details/${t.id}`}
                  className="flex items-center gap-3 rounded-xl bg-[#1a1b1e] border border-white/8 p-3"
                >
                  {t.logo_url ? (
                    <img
                      src={t.logo_url}
                      alt={t.title}
                      className="w-9 h-9 rounded-lg object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-lg bg-[#2a2b2e] flex items-center justify-center flex-shrink-0">
                      <Trophy className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{t.title}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {t.game} · {STATUS_LABEL[t.status] ?? t.status}
                    </p>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
