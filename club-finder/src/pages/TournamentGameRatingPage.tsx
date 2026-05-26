import { useEffect, useState } from "react";
import { ArrowLeft, ChevronDown, Loader2, Shield, Trophy, Users, X } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import cs2Banner from "@/assets/tournamentsgcs.jpg";
import dota2Banner from "@/assets/tournamentsgdota.jpg";
import pubgBanner from "@/assets/tournamentsgpubg.jpg";
import playerCardBg from "@/assets/fon_JPG.jpg";
import {
  useCyberUnionPlayers,
  useCyberUnionTeamPlayers,
  useCyberUnionTeams,
  type CyberUnionPlayer,
  type CyberUnionTeam,
  type CyberUnionTeamPlayer,
} from "@/hooks/use-cyberunion";

type GameId = "cs2" | "dota2" | "pubg-mobile";

const GAME_META: Record<GameId, { title: string; image: string }> = {
  cs2: { title: "CS2", image: cs2Banner },
  dota2: { title: "Dota 2", image: dota2Banner },
  "pubg-mobile": { title: "PUBG Mobile", image: pubgBanner },
};

const RANK_COLORS = ["#FACC15", "#D7DEE8", "#D58A39"];

function rankTone(rank: number) {
  if (rank <= 3) return RANK_COLORS[rank - 1];
  return "#FF8A00";
}

function isFallbackImage(src?: string | null) {
  return !src || src.includes("man.png") || src.includes("no_image") || src.includes("star_default");
}

function PlayerPhotoModal({
  player,
  onClose,
}: {
  player: { nickname: string; name: string; photo: string; points: number; team?: string | null };
  onClose: () => void;
}) {
  const nameParts = player.name.trim().split(" ");
  const lastName = nameParts[0] ?? "";
  const firstName = nameParts.slice(1).join(" ");

  return (
    <div className="fixed inset-0 z-[1200] bg-black/80 backdrop-blur-xl" onClick={onClose}>
      <div
        className="relative mx-auto flex h-full w-full max-w-[430px] flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <img src={playerCardBg} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/35 to-[#070707]" />

        <button
          onClick={onClose}
          className="absolute right-5 top-12 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/50 text-white/70 backdrop-blur"
          aria-label="Закрыть"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="relative flex flex-1 items-end justify-center">
          {!isFallbackImage(player.photo) ? (
            <img src={player.photo} alt={player.nickname} className="max-h-full w-full object-contain object-bottom" />
          ) : (
            <Users className="mb-28 h-28 w-28 text-white/10" />
          )}
        </div>

        <div className="relative border-t border-orange-400/40 bg-black/75 px-6 pb-12 pt-5">
          <p className="text-[42px] font-black leading-none tracking-tight text-white">
            {player.nickname || lastName}
          </p>
          {player.name && (
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-xs font-bold uppercase tracking-[0.22em] text-white/55">{firstName}</span>
              <span className="text-xs font-bold uppercase tracking-[0.22em] text-white/25">{lastName}</span>
            </div>
          )}

          <div className="mt-7 flex items-end justify-between">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.24em] text-orange-400/60">Команда</p>
              <p className="mt-1 text-base font-black text-white">{player.team || "Без команды"}</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-black uppercase tracking-[0.24em] text-orange-400/60">Рейтинг</p>
              <div className="mt-1 flex items-end gap-1">
                <span className="text-[38px] font-black leading-none text-orange-400">{player.points}</span>
                <span className="mb-1 text-[10px] font-black uppercase text-orange-300/70">pts</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="flex items-center gap-3 rounded-[18px] border border-white/8 bg-white/[0.035] p-3">
      <div className="h-9 w-9 animate-pulse rounded-2xl bg-white/10" />
      <div className="h-11 w-11 animate-pulse rounded-2xl bg-white/10" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-2/3 animate-pulse rounded bg-white/10" />
        <div className="h-2.5 w-1/3 animate-pulse rounded bg-white/5" />
      </div>
      <div className="h-5 w-12 animate-pulse rounded bg-white/10" />
    </div>
  );
}

