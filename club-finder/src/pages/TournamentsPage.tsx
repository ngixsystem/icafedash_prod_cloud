import { Trophy, CalendarDays, Users, MapPin, Medal, Crown } from "lucide-react";

const teamRanking = [
  { id: 1, name: "TeamPro Sergeli", points: 1280, wins: 14, color: "#FEE75C" },
  { id: 2, name: "Energy Gaming", points: 1195, wins: 12, color: "#C0C0C0" },
  { id: 3, name: "Cloud1 Squad", points: 1110, wins: 10, color: "#CD7F32" },
  { id: 4, name: "OpenSpace Crew", points: 980, wins: 9, color: "#FF7800" },
  { id: 5, name: "Main Arena", points: 910, wins: 8, color: "#FF7800" },
];

const tournaments = [
  {
    id: 1,
    title: "FRAG Night Cup",
    date: "15 марта 2026, 19:00",
    players: "5v5 • 16 команд",
    location: "TeamPro Sergeli",
    prize: "20 000 000 сум",
  },
  {
    id: 2,
    title: "Cyber Weekend Showdown",
    date: "22 марта 2026, 18:30",
    players: "2v2 • 24 команды",
    location: "Energy Gaming",
    prize: "12 000 000 сум",
  },
];

export default function TournamentsPage() {
  return (
    <div className="min-h-screen pb-28 px-5 pt-7">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-[#1A1B1F] border border-[#2F3136] flex items-center justify-center text-[#FF7800]">
          <Trophy className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-[32px] font-display leading-none">Турниры</h1>
          <p className="text-xs text-[#949BA4]">Рейтинг команд и ближайшие события</p>
        </div>
      </div>

      <section className="mb-7">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-[26px] leading-none">Рейтинг команд</h2>
          <span className="text-[11px] uppercase tracking-wider text-[#949BA4]">Сезон 2026</span>
        </div>

        <div className="rounded-2xl border border-[#2F3136] bg-[linear-gradient(180deg,#151515_0%,#101010_100%)] p-3 space-y-2">
          {teamRanking.map((team, idx) => (
            <div key={team.id} className="flex items-center justify-between rounded-xl border border-[#2A2A2A] bg-[#141414] px-3 py-2.5">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-7 h-7 rounded-full bg-[#1E1E1E] border border-[#2F3136] flex items-center justify-center text-xs font-bold" style={{ color: team.color }}>
                  {idx + 1}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-white truncate">{team.name}</div>
                  <div className="text-[11px] text-[#949BA4]">Побед: {team.wins}</div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="text-sm font-bold text-[#FF9A2F]">{team.points}</div>
                <div className="text-[10px] text-[#949BA4] uppercase">Pts</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-[26px] leading-none">Турниры</h2>
          <Crown className="w-4 h-4 text-[#FF7800]" />
        </div>

        <div className="space-y-4">
          {tournaments.map((item) => (
            <div key={item.id} className="rounded-2xl border border-[#2F3136] bg-[linear-gradient(180deg,#151515_0%,#101010_100%)] p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <h3 className="font-display text-[24px] leading-none text-white">{item.title}</h3>
                <span className="inline-flex items-center gap-1 rounded-full border border-[#3a2a12] bg-[#2a1b08] px-2 py-1 text-[10px] font-semibold text-[#FF9A2F] uppercase">
                  <Medal className="w-3 h-3" />
                  {item.prize}
                </span>
              </div>

              <div className="space-y-2 text-sm text-[#b5bac1]">
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-[#FF7800]" />
                  <span>{item.date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#FF7800]" />
                  <span>{item.players}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#FF7800]" />
                  <span>{item.location}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
