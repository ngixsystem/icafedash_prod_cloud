import { useState, useEffect } from "react";
import { ArrowLeft, Trophy, Users, Loader2, Shield, ChevronDown, X } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import cs2Banner from "@/assets/tournamentsgcs.jpg";
import dota2Banner from "@/assets/tournamentsgdota.jpg";
import pubgBanner from "@/assets/tournamentsgpubg.jpg";
import playerCardBg from "@/assets/fon_JPG.jpg";
import {
  useCyberUnionTeams,
  useCyberUnionPlayers,
  useCyberUnionTeamPlayers,
  type CyberUnionTeam,
  type CyberUnionPlayer,
  type CyberUnionTeamPlayer,
} from "@/hooks/use-cyberunion";

type GameId = "cs2" | "dota2" | "pubg-mobile";

const GAME_META: Record<GameId, { title: string; image: string }> = {
  "cs2":        { title: "CS2",        image: cs2Banner   },
  "dota2":      { title: "Dota 2",     image: dota2Banner },
  "pubg-mobile":{ title: "PUBG Mobile",image: pubgBanner  },
};

const RANK_COLORS = ["#FEE75C", "#C0C0C0", "#CD7F32"];

// ─── Карточка игрока на весь экран ──────────────────────────────────────────

function PlayerPhotoModal({
  player,
  onClose,
}: {
  player: { nickname: string; name: string; photo: string; points: number; team?: string | null };
  onClose: () => void;
}) {
  const isDefault = player.photo.includes("man.png") || player.photo.includes("no_image");

  // Имя → первое слово фамилия, остальное имя
  const nameParts = player.name.trim().split(" ");
  const lastName  = nameParts[0] ?? "";
  const firstName = nameParts.slice(1).join(" ");

  return (
    <div className="fixed inset-0 z-[1200]" onClick={onClose}>
      <div
        className="relative w-full max-w-[420px] h-full mx-auto overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── ФОН ── */}
        <img src={playerCardBg} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover" />
        {/* Затемнение для читаемости */}
        <div className="absolute inset-0 bg-black/40 pointer-events-none" />
        {/* Затемнение сверху */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />

        {/* Кнопка закрыть */}
        <button
          onClick={onClose}
          className="absolute top-12 right-5 z-10 w-9 h-9 rounded-full flex items-center justify-center text-white/60 hover:text-white transition-colors"
          style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" }}
        >
          <X className="w-4 h-4" />
        </button>

        {/* ── ФОТО — flex-1, занимает всё пространство выше текста ── */}
        <div className="relative flex-1 min-h-0">
          {!isDefault ? (
            <img
              src={player.photo}
              alt={player.nickname}
              className="absolute inset-0 w-full h-full"
              style={{ objectFit: "contain", objectPosition: "bottom center" }}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Users className="w-32 h-32 text-white/8" />
            </div>
          )}
          {/* Мягкий fade снизу фото → в текстовый блок */}
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#080b10] to-transparent pointer-events-none" />
        </div>

        {/* ── ЛИНИЯ — строго между flex-1 и текстом ── */}
        <div className="relative shrink-0 h-px mx-6 bg-gradient-to-r from-transparent via-[#FF7800]/60 to-transparent" />

        {/* ── ТЕКСТ СНИЗУ ── */}
        <div className="relative shrink-0 px-6 pt-5 pb-12" style={{ background: "linear-gradient(to bottom,rgba(0,0,0,0.7),rgba(0,0,0,0.85))" }}>
          {/* Никнейм */}
          <p
            className="text-[44px] font-black leading-none tracking-tight mb-1"
            style={{ background: "linear-gradient(90deg,#fff 60%,rgba(255,255,255,0.35))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
          >
            {player.nickname || lastName}
          </p>

          {/* Имя Фамилия */}
          {player.name && (
            <div className="flex items-baseline gap-2 mb-6">
              <span className="text-sm font-semibold text-white/60 uppercase tracking-widest">{firstName}</span>
              <span className="text-sm font-semibold text-white/30 uppercase tracking-widest">{lastName}</span>
            </div>
          )}

          {/* Команда + PTS */}
          <div className="flex items-end justify-between">
            {player.team ? (
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-[#FF7800]/50 mb-1">Команда</p>
                <p className="text-base font-black text-white">{player.team}</p>
              </div>
            ) : <div />}
            <div className="text-right">
              <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-[#FF7800]/50 mb-1">Рейтинг</p>
              <div className="flex items-baseline gap-1">
                <span
                  className="text-[40px] font-black leading-none"
                  style={{ background: "linear-gradient(135deg,#fff 0%,#FF9A2F 50%,#FF7800 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
                >
                  {player.points}
                </span>
                <span className="text-[10px] font-black text-[#FF7800]/50 uppercase tracking-widest mb-1">pts</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Скелетон ───────────────────────────────────────────────────────────────

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

// ─── Строка игрока в дропдауне команды ─────────────────────────────────────

function TeamPlayerRow({
  player,
  onPhotoClick,
}: {
  player: CyberUnionTeamPlayer;
  onPhotoClick: (p: CyberUnionTeamPlayer) => void;
}) {
  const isDefault = player.photo.includes("man.png") || player.photo.includes("no_image");
  return (
    <button
      onClick={() => onPhotoClick(player)}
      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-white/5 active:bg-white/8 transition-colors text-left"
    >
      <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 bg-[#1E1E1E] flex items-center justify-center border border-[#2F3136]">
        {!isDefault ? (
          <img src={player.photo} alt={player.nickname} className="w-full h-full object-cover" />
        ) : (
          <Users className="w-3.5 h-3.5 text-white/20" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-white truncate">{player.nickname || player.name}</p>
        {player.nickname && player.name !== player.nickname && (
          <p className="text-[10px] text-white/30 truncate">{player.name}</p>
        )}
      </div>
      <span className="text-xs font-bold text-[#FF9A2F] shrink-0">{player.points} pts</span>
    </button>
  );
}

// ─── Карточка команды с раскрываемым дропдауном ────────────────────────────

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
  const accentColor = rank <= 3 ? RANK_COLORS[rank - 1] : "#FF7800";
  const isDefault = team.photo.includes("star_default") || team.photo.includes("no_image");

  const playersQuery = useCyberUnionTeamPlayers(expanded ? team.name : null, gameId);

  return (
    <div className="rounded-xl border border-[#2A2A2A] bg-[#141414] overflow-hidden">
      {/* Основная строка */}
      <button
        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/3 active:bg-white/5 transition-colors text-left"
        onClick={() => setExpanded((v) => !v)}
      >
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
        <div className="shrink-0 flex items-center gap-2">
          <div className="text-right">
            <div className="text-sm font-bold text-[#FF9A2F]">{team.points}</div>
            <div className="text-[10px] uppercase text-[#949BA4]">Pts</div>
          </div>
          <ChevronDown
            className="w-4 h-4 text-white/30 transition-transform duration-200"
            style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}
          />
        </div>
      </button>

      {/* Дропдаун с игроками */}
      {expanded && (
        <div className="border-t border-[#2A2A2A] px-2 py-1.5 space-y-0.5 bg-[#111213]">
          {playersQuery.isLoading ? (
            <div className="flex justify-center py-3">
              <Loader2 className="w-4 h-4 animate-spin text-[#FF7800]" />
            </div>
          ) : playersQuery.isError ? (
            <p className="text-xs text-red-400 text-center py-2">Ошибка загрузки</p>
          ) : !playersQuery.data?.items.length ? (
            <p className="text-xs text-white/25 text-center py-2">Нет игроков</p>
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

// ─── Карточка игрока (вкладка Игроки) ──────────────────────────────────────

function PlayerCard({
  player,
  rank,
  onPhotoClick,
}: {
  player: CyberUnionPlayer;
  rank: number;
  onPhotoClick: (p: CyberUnionPlayer) => void;
}) {
  const accentColor = rank <= 3 ? RANK_COLORS[rank - 1] : "#FF7800";
  const isDefault = player.photo.includes("man.png") || player.photo.includes("no_image");
  return (
    <button
      onClick={() => onPhotoClick(player)}
      className="w-full flex items-center gap-3 rounded-xl border border-[#2A2A2A] bg-[#141414] px-3 py-2.5 hover:bg-[#141414]/80 active:bg-white/5 transition-colors text-left"
    >
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
          {player.team && <span className="text-[#2F3136] text-[10px]">·</span>}
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
    </button>
  );
}

// ─── Основной контент вкладок ───────────────────────────────────────────────

function TabContent({ gameId }: { gameId: GameId }) {
  const [tab, setTab] = useState<"teams" | "players">("teams");
  const [teamsPage, setTeamsPage] = useState(1);
  const [playersPage, setPlayersPage] = useState(1);
  const [teamsList, setTeamsList] = useState<CyberUnionTeam[]>([]);
  const [playersList, setPlayersList] = useState<CyberUnionPlayer[]>([]);
  const [modalPlayer, setModalPlayer] = useState<{
    nickname: string; name: string; photo: string; points: number; team?: string | null;
  } | null>(null);

  const teamsQuery = useCyberUnionTeams(gameId, teamsPage);
  const playersQuery = useCyberUnionPlayers(gameId, playersPage);

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
      {/* Tab switcher */}
      <div className="flex gap-1 mb-4 p-1 rounded-2xl bg-[#151515] border border-[#2F3136]">
        {([
          { id: "teams",   label: "Команды", icon: Shield },
          { id: "players", label: "Игроки",  icon: Users  },
        ] as const).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
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
          <><SkeletonCard /><SkeletonCard /><SkeletonCard /></>
        ) : isError ? (
          <div className="flex flex-col items-center py-12 gap-2">
            <p className="text-sm text-red-400 font-semibold">Ошибка загрузки</p>
            <p className="text-xs text-[#949BA4]">Попробуйте позже</p>
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
                className="w-full py-2.5 mt-1 rounded-xl text-xs font-semibold text-[#FF7800] border border-[#FF7800]/20 hover:bg-[#FF7800]/8 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isFetchingMore && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Загрузить ещё
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
                className="w-full py-2.5 mt-1 rounded-xl text-xs font-semibold text-[#FF7800] border border-[#FF7800]/20 hover:bg-[#FF7800]/8 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isFetchingMore && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Загрузить ещё
              </button>
            )}
          </>
        )}
      </div>

      {/* Модалка фото */}
      {modalPlayer && (
        <PlayerPhotoModal player={modalPlayer} onClose={() => setModalPlayer(null)} />
      )}
    </>
  );
}

// ─── Страница ───────────────────────────────────────────────────────────────

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

      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display text-[22px] leading-none">Топ по рейтингу</h2>
        <span className="text-[11px] uppercase tracking-wider text-[#949BA4]">Сезон 2026</span>
      </div>

      {gameId === "cs2" ? (
        <TabContent gameId={gameId as GameId} />
      ) : (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-16 h-16 rounded-2xl border border-[#2F3136] bg-[#151515] flex items-center justify-center">
            <Trophy className="w-7 h-7 text-[#FF7800]/50" />
          </div>
          <p className="text-lg font-bold text-white/80">Раздел в разработке</p>
          <p className="text-sm text-[#949BA4] text-center max-w-[260px]">Рейтинг для этой игры появится в ближайшее время</p>
        </div>
      )}
    </div>
  );
}
