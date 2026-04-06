import { useState, useEffect } from "react";
import { ArrowLeft, Trophy, Users, Loader2, Shield } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import cs2Banner from "@/assets/tournamentsgcs.jpg";
import dota2Banner from "@/assets/tournamentsgdota.jpg";
import pubgBanner from "@/assets/tournamentsgpubg.jpg";
import {
  useCyberUnionTeams,
  useCyberUnionPlayers,
  type CyberUnionTeam,
  type CyberUnionPlayer,
} from "@/hooks/use-cyberunion";

type GameId = "cs2" | "dota2" | "pubg-mobile";

const GAME_META: Record<GameId, { title: string; image: string }> = {
  "cs2":        { title: "CS2",        image: cs2Banner   },
  "dota2":      { title: "Dota 2",     image: dota2Banner },
  "pubg-mobile":{ title: "PUBG Mobile",image: pubgBanner  },
};

const RANK_COLORS = ["#FEE75C", "#C0C0C0", "#CD7F32"];

function SkeletonCard() {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-[#2A2A2A] bg-[#141414] px-3 py-2.5 animate-pulse">
      <div className="w-7 h-7 rounded-full bg-white/10 shrink-0" />
      <div className="w-9 h-9 rounded-lg bg-white/8 shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3 rounded bg-white/10 w-2/3" />
        <div className="h-2.5 rounded bg-white/6 w-1/3" />
      </div>
      <div className="w-10 h-3 rounded bg-white/10" />
    </div>
  );
}

