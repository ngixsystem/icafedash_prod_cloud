import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Trophy, Loader2, RefreshCw } from "lucide-react";
import { FaceitLevelIcon } from "@/components/FaceitLevelIcon";

const API = import.meta.env.VITE_API_URL ?? "";

interface RankEntry {
  position: number;
  faceit_points: number;
  nickname: string;
  avatar: string;
  player_id: string;
  country: string;
  skill_level: number | null;
  faceit_elo: number | null;
}

function useUzRankings() {
  return useQuery<{ total: number; items: RankEntry[] }>({
    queryKey: ["faceit_uz_rankings"],
    queryFn: async () => {
      const resp = await fetch(`${API}/public/faceit/rankings/uzbekistan?limit=100`);
      if (!resp.ok) throw new Error("Failed to fetch rankings");
      return resp.json();
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

const MEDAL: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

function levelColor(level: number | null) {
  if (!level) return "#aaa";
  if (level >= 10) return "#ff5500";
  if (level >= 7) return "#f5a623";
  if (level >= 4) return "#f8e71c";
  return "#7ed321";
}

export default function FaceitUzRankingsPage() {
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch, isFetching } = useUzRankings();

  return (
    <div className="pb-24 min-h-screen">
      {/* Шапка */}
      <div className="relative overflow-hidden px-4 pt-6 pb-5">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-48 h-48 rounded-full bg-[#FF5500]/10 blur-3xl" />
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-[#f5a623]/8 blur-3xl" />
        </div>

        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-1.5 text-white/50 hover:text-white transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Назад
            </button>
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="flex items-center gap-1.5 text-white/40 hover:text-white/70 transition-colors text-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} />
              Обновить
            </button>
          </div>

          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-[#FF5500]/15 flex items-center justify-center">
              <Trophy className="w-3.5 h-3.5 text-[#FF5500]" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#FF5500]">FACEIT</span>
          </div>
          <h1 className="text-2xl font-black text-white leading-tight">
            Рейтинг{" "}
            <span style={{ background: "linear-gradient(90deg,#FF5500,#f5a623)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Uzbekistan
            </span>
          </h1>
          <p className="text-xs text-white/35 mt-1">Топ-100 CS2 · EU регион</p>
        </div>
      </div>

      {/* Контент */}
      <div className="px-4">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#FF5500]" />
            <p className="text-xs text-white/40">Загружаем данные с FACEIT...</p>
          </div>
        )}

        {isError && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Trophy className="w-10 h-10 text-white/20" />
            <p className="text-sm text-white/50 text-center">Не удалось загрузить рейтинг</p>
            <p className="text-xs text-white/30 text-center">Проверь настройку FACEIT API ключа</p>
            <button
              onClick={() => refetch()}
              className="mt-2 px-4 py-2 rounded-lg bg-[#FF5500]/20 text-[#FF5500] text-sm font-medium"
            >
              Попробовать снова
            </button>
          </div>
        )}

        {data && data.items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <p className="text-sm text-white/50">Рейтинг пуст</p>
          </div>
        )}

        {data && data.items.length > 0 && (
          <div className="space-y-2">
            {data.items.map((entry) => (
              <a
                key={entry.player_id}
                href={`https://www.faceit.com/en/players/${entry.nickname}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2.5 hover:bg-white/[0.06] transition-colors active:scale-[0.99]"
              >
                {/* Позиция */}
                <div className="w-8 text-center shrink-0">
                  {MEDAL[entry.position] ? (
                    <span className="text-lg">{MEDAL[entry.position]}</span>
                  ) : (
                    <span className="text-xs font-bold text-white/40">#{entry.position}</span>
                  )}
                </div>

                {/* Аватар */}
                <div className="relative shrink-0">
                  {entry.avatar ? (
                    <img
                      src={entry.avatar}
                      alt={entry.nickname}
                      className="w-9 h-9 rounded-full object-cover border border-white/10"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-sm font-bold text-white/50">
                      {entry.nickname?.[0]?.toUpperCase() ?? "?"}
                    </div>
                  )}
                  {entry.skill_level && (
                    <div className="absolute -bottom-1 -right-1">
                      <FaceitLevelIcon level={entry.skill_level} size={14} />
                    </div>
                  )}
                </div>

                {/* Ник и флаг */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{entry.nickname}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {entry.skill_level && (
                      <span className="text-[10px] font-bold" style={{ color: levelColor(entry.skill_level) }}>
                        Lvl {entry.skill_level}
                      </span>
                    )}
                    {entry.faceit_elo && (
                      <span className="text-[10px] text-white/40">{entry.faceit_elo} ELO</span>
                    )}
                  </div>
                </div>

                {/* Очки / ELO */}
                {entry.faceit_points ? (
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-[#FF5500]">{entry.faceit_points.toLocaleString()}</p>
                    <p className="text-[10px] text-white/30">pts</p>
                  </div>
                ) : entry.faceit_elo ? (
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-[#FF5500]">{entry.faceit_elo}</p>
                    <p className="text-[10px] text-white/30">ELO</p>
                  </div>
                ) : null}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
