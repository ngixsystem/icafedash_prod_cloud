import { ArrowLeft, Trophy } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import cs2Banner from "@/assets/tournamentsgcs.jpg";
import dota2Banner from "@/assets/tournamentsgdota.jpg";
import pubgBanner from "@/assets/tournamentsgpubg.jpg";

type GameId = "cs2" | "dota2" | "pubg-mobile";

type Team = {
  id: number;
  name: string;
  points: number;
  wins: number;
  accent: string;
};

const rankingByGame: Record<GameId, { title: string; image: string; teams: Team[] }> = {
  "cs2": {
    title: "CS2",
    image: cs2Banner,
    teams: [
      { id: 1, name: "TeamPro Sergeli", points: 1280, wins: 14, accent: "#FEE75C" },
      { id: 2, name: "Energy Gaming", points: 1195, wins: 12, accent: "#C0C0C0" },
      { id: 3, name: "Cloud1 Squad", points: 1110, wins: 10, accent: "#CD7F32" },
      { id: 4, name: "OpenSpace Crew", points: 980, wins: 9, accent: "#FF7800" },
      { id: 5, name: "Main Arena", points: 910, wins: 8, accent: "#FF7800" },
    ],
  },
  "dota2": {
    title: "Dota2",
    image: dota2Banner,
    teams: [
      { id: 1, name: "Ancient Stars", points: 1325, wins: 15, accent: "#FEE75C" },
      { id: 2, name: "Radiant Force", points: 1200, wins: 13, accent: "#C0C0C0" },
      { id: 3, name: "Dire Squad", points: 1090, wins: 11, accent: "#CD7F32" },
      { id: 4, name: "MidLane Kings", points: 990, wins: 9, accent: "#FF7800" },
      { id: 5, name: "Roshan Hunters", points: 920, wins: 8, accent: "#FF7800" },
    ],
  },
  "pubg-mobile": {
    title: "PUBG Mobile",
    image: pubgBanner,
    teams: [
      { id: 1, name: "DropZone Five", points: 1360, wins: 16, accent: "#FEE75C" },
      { id: 2, name: "Survivor Unit", points: 1230, wins: 13, accent: "#C0C0C0" },
      { id: 3, name: "Zone Masters", points: 1120, wins: 11, accent: "#CD7F32" },
      { id: 4, name: "AirDrop Crew", points: 1005, wins: 10, accent: "#FF7800" },
      { id: 5, name: "Final Circle", points: 940, wins: 8, accent: "#FF7800" },
    ],
  },
};

export default function TournamentGameRatingPage() {
  const { gameId } = useParams<{ gameId: GameId }>();
  const selected = gameId ? rankingByGame[gameId as GameId] : undefined;

  if (!selected) {
    return (
      <div className="min-h-screen px-5 pt-7 pb-28">
        <Link to="/tournaments" className="inline-flex items-center gap-2 text-sm text-[#C4CAD2]">
          <ArrowLeft className="h-4 w-4" />
          Назад к турнирам
        </Link>
        <p className="mt-5 text-[#949BA4]">Раздел не найден.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-5 pt-7 pb-28">
      <Link to="/tournaments" className="mb-4 inline-flex items-center gap-2 text-sm text-[#C4CAD2]">
        <ArrowLeft className="h-4 w-4" />
        Назад
      </Link>

      <div className="relative mb-5 h-[122px] overflow-hidden rounded-2xl border border-[#2F3136]">
        <img src={selected.image} alt={selected.title} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/20" />
        <div className="relative flex h-full items-center gap-3 px-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#2F3136] bg-[#1A1B1F] text-[#FF7800]">
            <Trophy className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-[30px] font-display leading-none">{selected.title}</h1>
            <p className="text-xs text-[#C4CAD2]">Топ команд по рейтингу</p>
          </div>
        </div>
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-[26px] leading-none">Топ по рейтингу</h2>
          <span className="text-[11px] uppercase tracking-wider text-[#949BA4]">Сезон 2026</span>
        </div>

        <div className="rounded-2xl border border-[#2F3136] bg-[linear-gradient(180deg,#151515_0%,#101010_100%)] p-3 space-y-2">
          {selected.teams.map((team, idx) => (
            <div key={team.id} className="flex items-center justify-between rounded-xl border border-[#2A2A2A] bg-[#141414] px-3 py-2.5">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-full border border-[#2F3136] bg-[#1E1E1E] text-xs font-bold" style={{ color: team.accent }}>
                  {idx + 1}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-white">{team.name}</div>
                  <div className="text-[11px] text-[#949BA4]">Побед: {team.wins}</div>
                </div>
              </div>

              <div className="shrink-0 text-right">
                <div className="text-sm font-bold text-[#FF9A2F]">{team.points}</div>
                <div className="text-[10px] uppercase text-[#949BA4]">Pts</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
