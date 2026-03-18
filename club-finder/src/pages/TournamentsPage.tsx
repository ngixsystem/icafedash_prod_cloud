import { Trophy, Users, Clock, Gamepad2, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { usePublicTournaments } from "@/hooks/use-tournaments";

function formatRelativeDate(value: string | null) {
  if (!value) return "Дата не указана";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Дата не указана";
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "сегодня в " + date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  if (days === 1) return "завтра в " + date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  if (days > 1 && days <= 7) return `через ${days} дн.`;
  return date.toLocaleDateString("ru-RU", { day: "2-digit", month: "short", year: "numeric" });
}

export default function TournamentsPage() {
  const { data: tournaments, isLoading, isError } = usePublicTournaments();

  return (
    <div className="min-h-screen pb-28 px-5 pt-7">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-[#1A1B1F] border border-[#2F3136] flex items-center justify-center text-[#FF7800]">
          <Trophy className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-[32px] font-display leading-none">Турниры</h1>
          <p className="text-xs text-[#949BA4]">Ближайшие события и чемпионаты</p>
        </div>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="rounded-2xl border border-[#2F3136] bg-[#121315] p-4 text-sm text-[#949BA4]">Загрузка турниров...</div>
        ) : isError ? (
          <div className="rounded-2xl border border-[#2F3136] bg-[#121315] p-4 text-sm text-[#949BA4]">Не удалось загрузить турниры</div>
        ) : (tournaments || []).length === 0 ? (
          <div className="rounded-2xl border border-[#2F3136] bg-[#121315] p-4 text-sm text-[#949BA4]">Турниры пока не созданы</div>
        ) : (
          (tournaments || []).map((item) => (
            <Link
              key={item.id}
              to={`/tournaments/details/${item.id}`}
              className="group relative block rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(255,120,0,0.15)]"
            >
              {/* Gradient border effect */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#FF7800]/30 via-[#FF7800]/5 to-transparent p-[1px]">
                <div className="w-full h-full rounded-2xl bg-[#0D0E12]" />
              </div>

              {/* Banner */}
              {item.banner_url && (
                <div className="relative w-full aspect-[2340/600] overflow-hidden">
                  <img
                    src={item.banner_url}
                    alt=""
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0D0E12] via-transparent to-transparent" />
                </div>
              )}

              {/* Card content */}
              <div className="relative p-4">
                {/* Subtle glow accent */}
                {!item.banner_url && (
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF7800]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                )}

                {/* Top: logo + title + prize badge */}
                <div className="flex items-center gap-3 mb-4">
                  {item.logo_url ? (
                    <img src={item.logo_url} alt="" className="w-12 h-12 rounded-xl object-cover ring-1 ring-white/10 flex-shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FF7800]/20 to-[#FF7800]/5 ring-1 ring-[#FF7800]/20 flex items-center justify-center flex-shrink-0">
                      <Trophy className="w-5 h-5 text-[#FF7800]" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display text-[17px] leading-tight text-white truncate group-hover:text-[#FF7800] transition-colors">{item.title}</h3>
                    <p className="text-xs text-[#949BA4] mt-0.5 uppercase tracking-wider">{item.game}</p>
                  </div>
                  {item.prize_pool && (
                    <div className="flex-shrink-0 px-2.5 py-1 rounded-lg bg-gradient-to-r from-[#FF7800]/15 to-[#FF9A2F]/10 border border-[#FF7800]/20">
                      <span className="text-xs font-bold text-[#FF9A2F]">{item.prize_pool}</span>
                    </div>
                  )}
                </div>

                {/* Info chips */}
                <div className="flex flex-wrap gap-2 mb-3">
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/5">
                    <Clock className="w-3.5 h-3.5 text-[#FF7800]" />
                    <span className="text-xs text-[#b5bac1]">{formatRelativeDate(item.starts_at)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/5">
                    <Gamepad2 className="w-3.5 h-3.5 text-[#FF7800]" />
                    <span className="text-xs text-[#b5bac1]">{item.team_format || "-"}</span>
                  </div>
                  {item.region && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/5">
                      <MapPin className="w-3.5 h-3.5 text-[#FF7800]" />
                      <span className="text-xs text-[#b5bac1]">{item.region}</span>
                    </div>
                  )}
                </div>

                {/* Bottom: participants bar */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-[#949BA4]" />
                    <span className="text-xs text-[#949BA4]">
                      <span className="font-semibold text-white">{item.registered_teams}</span>
                      <span className="mx-0.5">/</span>
                      <span>{item.max_teams}</span>
                    </span>
                  </div>
                  <div className="flex-1 mx-3 h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#FF7800] to-[#FF9A2F] transition-all duration-500"
                      style={{ width: `${Math.min((item.registered_teams / item.max_teams) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-[11px] text-[#949BA4] tabular-nums">
                    {Math.round((item.registered_teams / item.max_teams) * 100)}%
                  </span>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
