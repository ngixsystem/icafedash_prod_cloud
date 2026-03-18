import { Trophy, CalendarDays, Users, MapPin, Medal, Crown, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { usePublicTournaments } from "@/hooks/use-tournaments";

function formatDate(value: string | null) {
  if (!value) return "Дата не указана";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Дата не указана";
  return date.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatTeams(teamFormat: string, maxTeams: number) {
  const base = teamFormat?.trim() ? teamFormat.trim() : "Формат не указан";
  const teams = Number.isFinite(maxTeams) && maxTeams > 0 ? `${maxTeams} команд` : "0 команд";
  return `${base} • ${teams}`;
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
          <p className="text-xs text-[#949BA4]">Рейтинг по играм и ближайшие события</p>
        </div>
      </div>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-[26px] leading-none">Турниры</h2>
          <Crown className="w-4 h-4 text-[#FF7800]" />
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
                className="group block rounded-2xl border border-[#2F3136] bg-[linear-gradient(180deg,#151515_0%,#101010_100%)] p-4 transition-colors hover:border-[#3A3E45] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF7800]/50"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h3 className="font-display text-[24px] leading-none text-white">{item.title}</h3>
                  <span className="inline-flex items-center gap-1 rounded-full border border-[#3a2a12] bg-[#2a1b08] px-2 py-1 text-[10px] font-semibold text-[#FF9A2F] uppercase">
                    <Medal className="w-3 h-3" />
                    {item.prize_pool || "Приз не указан"}
                  </span>
                </div>

                <div className="space-y-2 text-sm text-[#b5bac1]">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-[#FF7800]" />
                    <span>{formatDate(item.starts_at)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#FF7800]" />
                    <span>{formatTeams(item.team_format, item.max_teams)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#FF7800]" />
                    <span>{item.location || "Локация не указана"}</span>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-end text-[#C4CAD2]">
                  <span className="text-[11px] uppercase tracking-wider mr-1">Подробное</span>
                  <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </div>
              </Link>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