function TeamPlayerRow({
  player,
  onPhotoClick,
}: {
  player: CyberUnionTeamPlayer;
  onPhotoClick: (p: CyberUnionTeamPlayer) => void;
}) {
  return (
    <button
      onClick={() => onPhotoClick(player)}
      className="flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-left transition active:bg-white/10"
    >
      <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white/7">
        {!isFallbackImage(player.photo) ? (
          <img src={player.photo} alt={player.nickname} className="h-full w-full object-cover" />
        ) : (
          <Users className="h-4 w-4 text-white/25" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-black text-white">{player.nickname || player.name}</p>
        {player.nickname && player.name !== player.nickname && (
          <p className="truncate text-[10px] text-white/35">{player.name}</p>
        )}
      </div>
      <span className="shrink-0 text-xs font-black text-orange-300">{player.points} pts</span>
    </button>
  );
}

function TeamCard({
  team,
  rank,
  gameId,
  onPlayerPhotoClick,
}: {
  team: CyberUnionTeam;
  rank: number;
  gameId: string;
  onPlayerPhotoClick: (p: CyberUnionTeamPlayer) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const playersQuery = useCyberUnionTeamPlayers(expanded ? team.name : null, gameId);
  const accent = rankTone(rank);

  return (
    <div className="overflow-hidden rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.025))] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
      <button
        className="flex w-full items-center gap-3 px-3 py-3 text-left transition active:bg-white/5"
        onClick={() => setExpanded((v) => !v)}
      >
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border bg-black/35 text-sm font-black"
          style={{ color: accent, borderColor: `${accent}55` }}
        >
          {rank}
        </div>
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-black/45">
          {!isFallbackImage(team.photo) ? (
            <img src={team.photo} alt={team.name} className="h-full w-full object-cover" />
          ) : (
            <Shield className="h-5 w-5 text-white/25" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="truncate text-[15px] font-black leading-tight text-white">{team.name}</div>
          <div className="mt-1 flex items-center gap-1.5">
            {team.region_photo && !team.region_photo.includes("no_image") && (
              <img src={team.region_photo} alt={team.region} className="h-4 w-4 rounded-full object-cover" />
            )}
            <span className="truncate text-[11px] text-white/45">{team.region || "Регион не указан"}</span>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <div className="text-base font-black leading-none text-orange-400">{team.points}</div>
          <div className="mt-1 text-[9px] font-bold uppercase tracking-wider text-white/35">pts</div>
        </div>
        <ChevronDown
          className="h-4 w-4 shrink-0 text-white/35 transition-transform"
          style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>

      {expanded && (
        <div className="border-t border-white/10 bg-black/25 px-2 py-2">
          {playersQuery.isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin text-orange-400" />
            </div>
          ) : playersQuery.isError ? (
            <p className="py-3 text-center text-xs text-red-300">Ошибка загрузки состава</p>
          ) : !playersQuery.data?.items.length ? (
            <p className="py-3 text-center text-xs text-white/35">Состав пока не указан</p>
          ) : (
            playersQuery.data.items.map((p) => (
              <TeamPlayerRow key={p.id} player={p} onPhotoClick={onPlayerPhotoClick} />
            ))
          )}
        </div>
      )}
    </div>
  );
}

function PlayerCard({
  player,
  rank,
  onPhotoClick,
}: {
  player: CyberUnionPlayer;
  rank: number;
  onPhotoClick: (p: CyberUnionPlayer) => void;
}) {
  const accent = rankTone(rank);

  return (
    <button
      onClick={() => onPhotoClick(player)}
      className="flex w-full items-center gap-3 rounded-[22px] border border-white/10 bg-white/[0.04] px-3 py-3 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition active:bg-white/8"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border bg-black/35 text-sm font-black" style={{ color: accent, borderColor: `${accent}55` }}>
        {rank}
      </div>
      <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-black/45">
        {!isFallbackImage(player.photo) ? (
          <img src={player.photo} alt={player.nickname} className="h-full w-full object-cover" />
        ) : (
          <Users className="h-5 w-5 text-white/25" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[15px] font-black leading-tight text-white">
          {player.nickname || player.name}
        </div>
        <div className="mt-1 flex items-center gap-1.5">
          {player.team && <span className="max-w-[110px] truncate text-[11px] text-orange-300/80">{player.team}</span>}
          {player.team && <span className="text-white/20">·</span>}
          {player.region_photo && !player.region_photo.includes("no_image") && (
            <img src={player.region_photo} alt={player.region} className="h-4 w-4 rounded-full object-cover" />
          )}
          <span className="truncate text-[11px] text-white/45">{player.region}</span>
        </div>
      </div>
      <div className="shrink-0 text-right">
        <div className="text-base font-black leading-none text-orange-400">{player.points}</div>
        <div className="mt-1 text-[9px] font-bold uppercase tracking-wider text-white/35">pts</div>
      </div>
    </button>
  );
}

function TabContent({ gameId }: { gameId: GameId }) {
  const [tab, setTab] = useState<"teams" | "players">("teams");
  const [teamsPage, setTeamsPage] = useState(1);
  const [playersPage, setPlayersPage] = useState(1);
  const [teamsList, setTeamsList] = useState<CyberUnionTeam[]>([]);
  const [playersList, setPlayersList] = useState<CyberUnionPlayer[]>([]);
  const [modalPlayer, setModalPlayer] = useState<{
    nickname: string;
    name: string;
    photo: string;
    points: number;
    team?: string | null;
  } | null>(null);

  const teamsQuery = useCyberUnionTeams(gameId, teamsPage);
  const playersQuery = useCyberUnionPlayers(gameId, playersPage);

  useEffect(() => {
    if (!teamsQuery.data) return;
    setTeamsList((prev) => {
      const ids = new Set(prev.map((t) => t.id));
      return [...prev, ...teamsQuery.data.items.filter((t) => !ids.has(t.id))];
    });
  }, [teamsQuery.data]);

  useEffect(() => {
    if (!playersQuery.data) return;
    setPlayersList((prev) => {
      const ids = new Set(prev.map((p) => p.id));
      return [...prev, ...playersQuery.data.items.filter((p) => !ids.has(p.id))];
    });
  }, [playersQuery.data]);

  const teamsTotal = teamsQuery.data?.total ?? 0;
  const playersTotal = playersQuery.data?.total ?? 0;
  const teamsHasMore = teamsList.length < teamsTotal;
  const playersHasMore = playersList.length < playersTotal;
  const isLoading = tab === "teams" ? teamsQuery.isLoading : playersQuery.isLoading;
  const isError = tab === "teams" ? teamsQuery.isError : playersQuery.isError;
  const isFetchingMore = tab === "teams"
    ? teamsQuery.isFetching && teamsPage > 1
    : playersQuery.isFetching && playersPage > 1;

  return (
    <>
      <div className="sticky top-[74px] z-20 -mx-1 mb-4 rounded-[22px] border border-white/10 bg-black/65 p-1 shadow-[0_12px_30px_rgba(0,0,0,0.35)] backdrop-blur-xl">
        {([
          { id: "teams", label: "Команды", icon: Shield },
          { id: "players", label: "Игроки", icon: Users },
        ] as const).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`inline-flex w-1/2 items-center justify-center gap-2 rounded-[18px] py-3 text-[11px] font-black uppercase tracking-[0.12em] transition ${
              tab === id
                ? "bg-orange-500 text-black shadow-[0_0_22px_rgba(255,120,0,0.28)]"
                : "text-white/45"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      <div className="space-y-2.5">
        {isLoading ? (
          <><SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard /></>
        ) : isError ? (
          <div className="rounded-[24px] border border-red-400/20 bg-red-500/10 py-12 text-center">
            <p className="text-sm font-bold text-red-300">Ошибка загрузки</p>
            <p className="mt-1 text-xs text-white/45">Попробуйте позже</p>
          </div>
        ) : tab === "teams" ? (
          <>
            {teamsList.map((team, idx) => (
              <TeamCard
                key={team.id}
                team={team}
                rank={idx + 1}
                gameId={gameId}
                onPlayerPhotoClick={(p) => setModalPlayer({ ...p, team: team.name })}
              />
            ))}
            {teamsHasMore && (
              <button
                onClick={() => setTeamsPage((p) => p + 1)}
                disabled={teamsQuery.isFetching}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-[20px] border border-orange-400/25 bg-orange-400/10 py-3 text-xs font-black uppercase tracking-wider text-orange-300 disabled:opacity-50"
              >
                {isFetchingMore && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Загрузить еще
              </button>
            )}
          </>
        ) : (
          <>
            {playersList.map((player, idx) => (
              <PlayerCard
                key={player.id}
                player={player}
                rank={idx + 1}
                onPhotoClick={(p) => setModalPlayer(p)}
              />
            ))}
            {playersHasMore && (
              <button
                onClick={() => setPlayersPage((p) => p + 1)}
                disabled={playersQuery.isFetching}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-[20px] border border-orange-400/25 bg-orange-400/10 py-3 text-xs font-black uppercase tracking-wider text-orange-300 disabled:opacity-50"
              >
                {isFetchingMore && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Загрузить еще
              </button>
            )}
          </>
        )}
      </div>

      {modalPlayer && <PlayerPhotoModal player={modalPlayer} onClose={() => setModalPlayer(null)} />}
    </>
  );
}

export default function TournamentGameRatingPage() {
  const { gameId } = useParams<{ gameId: string }>();
  const meta = gameId ? GAME_META[gameId as GameId] : undefined;

  if (!meta) {
    return (
      <div className="min-h-screen px-5 pb-28 pt-7">
        <Link to="/ratings" className="inline-flex items-center gap-2 text-sm text-white/70">
          <ArrowLeft className="h-4 w-4" />
          Назад к рейтингам
        </Link>
        <p className="mt-5 text-white/45">Раздел не найден.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 pb-28 pt-4 text-white">
      <Link to="/ratings" className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white/75">
        <ArrowLeft className="h-4 w-4" />
        Назад
      </Link>

      <div className="relative mb-5 overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.04] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
        <div className="relative h-[156px]">
          <img src={meta.image} alt={meta.title} className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.9),rgba(0,0,0,0.42),rgba(255,120,0,0.24))]" />
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/85 to-transparent" />
          <div className="relative flex h-full flex-col justify-end px-5 pb-5">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl border border-orange-300/25 bg-black/45 text-orange-300 backdrop-blur">
              <Trophy className="h-5 w-5" />
            </div>
            <h1 className="font-display text-[42px] leading-none tracking-wide">{meta.title}</h1>
            <p className="mt-1 text-xs font-medium text-white/60">Рейтинг CYBER UNION · Central Asia</p>
          </div>
        </div>

        <div className="grid grid-cols-3 border-t border-white/10 bg-black/35 px-4 py-3 text-center">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/35">Сезон</p>
            <p className="mt-1 text-sm font-black text-white">2026</p>
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/35">Регион</p>
            <p className="mt-1 text-sm font-black text-white">CA</p>
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/35">Тип</p>
            <p className="mt-1 text-sm font-black text-orange-300">Rating</p>
          </div>
        </div>
      </div>

      <div className="mb-3 flex items-end justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-orange-300/70">Leaderboard</p>
          <h2 className="font-display text-[29px] leading-none">Топ рейтинга</h2>
        </div>
        <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white/45">
          Live
        </span>
      </div>

      {(gameId === "cs2" || gameId === "pubg-mobile") ? (
        <TabContent key={gameId} gameId={gameId as GameId} />
      ) : (
        <div className="flex flex-col items-center justify-center gap-4 py-20">
          <div className="flex h-16 w-16 items-center justify-center rounded-[24px] border border-white/10 bg-white/[0.04]">
            <Trophy className="h-7 w-7 text-orange-300/60" />
          </div>
          <p className="text-lg font-black text-white/85">Раздел в разработке</p>
          <p className="max-w-[260px] text-center text-sm text-white/45">Рейтинг для этой игры появится в ближайшее время</p>
        </div>
      )}
    </div>
  );
}
