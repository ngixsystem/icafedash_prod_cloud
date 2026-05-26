import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Maximize2, RefreshCcw, UserRound, X } from "lucide-react";
import LottieIcon from "@/components/LottieIcon";
import { api } from "@/lib/api";
import computerIcon from "@/assets/computer.png";
import loadingAnimation from "@/assets/loading.json";

type MonitoringPc = {
    id: string | number;
    name: string;
    status?: string;
    member?: string;
    time_left?: string;
    top?: number | string | null;
    left?: number | string | null;
};

type BusyPcInfo = {
    id: string | number;
    name: string;
    member: string;
    time_left?: string;
};

function getPcTone(status: string | undefined) {
    if (status === "busy") {
        return {
            card: "border-orange-400/55 bg-[radial-gradient(circle_at_50%_0%,rgba(251,146,60,0.28),rgba(251,146,60,0.08)_42%,rgba(18,18,18,0.92)_100%)] text-orange-300 shadow-[0_0_24px_rgba(251,146,60,0.12),inset_0_1px_0_rgba(255,255,255,0.08)]",
            icon: "text-orange-300 drop-shadow-[0_0_12px_rgba(251,146,60,0.7)]",
            row: "border-orange-400/35 bg-orange-400/10 text-orange-300",
            label: "Занят",
        };
    }

    if (status === "offline") {
        return {
            card: "border-slate-400/25 bg-[radial-gradient(circle_at_50%_0%,rgba(148,163,184,0.13),rgba(148,163,184,0.045)_42%,rgba(18,18,18,0.92)_100%)] text-slate-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.055)]",
            icon: "text-slate-300 drop-shadow-[0_0_10px_rgba(203,213,225,0.22)]",
            row: "border-slate-400/25 bg-slate-400/10 text-slate-300",
            label: "Оффлайн",
        };
    }

    return {
        card: "border-emerald-400/50 bg-[radial-gradient(circle_at_50%_0%,rgba(52,211,153,0.24),rgba(16,185,129,0.08)_42%,rgba(18,18,18,0.92)_100%)] text-emerald-300 shadow-[0_0_24px_rgba(16,185,129,0.12),inset_0_1px_0_rgba(255,255,255,0.08)]",
        icon: "text-emerald-300 drop-shadow-[0_0_12px_rgba(52,211,153,0.7)]",
        row: "border-emerald-400/35 bg-emerald-400/10 text-emerald-300",
        label: "Свободен",
    };
}

function ComputerGlyph({ className = "" }: { className?: string }) {
    return (
        <span
            className={`inline-block bg-current ${className}`}
            style={{
                WebkitMask: `url(${computerIcon}) center / contain no-repeat`,
                mask: `url(${computerIcon}) center / contain no-repeat`,
            }}
        />
    );
}

