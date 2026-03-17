import { useFaceitHistory } from "@/hooks/use-faceit-stats";
import { Loader2 } from "lucide-react";

function timeAgo(ts: number | null): string {
  if (!ts) return "";
  const diff = Math.floor(Date.now() / 1000) - ts;
  if (diff < 60) return "только что";
  if (diff < 3600) return `${Math.floor(diff / 60)} мин назад`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ч назад`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} дн назад`;
  const d = new Date(ts * 1000);
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}

function MapIcon({ map }: { map: string | null }) {
  const name = (map || "").replace("de_", "").charAt(0).toUpperCase() + (map || "").replace("de_", "").slice(1);
  return (
    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">
      {name.slice(0, 3) || "?"}
    </div>
  );
}

export default function FaceitMatchHistory({ token }: { token: string | null }) {
  const { data, isLoading, isError } = useFaceitHistory(token);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="px-4 py-12 text-center text-sm text-muted-foreground">
        Не удалось загрузить историю матчей
      </div>
    );
  }

  if (!data.matches.length) {
    return (
      <div className="px-4 py-12 text-center text-sm text-muted-foreground">
        Нет матчей
      </div>
    );
  }

  return (
    <div className="px-4 space-y-2 pb-4">
      {data.matches.map((m) => {
        const isWin = m.is_win === true;
        const isLoss = m.is_win === false;
        const borderColor = isWin ? "#22c55e" : isLoss ? "#ef4444" : "#6b7280";
        const resultLabel = isWin ? "W" : isLoss ? "L" : "—";
        const resultColor = isWin ? "#22c55e" : isLoss ? "#ef4444" : "#6b7280";
        const mapName = (m.map || "Unknown").replace("de_", "");

        return (
          <div
            key={m.match_id}
            className="rounded-2xl glass border border-white/8 overflow-hidden"
          >
            {/* Color accent bar */}
            <div className="h-0.5" style={{ background: borderColor }} />

            <div className="p-3.5 flex items-center gap-3">
              {/* Map icon */}
              <MapIcon map={m.map} />

              {/* Main info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span
                    className="text-xs font-black w-5 text-center"
                    style={{ color: resultColor }}
                  >
                    {resultLabel}
                  </span>
                  <span className="text-sm font-bold capitalize">{mapName}</span>
                  <span className="text-sm font-mono font-bold text-muted-foreground">
                    {m.score}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  {m.opponent_name && (
                    <>
                      <span>vs {m.opponent_name}</span>
                      <span className="opacity-30">·</span>
                    </>
                  )}
                  <span>{timeAgo(m.finished_at)}</span>
                </div>
              </div>

              {/* Stats */}
              {m.stats && (
                <div className="text-right shrink-0">
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-sm font-bold">{m.stats.kills}</span>
                    <span className="text-[10px] text-muted-foreground">/</span>
                    <span className="text-sm text-muted-foreground">{m.stats.deaths}</span>
                    <span className="text-[10px] text-muted-foreground">/</span>
                    <span className="text-sm text-muted-foreground">{m.stats.assists}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                    <span
                      className="font-bold"
                      style={{
                        color: parseFloat(m.stats.kd) >= 1.0 ? "#22c55e" : "#ef4444",
                      }}
                    >
                      {m.stats.kd} K/D
                    </span>
                    {parseInt(m.stats.mvps) > 0 && (
                      <span className="text-[#eab308]">★{m.stats.mvps}</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
