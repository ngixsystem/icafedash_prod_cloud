import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/lib/api";
import { Monitor, RefreshCcw, UserRound } from "lucide-react";

const Monitoring = () => {
    const [hoveredBusyPc, setHoveredBusyPc] = useState<{
        id: string | number;
        name: string;
        member: string;
        time_left?: string;
    } | null>(null);

    const { data, isLoading, refetch, isFetching } = useQuery({
        queryKey: ["pcs"],
        queryFn: api.pcs,
        refetchInterval: 30_000,
    });

    const pcs = data?.pcs ?? [];
    const sortedPcs = [...pcs].sort((a, b) => String(a.name).localeCompare(String(b.name)));

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Мониторинг</h2>
                    <p className="text-muted-foreground">Интерактивная карта клуба</p>
                </div>
                <button
                    onClick={() => refetch()}
                    disabled={isFetching}
                    className="inline-flex items-center gap-2 rounded-lg bg-secondary px-3 py-2 text-sm font-medium hover:bg-secondary/80 disabled:opacity-50"
                >
                    <RefreshCcw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
                    Обновить
                </button>
            </div>

            <div className="relative rounded-xl border border-border bg-card p-6 min-h-[600px] overflow-auto">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-[500px] space-y-4">
                        <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                        <p className="text-sm text-muted-foreground">Загрузка карты...</p>
                    </div>
                ) : (
                    <div className="relative w-fit h-fit min-w-full min-h-[500px]">
                        {pcs.map((pc) => (
                            <div
                                key={pc.id}
                                className={`absolute w-16 h-16 rounded-lg border-2 flex flex-col items-center justify-center p-1 transition-all hover:scale-110 cursor-pointer shadow-lg
                  ${pc.status === "busy"
                                        ? "border-orange-500/50 bg-orange-500/10 text-orange-500"
                                        : pc.status === "offline"
                                            ? "border-muted-foreground/30 bg-muted/20 text-muted-foreground"
                                            : "border-success/50 bg-success/10 text-success"
                                    }`}
                                onMouseEnter={() => {
                                    if (pc.status !== "busy") return;
                                    setHoveredBusyPc({
                                        id: pc.id,
                                        name: pc.name,
                                        member: pc.member || "Не указано",
                                        time_left: pc.time_left || "",
                                    });
                                }}
                                onMouseLeave={() => setHoveredBusyPc(null)}
                                style={{
                                    top: pc.top ?? 0,
                                    left: pc.left ?? 0,
                                }}
                                title={`${pc.name} - ${pc.status}${pc.member ? ` (${pc.member})` : ""}`}
                            >
                                {pc.status === "busy" && (
                                    <span
                                        className="absolute -top-1 -right-1 h-4 w-4 rounded-full border border-orange-300/60 bg-orange-500 text-white shadow-[0_0_8px_rgba(249,115,22,0.45)] flex items-center justify-center"
                                        title="Клиент за ПК"
                                    >
                                        <UserRound className="h-2.5 w-2.5" />
                                    </span>
                                )}
                                <Monitor className="h-4 w-4 mb-1" />
                                <span className="text-[10px] font-bold truncate w-full text-center">
                                    {pc.name}
                                </span>
                                {pc.time_left && (
                                    <span className="text-[8px] opacity-80">{pc.time_left}</span>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {hoveredBusyPc && (
                <div className="rounded-xl border border-orange-500/40 bg-orange-500/10 p-4">
                    <div className="text-sm font-semibold text-orange-400">
                        {hoveredBusyPc.name} занят
                    </div>
                    <div className="text-sm text-foreground mt-1">
                        Клиент: <span className="font-medium">{hoveredBusyPc.member}</span>
                    </div>
                    {hoveredBusyPc.time_left && (
                        <div className="text-xs text-muted-foreground mt-1">
                            Осталось времени: {hoveredBusyPc.time_left}
                        </div>
                    )}
                </div>
            )}

            <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="px-4 py-3 border-b border-border/60">
                    <h3 className="text-sm font-semibold text-foreground">Список ПК</h3>
                    <p className="text-xs text-muted-foreground">Красивый и адаптивный список для мобильных и desktop</p>
                </div>

                <div className="divide-y divide-border/50">
                    {sortedPcs.map((pc) => {
                        const isBusy = pc.status === "busy";
                        const isFree = pc.status === "free";
                        const statusLabel = isBusy ? "занято" : isFree ? "свободно" : "блокировка";
                        const statusClass = isBusy
                            ? "bg-orange-500/15 text-orange-400 border-orange-500/40"
                            : isFree
                                ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/40"
                                : "bg-muted/20 text-muted-foreground border-muted-foreground/30";

                        return (
                            <div key={`row-${pc.id}`} className="px-4 py-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="h-8 w-8 rounded-lg bg-secondary/60 border border-border flex items-center justify-center shrink-0">
                                        <Monitor className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-sm font-semibold text-foreground truncate">{pc.name}</div>
                                        <div className="text-xs text-muted-foreground truncate">{pc.member || "—"}</div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 sm:justify-end">
                                    {pc.time_left && (
                                        <span className="text-[11px] text-muted-foreground">{pc.time_left}</span>
                                    )}
                                    <span className={`text-xs rounded-full border px-2 py-1 font-medium ${statusClass}`}>
                                        {statusLabel}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="flex flex-wrap gap-4 pt-2">
                <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded bg-success/20 border border-success/50" />
                    <span className="text-xs text-muted-foreground">Свободен</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded bg-orange-500/20 border border-orange-500/50" />
                    <span className="text-xs text-muted-foreground">Занят</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded bg-muted/20 border border-muted-foreground/30" />
                    <span className="text-xs text-muted-foreground">Оффлайн</span>
                </div>
            </div>
        </div>
    );
};

export default Monitoring;