function PcMap({
    pcs,
    fullscreen = false,
    onBusyHover,
}: {
    pcs: MonitoringPc[];
    fullscreen?: boolean;
    onBusyHover: (pc: BusyPcInfo | null) => void;
}) {
    const isDenseMap = pcs.length > 60;
    const bounds = useMemo(() => {
        const xs = pcs.map((pc) => Number(pc.left ?? 0));
        const ys = pcs.map((pc) => Number(pc.top ?? 0));
        const minX = Math.min(...xs, 0);
        const maxX = Math.max(...xs, 1);
        const minY = Math.min(...ys, 0);
        const maxY = Math.max(...ys, 1);

        return {
            minX,
            minY,
            rangeX: Math.max(maxX - minX, 1),
            rangeY: Math.max(maxY - minY, 1),
        };
    }, [pcs]);

    return (
        <div
            className={`relative h-full w-full overflow-hidden rounded-[22px] bg-[radial-gradient(circle_at_50%_45%,rgba(255,149,0,0.06),transparent_46%),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[length:auto,7.5%_14%,7.5%_14%] ${
                fullscreen ? "rounded-none" : ""
            }`}
        >
            {pcs.map((pc) => {
                const tone = getPcTone(pc.status);
                const x = 5 + ((Number(pc.left ?? 0) - bounds.minX) / bounds.rangeX) * 90;
                const y = 7 + ((Number(pc.top ?? 0) - bounds.minY) / bounds.rangeY) * 86;

                return (
                    <div
                        key={pc.id}
                        className={`absolute flex cursor-pointer flex-col items-center justify-center border transition-all duration-200 hover:-translate-y-1 hover:scale-105 ${
                            fullscreen
                                ? "h-[clamp(18px,4.5svh,26px)] w-[clamp(18px,4.5svh,26px)] rounded-[7px] p-[1px]"
                                : isDenseMap
                                    ? "h-[clamp(30px,2.55vw,42px)] w-[clamp(30px,2.55vw,42px)] rounded-[11px] p-0.5"
                                    : "h-[clamp(34px,2.9vw,48px)] w-[clamp(34px,2.9vw,48px)] rounded-[13px] p-0.5"
                        } ${tone.card}`}
                        onMouseEnter={() => {
                            if (pc.status !== "busy") return;
                            onBusyHover({
                                id: pc.id,
                                name: pc.name,
                                member: pc.member || "Не указано",
                                time_left: pc.time_left || "",
                            });
                        }}
                        onMouseLeave={() => onBusyHover(null)}
                        style={{
                            left: `${x}%`,
                            top: `${y}%`,
                            transform: "translate(-50%, -50%)",
                        }}
                        title={`${pc.name} - ${tone.label}${pc.member ? ` (${pc.member})` : ""}`}
                    >
                        <span className={`absolute rounded-full bg-current opacity-90 shadow-[0_0_10px_currentColor] ${fullscreen ? "left-0.5 top-0.5 h-1 w-1" : "left-1 top-1 h-1.5 w-1.5"}`} />
                        {pc.status === "busy" && (
                            <span
                                className={`absolute flex items-center justify-center rounded-full border border-orange-200/60 bg-orange-500 text-white shadow-[0_0_12px_rgba(249,115,22,0.55)] ${fullscreen ? "-right-0.5 -top-0.5 h-2.5 w-2.5" : "-right-1 -top-1 h-3.5 w-3.5"}`}
                                title="Клиент за ПК"
                            >
                                <UserRound className={fullscreen ? "h-1.5 w-1.5" : "h-2 w-2"} />
                            </span>
                        )}
                        <ComputerGlyph className={`mb-0.5 ${fullscreen ? "h-2.5 w-3.5" : isDenseMap ? "h-4 w-5" : "h-5 w-6"} ${tone.icon}`} />
                        <span className={`w-full truncate text-center font-black leading-none ${fullscreen ? "text-[5px]" : isDenseMap ? "text-[6.5px]" : "text-[8px]"}`}>
                            {pc.name}
                        </span>
                        {pc.time_left && !fullscreen && (
                            <span className="mt-0.5 text-[6px] font-bold opacity-80">{pc.time_left}</span>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

const Monitoring = () => {
    const [isMapOpen, setIsMapOpen] = useState(false);
    const [hoveredBusyPc, setHoveredBusyPc] = useState<BusyPcInfo | null>(null);

    const { data, isLoading, refetch, isFetching } = useQuery({
        queryKey: ["pcs"],
        queryFn: api.pcs,
        refetchInterval: 30_000,
    });

    const pcs = data?.pcs ?? [];
    const sortedPcs = [...pcs].sort((a, b) => String(a.name).localeCompare(String(b.name)));

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Мониторинг</h2>
                    <p className="text-muted-foreground">Интерактивная карта клуба</p>
                </div>
                <button
                    onClick={() => refetch()}
                    disabled={isFetching}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-secondary px-3 py-2 text-sm font-medium hover:bg-secondary/80 disabled:opacity-50 sm:w-auto"
                >
                    <RefreshCcw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
                    Обновить
                </button>
            </div>

            <div className="relative rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(24,25,28,0.96),rgba(15,16,18,0.96))] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.055)] sm:p-5">
                {isLoading ? (
                    <div className="flex h-[clamp(360px,calc(100svh-240px),620px)] flex-col items-center justify-center space-y-4">
                        <LottieIcon
                            animationData={loadingAnimation}
                            className="h-24 w-24 text-[#ff9500] drop-shadow-[0_0_22px_rgba(255,149,0,0.38)]"
                            animationClassName="brightness-0 invert"
                        />
                        <p className="text-sm text-muted-foreground">Загрузка карты...</p>
                    </div>
                ) : (
                    <div>
                        <div className="hidden h-[clamp(430px,calc(100svh-230px),720px)] md:block">
                            <PcMap pcs={pcs} onBusyHover={setHoveredBusyPc} />
                        </div>

                        <button
                            type="button"
                            onClick={() => setIsMapOpen(true)}
                            className="flex h-[220px] w-full flex-col items-center justify-center gap-3 rounded-[22px] border border-orange-400/30 bg-[radial-gradient(circle_at_50%_0%,rgba(255,149,0,0.18),rgba(18,18,18,0.96)_58%)] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] md:hidden"
                        >
                            <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-orange-300/35 bg-orange-400/10 text-orange-300">
                                <Maximize2 className="h-6 w-6" />
                            </span>
                            <span className="text-lg font-black">Открыть карту</span>
                            <span className="max-w-[240px] text-center text-xs text-muted-foreground">
                                Карта откроется на весь экран в альбомном виде
                            </span>
                        </button>
                    </div>
                )}
            </div>

            {isMapOpen && (
                <div className="fixed inset-0 z-[9999] bg-black md:hidden">
                    <div className="absolute left-1/2 top-1/2 h-[100svh] w-[100svw] -translate-x-1/2 -translate-y-1/2 overflow-hidden bg-black portrait:h-[100svw] portrait:w-[100svh] portrait:rotate-90">
                        <PcMap pcs={pcs} fullscreen onBusyHover={setHoveredBusyPc} />
                        <button
                            type="button"
                            onClick={() => setIsMapOpen(false)}
                            className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/70 text-white backdrop-blur"
                            aria-label="Закрыть карту"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            )}

            {hoveredBusyPc && (
                <div className="rounded-xl border border-orange-500/40 bg-orange-500/10 p-4">
                    <div className="text-sm font-semibold text-orange-400">
                        {hoveredBusyPc.name} занят
                    </div>
                    <div className="mt-1 text-sm text-foreground">
                        Клиент: <span className="font-medium">{hoveredBusyPc.member}</span>
                    </div>
                    {hoveredBusyPc.time_left && (
                        <div className="mt-1 text-xs text-muted-foreground">
                            Осталось времени: {hoveredBusyPc.time_left}
                        </div>
                    )}
                </div>
            )}

            <div className="overflow-hidden rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(24,25,28,0.96),rgba(15,16,18,0.96))] shadow-[inset_0_1px_0_rgba(255,255,255,0.055)]">
                <div className="border-b border-white/10 px-4 py-4">
                    <h3 className="text-sm font-semibold text-foreground">Список ПК</h3>
                    <p className="text-xs text-muted-foreground">Красивый и адаптивный список для мобильных и desktop</p>
                </div>

                <div className="divide-y divide-white/10">
                    {sortedPcs.map((pc) => {
                        const tone = getPcTone(pc.status);

                        return (
                            <div key={`row-${pc.id}`} className="flex flex-col gap-2 px-4 py-3 transition-colors hover:bg-white/[0.025] sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex min-w-0 items-center gap-3">
                                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${tone.row}`}>
                                        <ComputerGlyph className={`h-5 w-6 ${tone.icon}`} />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="truncate text-sm font-semibold text-foreground">{pc.name}</div>
                                        <div className="truncate text-xs text-muted-foreground">{pc.member || "-"}</div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 sm:justify-end">
                                    <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${tone.row}`}>
                                        {tone.label}
                                    </span>
                                    {pc.time_left && (
                                        <span className="text-[11px] text-muted-foreground">{pc.time_left}</span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="flex flex-wrap gap-4 pt-2">
                <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded border border-success/50 bg-success/20" />
                    <span className="text-xs text-muted-foreground">Свободен</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded border border-orange-500/50 bg-orange-500/20" />
                    <span className="text-xs text-muted-foreground">Занят</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded border border-muted-foreground/30 bg-muted/20" />
                    <span className="text-xs text-muted-foreground">Оффлайн</span>
                </div>
            </div>
        </div>
    );
};

export default Monitoring;
