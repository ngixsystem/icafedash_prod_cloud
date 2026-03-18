import { Trophy, Users, ChevronRight } from "lucide-react";
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
              className="group block rounded-2xl border border-[#2F3136] bg-[#121315] overflow-hidden transition-colors hover:border-[#3A3E45] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF7800]/50"
            >
              {/* Header with logo and title */}
              <div className="flex items-center gap-3 p-4 pb-3">
                {item.logo_url ? (
                  <img src={item.logo_url} alt="" className="w-12 h-12 rounded-xl object-cover border border-[#2F3136] flex-shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-[#1A1B1F] border border-[#2F3136] flex items-center justify-center flex-shrink-0">
                    <Trophy className="w-5 h-5 text-[#FF7800]" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h3 className="font-display text-lg leading-tight text-white truncate">{item.title}</h3>
                  <p className="text-xs text-[#949BA4] mt-0.5 uppercase tracking-wide">{item.game}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-[#949BA4] flex-shrink-0 transition-transform group-hover:translate-x-0.5" />
              </div>

              {/* Info row */}
              <div className="grid grid-cols-3 border-t border-[#2F3136] divide-x divide-[#2F3136]">
                <div className="px-3 py-2.5 text-center">
                  <p className="text-[10px] text-[#949BA4] uppercase tracking-wider">Начало</p>
                  <p className="text-sm font-semibold text-white mt-0.5">{formatRelativeDate(item.starts_at)}</p>
                </div>
                <div className="px-3 py-2.5 text-center">
                  <p className="text-[10px] text-[#949BA4] uppercase tracking-wider">Режим</p>
                  <p className="text-sm font-semibold text-white mt-0.5">{item.team_format || "-"}</p>
                </div>
                <div className="px-3 py-2.5 text-center">
                  <p className="text-[10px] text-[#949BA4] uppercase tracking-wider">Регионы</p>
                  <p className="text-sm font-semibold text-white mt-0.5">{item.region || "-"}</p>
                </div>
              </div>

              {/* Bottom row: participants + prize */}
              <div className="grid grid-cols-2 border-t border-[#2F3136] divide-x divide-[#2F3136]">
                <div className="flex items-center justify-center gap-1.5 px-3 py-2.5">
                  <Users className="w-3.5 h-3.5 text-[#949BA4]" />
                  <span className="text-sm text-white font-semibold">{item.registered_teams} / {item.max_teams}</span>
                </div>
                <div className="flex items-center justify-center gap-1.5 px-3 py-2.5">
                  <span className="text-sm text-[#FF9A2F] font-semibold">Призовой фонд</span>
                  <span className="text-sm text-white font-bold">${item.prize_pool || "0"}</span>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
