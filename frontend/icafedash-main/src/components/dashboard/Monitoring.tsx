import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/lib/api";
import { Monitor, RefreshCcw } from "lucide-react";

const Monitoring = () => {
    const [selectedBusyPc, setSelectedBusyPc] = useState<{
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
                        {/* The container will expand based on absolute items thanks to min-w/min-h and overflow-auto on parent */}
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
                                onClick={() => {
                                    if (pc.status !== "busy") {
                                        setSelectedBusyPc(null);
                                        return;
                                    }
                                    setSelectedBusyPc({
                                        id: pc.id,
                                        name: pc.name,
                                        member: pc.member || "Не указано",
                                        time_left: pc.time_left || "",
                                    });
                                }}
                                style={{
                                    top: pc.top ?? 0,
                                    left: pc.left ?? 0,
                                    boxShadow: selectedBusyPc?.id === pc.id ? "0 0 0 2px rgba(251, 146, 60, 0.7)" : undefined,
                                }}
                                title={`${pc.name} - ${pc.status}${pc.member ? ` (${pc.member})` : ""}`}
                            >
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

            {selectedBusyPc && (
                <div className="rounded-xl border border-orange-500/40 bg-orange-500/10 p-4">
                    <div className="text-sm font-semibold text-orange-400">
                        {selectedBusyPc.name} занят
                    </div>
                    <div className="text-sm text-foreground mt-1">
                        Клиент: <span className="font-medium">{selectedBusyPc.member}</span>
                    </div>
                    {selectedBusyPc.time_left && (
                        <div className="text-xs text-muted-foreground mt-1">
                            Осталось времени: {selectedBusyPc.time_left}
                        </div>
                    )}
                </div>
            )}

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
