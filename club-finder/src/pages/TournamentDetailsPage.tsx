import { ArrowLeft, CalendarDays, Medal, MapPin, ScrollText, Timer, Trophy, Users } from "lucide-react";
import type { ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { tournaments } from "@/data/tournaments";

export default function TournamentDetailsPage() {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const selected = tournaments.find((item) => String(item.id) === tournamentId);

  if (!selected) {
    return (
      <div className="min-h-screen px-5 pt-7 pb-28">
        <Link to="/tournaments" className="inline-flex items-center gap-2 text-sm text-[#C4CAD2]">
          <ArrowLeft className="h-4 w-4" />
          {"Назад к турнирам"}
        </Link>
        <p className="mt-5 text-[#949BA4]">{"Турнир не найден."}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-5 pt-7 pb-28">
      <Link to="/tournaments" className="mb-4 inline-flex items-center gap-2 text-sm text-[#C4CAD2]">
        <ArrowLeft className="h-4 w-4" />
        {"Назад"}
      </Link>

      <div className="mb-5 rounded-2xl border border-[#2F3136] bg-[linear-gradient(145deg,#1A1B1F_0%,#101010_100%)] p-4">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <span className="text-[11px] uppercase tracking-wider text-[#949BA4]">{"Турнир"}</span>
            <h1 className="mt-1 font-display text-[32px] leading-none text-white">{selected.title}</h1>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full border border-[#3a2a12] bg-[#2a1b08] px-2.5 py-1 text-[10px] font-semibold uppercase text-[#FF9A2F]">
            <Medal className="h-3 w-3" />
            {selected.prize}
          </span>
        </div>

        <p className="text-sm leading-relaxed text-[#B5BAC1]">{selected.description}</p>
      </div>

      <section className="mb-4 rounded-2xl border border-[#2F3136] bg-[#121315] p-4">
        <h2 className="mb-3 font-display text-[24px] leading-none">{"Информация"}</h2>

        <div className="space-y-2.5 text-sm text-[#B5BAC1]">
          <InfoRow icon={<CalendarDays className="h-4 w-4 text-[#FF7800]" />} label="Дата" value={selected.date} />
          <InfoRow icon={<Users className="h-4 w-4 text-[#FF7800]" />} label="Формат" value={selected.players} />
          <InfoRow icon={<MapPin className="h-4 w-4 text-[#FF7800]" />} label="Локация" value={selected.location} />
          <InfoRow icon={<Trophy className="h-4 w-4 text-[#FF7800]" />} label="Дисциплина" value={selected.game} />
          <InfoRow icon={<Timer className="h-4 w-4 text-[#FF7800]" />} label="Check-in" value={selected.checkIn} />
          <InfoRow icon={<Medal className="h-4 w-4 text-[#FF7800]" />} label="Взнос" value={selected.entryFee} />
          <InfoRow icon={<ScrollText className="h-4 w-4 text-[#FF7800]" />} label="Сетка" value={selected.format} />
        </div>
      </section>

      <section className="rounded-2xl border border-[#2F3136] bg-[#121315] p-4">
        <h2 className="mb-3 font-display text-[24px] leading-none">{"Правила"}</h2>
        <ul className="space-y-2">
          {selected.rules.map((rule, index) => (
            <li key={rule} className="flex items-start gap-2 text-sm text-[#B5BAC1]">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#FF7800]" />
              <span>{`${index + 1}. ${rule}`}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-[#25272B] bg-[#16181C] px-3 py-2.5">
      <div className="flex min-w-0 items-center gap-2">
        {icon}
        <span className="shrink-0 text-[#949BA4]">{label}</span>
      </div>
      <span className="truncate text-right text-white">{value}</span>
    </div>
  );
}