function TeamCard({ team, rank }: { team: CyberUnionTeam; rank: number }) {
  const accentColor = rank <= 3 ? RANK_COLORS[rank - 1] : "#FF7800";
  const isDefault = team.photo.includes("star_default") || team.photo.includes("no_image");
  return (
    <div className="flex items-center gap-3 rounded-xl border border-[#2A2A2A] bg-[#141414] px-3 py-2.5">
      <div
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#2F3136] bg-[#1E1E1E] text-xs font-bold"
        style={{ color: accentColor }}
      >
        {rank}
      </div>
      <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0 bg-[#1E1E1E] flex items-center justify-center border border-[#2F3136]">
        {!isDefault ? (
          <img src={team.photo} alt={team.name} className="w-full h-full object-cover" />
        ) : (
          <Shield className="w-4 h-4 text-white/20" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold text-white">{team.name}</div>
        <div className="flex items-center gap-1.5 mt-0.5">
          {team.region_photo && !team.region_photo.includes("no_image") && (
            <img src={team.region_photo} alt={team.region} className="w-3.5 h-3.5 rounded-sm object-cover" />
          )}
          <span className="text-[11px] text-[#949BA4]">{team.region}</span>
        </div>
      </div>
      <div className="shrink-0 text-right">
        <div className="text-sm font-bold text-[#FF9A2F]">{team.points}</div>
        <div className="text-[10px] uppercase text-[#949BA4]">Pts</div>
      </div>
    </div>
  );
}

function PlayerCard({ player, rank }: { player: CyberUnionPlayer; rank: number }) {
  const accentColor = rank <= 3 ? RANK_COLORS[rank - 1] : "#FF7800";
  const isDefault = player.photo.includes("man.png") || player.photo.includes("no_image");
  return (
    <div className="flex items-center gap-3 rounded-xl border border-[#2A2A2A] bg-[#141414] px-3 py-2.5">
      <div
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#2F3136] bg-[#1E1E1E] text-xs font-bold"
        style={{ color: accentColor }}
      >
        {rank}
      </div>
      <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0 bg-[#1E1E1E] flex items-center justify-center border border-[#2F3136]">
        {!isDefault ? (
          <img src={player.photo} alt={player.nickname} className="w-full h-full object-cover" />
        ) : (
          <Users className="w-4 h-4 text-white/20" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold text-white">
          {player.nickname || player.name}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          {player.team && (
            <span className="text-[11px] text-[#FF7800]/80 truncate max-w-[100px]">{player.team}</span>
          )}
          {player.team && (
            <span className="text-[#2F3136] text-[10px]">·</span>
          )}
          {player.region_photo && !player.region_photo.includes("no_image") && (
            <img src={player.region_photo} alt={player.region} className="w-3.5 h-3.5 rounded-sm object-cover" />
          )}
          <span className="text-[11px] text-[#949BA4]">{player.region}</span>
        </div>
      </div>
      <div className="shrink-0 text-right">
        <div className="text-sm font-bold text-[#FF9A2F]">{player.points}</div>
        <div className="text-[10px] uppercase text-[#949BA4]">Pts</div>
      </div>
    </div>
  );
}

function TabContent({ gameId }: { gameId: GameId }) {
  const [tab, setTab] = useState<"teams" | "players">("teams");
  const [teamsPage, setTeamsPage] = useState(1);
  const [playersPage, setPlayersPage] = useState(1);
  const [teamsList, setTeamsList] = useState<CyberUnionTeam[]>([]);
  const [playersList, setPlayersList] = useState<CyberUnionPlayer[]>([]);

  const teamsQuery = useCyberUnionTeams(gameId, teamsPage);
  const playersQuery = useCyberUnionPlayers(gameId, playersPage);

  // Append new page results to accumulated list
  useEffect(() => {
    if (teamsQuery.data) {
      setTeamsList((prev) => {
        const ids = new Set(prev.map((t) => t.id));
        return [...prev, ...teamsQuery.data!.items.filter((t) => !ids.has(t.id))];
      });
    }
  }, [teamsQuery.data]);

  useEffect(() => {
    if (playersQuery.data) {
      setPlayersList((prev) => {
        const ids = new Set(prev.map((p) => p.id));
        return [...prev, ...playersQuery.data!.items.filter((p) => !ids.has(p.id))];
      });
    }
  }, [playersQuery.data]);

  function switchTab(next: "teams" | "players") {
    setTab(next);
  }

  const teamsTotal = teamsQuery.data?.total ?? 0;
  const playersTotal = playersQuery.data?.total ?? 0;
  const teamsHasMore = teamsList.length < teamsTotal;
  const playersHasMore = playersList.length < playersTotal;
  const isLoading = tab === "teams" ? teamsQuery.isLoading : playersQuery.isLoading;
  const isError = tab === "teams" ? teamsQuery.isError : playersQuery.isError;
  const isFetchingMore = tab === "teams" ? teamsQuery.isFetching && teamsPage > 1 : playersQuery.isFetching && playersPage > 1;

  return (
    <>
      {/* Tab switcher */}
      <div className="flex gap-1 mb-4 p-1 rounded-2xl bg-[#151515] border border-[#2F3136]">
        {([
          { id: "teams",   label: "Команды", icon: Shield },
          { id: "players", label: "Игроки",  icon: Users  },
        ] as const).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => switchTab(id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-[11px] font-bold uppercase tracking-wider rounded-xl transition-all ${
              tab === id
                ? "bg-[#FF7800]/15 text-[#FF7800] shadow-[0_0_12px_rgba(255,120,0,0.15)]"
                : "text-[#949BA4] hover:text-white"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="rounded-2xl border border-[#2F3136] bg-[linear-gradient(180deg,#151515_0%,#101010_100%)] p-3 space-y-2">
        {isLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : isError ? (
          <div className="flex flex-col items-center py-12 gap-2">
            <p className="text-sm text-red-400 font-semibold">Ошибка загрузки</p>
            <p className="text-xs text-[#949BA4]">Попробуйте позже</p>
          </div>
        ) : tab === "teams" ? (
          <>
            {teamsList.map((team, idx) => (
              <TeamCard key={team.id} team={team} rank={idx + 1} />
            ))}
            {teamsHasMore && (
              <button
                onClick={() => setTeamsPage((p) => p + 1)}
                disabled={teamsQuery.isFetching}
                className="w-full py-2.5 mt-1 rounded-xl text-xs font-semibold text-[#FF7800] border border-[#FF7800]/20 hover:bg-[#FF7800]/8 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isFetchingMore ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                Загрузить ещё
              </button>
            )}
          </>
        ) : (
          <>
            {playersList.map((player, idx) => (
              <PlayerCard key={player.id} player={player} rank={idx + 1} />
            ))}
            {playersHasMore && (
              <button
                onClick={() => setPlayersPage((p) => p + 1)}
                disabled={playersQuery.isFetching}
                className="w-full py-2.5 mt-1 rounded-xl text-xs font-semibold text-[#FF7800] border border-[#FF7800]/20 hover:bg-[#FF7800]/8 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isFetchingMore ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                Загрузить ещё
              </button>
            )}
          </>
        )}
      </div>
    </>
  );
}

export default function TournamentGameRatingPage() {
  const { gameId } = useParams<{ gameId: string }>();
  const meta = gameId ? GAME_META[gameId as GameId] : undefined;

  if (!meta) {
    return (
      <div className="min-h-screen px-5 pt-7 pb-28">
        <Link to="/ratings" className="inline-flex items-center gap-2 text-sm text-[#C4CAD2]">
          <ArrowLeft className="h-4 w-4" />
          Назад к рейтингам
        </Link>
        <p className="mt-5 text-[#949BA4]">Раздел не найден.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-5 pt-7 pb-28">
      <Link to="/ratings" className="mb-4 inline-flex items-center gap-2 text-sm text-[#C4CAD2]">
        <ArrowLeft className="h-4 w-4" />
        Назад
      </Link>

      {/* Banner */}
      <div className="relative mb-5 h-[122px] overflow-hidden rounded-2xl border border-[#2F3136]">
        <img src={meta.image} alt={meta.title} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/20" />
        <div className="relative flex h-full items-center gap-3 px-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#2F3136] bg-[#1A1B1F] text-[#FF7800]">
            <Trophy className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-[30px] font-display leading-none">{meta.title}</h1>
            <p className="text-xs text-[#C4CAD2]">Рейтинг CYBER UNION · CA</p>
          </div>
        </div>
      </div>

      {/* Season label */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display text-[22px] leading-none">Топ по рейтингу</h2>
        <span className="text-[11px] uppercase tracking-wider text-[#949BA4]">Сезон 2026</span>
      </div>

      <TabContent gameId={gameId as GameId} />
    </div>
  );
}
