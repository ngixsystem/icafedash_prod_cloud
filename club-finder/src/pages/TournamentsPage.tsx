import { Trophy } from "lucide-react";
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

      <div className="space-y-3">
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
              className="group block rounded-2xl border border-[#2F3136] bg-[#121315] p-4 transition-colors hover:border-[#3A3E45]"
            >
              {/* Top: logo + title */}
              <div className="flex items-center gap-3 mb-3">
                {item.logo_url ? (
                  <img src={item.logo_url} alt="" className="w-11 h-11 rounded-xl object-cover border border-[#2F3136] flex-shrink-0" />
                ) : (
                  <div className="w-11 h-11 rounded-xl bg-[#1A1B1F] border border-[#2F3136] flex items-center justify-center flex-shrink-0">
                    <Trophy className="w-5 h-5 text-[#FF7800]" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-[15px] leading-tight text-white truncate">{item.title}</h3>
                  <p className="text-xs text-[#949BA4] mt-0.5">{item.game}</p>
                </div>
              </div>

              {/* Middle: info row */}
              <div className="flex items-baseline gap-6 text-xs text-[#949BA4] mb-3">
                <div>
                  <span className="block text-[10px] uppercase tracking-wider mb-0.5">Начало</span>
                  <span className="text-sm font-semibold text-white">{formatRelativeDate(item.starts_at)}</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase tracking-wider mb-0.5">Режим</span>
                  <span className="text-sm font-semibold text-white">{item.team_format || "-"}</span>
                </div>
                {item.region && (
                  <div>
                    <span className="block text-[10px] uppercase tracking-wider mb-0.5">Регионы</span>
                    <span className="text-sm font-semibold text-white">{item.region}</span>
                  </div>
                )}
              </div>

              {/* Bottom: participants + prize */}
              <div className="flex items-center gap-6 text-sm">
                <span className="text-[#949BA4]">Участники <span className="font-semibold text-white">{item.registered_teams} / {item.max_teams}</span></span>
                <span className="text-[#949BA4]">Призовой фонд <span className="font-semibold text-white">{item.prize_pool || "0"}</span></span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
