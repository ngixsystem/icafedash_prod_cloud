import { useFaceitStats } from "@/hooks/use-faceit-stats";
import { Loader2, Crosshair, Target, Trophy, Flame, Swords, BarChart3 } from "lucide-react";

const STAT_CARDS = [
  { key: "matches", label: "Матчей", icon: Swords, color: "#FF7800" },
  { key: "win_rate", label: "Винрейт", icon: Trophy, suffix: "%", color: "#22c55e" },
  { key: "kd_ratio", label: "K/D", icon: Crosshair, color: "#3b82f6" },
  { key: "headshots", label: "HS %", icon: Target, suffix: "%", color: "#a855f7" },
] as const;

export default function FaceitStats({ token }: { token: string | null }) {
  const { data, isLoading, isError } = useFaceitStats(token);

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
        Не удалось загрузить статистику
      </div>
    );
  }

  const { lifetime, maps } = data;

  return (
    <div className="px-4 space-y-4 pb-4">
      {/* Stat cards grid */}
      <div className="grid grid-cols-2 gap-2.5">
        {STAT_CARDS.map(({ key, label, icon: Icon, suffix, color }) => {
          const raw = lifetime[key as keyof typeof lifetime] ?? "0";
          const value = suffix && !String(raw).includes("%") ? `${raw}${suffix}` : raw;
          return (
            <div
              key={key}
              className="rounded-2xl glass border border-white/8 p-4 flex flex-col gap-2"
            >
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: `${color}15` }}
              >
                <Icon className="w-4 h-4" style={{ color }} />
              </div>
              <span className="text-2xl font-display font-bold leading-none">{value}</span>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                {label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Streaks */}
      <div className="flex gap-2.5">
        <div className="flex-1 rounded-2xl glass border border-white/8 p-3.5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#f97316]/15 flex items-center justify-center">
            <Flame className="w-4 h-4 text-[#f97316]" />
          </div>
          <div>
            <span className="text-lg font-bold leading-none">{lifetime.current_win_streak}</span>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mt-0.5">
              Текущая серия
            </p>
          </div>
        </div>
        <div className="flex-1 rounded-2xl glass border border-white/8 p-3.5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#eab308]/15 flex items-center justify-center">
            <Trophy className="w-4 h-4 text-[#eab308]" />
          </div>
          <div>
            <span className="text-lg font-bold leading-none">{lifetime.longest_win_streak}</span>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mt-0.5">
              Лучшая серия
            </p>
          </div>
        </div>
      </div>

      {/* Map stats */}
      {maps.length > 0 && (
        <div className="rounded-2xl glass border border-white/8 p-4">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs uppercase tracking-widest font-bold text-muted-foreground">
              Карты
            </span>
          </div>
          <div className="space-y-3">
            {maps.slice(0, 6).map((m) => {
              const wr = parseFloat(m.win_rate) || 0;
              const barColor = wr >= 55 ? "#22c55e" : wr >= 45 ? "#eab308" : "#ef4444";
              return (
                <div key={m.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{m.name}</span>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>K/D {m.avg_kd}</span>
                      <span>{m.matches} игр</span>
                      <span className="font-bold" style={{ color: barColor }}>
                        {m.win_rate}%
                      </span>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${wr}%`, background: barColor }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
