import { useQuery } from "@tanstack/react-query";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { api } from "@/lib/api";
import { RefreshCcw, UserRound } from "lucide-react";
import LottieIcon from "@/components/LottieIcon";
import computerIcon from "@/assets/computer.png";
import loadingAnimation from "@/assets/loading.json";

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

const Monitoring = () => {
    const mapFrameRef = useRef<HTMLDivElement | null>(null);
    const [mapFrameSize, setMapFrameSize] = useState({ width: 0, height: 0 });
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
    const mapMetrics = useMemo(() => {
        const tileSize = 58;
        const mapPadding = 96;
        const minLeft = Math.min(0, ...pcs.map((pc) => Number(pc.left ?? 0)));
        const minTop = Math.min(0, ...pcs.map((pc) => Number(pc.top ?? 0)));
        const maxLeft = Math.max(900, ...pcs.map((pc) => Number(pc.left ?? 0) + tileSize));
        const maxTop = Math.max(420, ...pcs.map((pc) => Number(pc.top ?? 0) + tileSize));
        const offsetX = mapPadding - minLeft;
        const offsetY = mapPadding - minTop;
        const width = maxLeft - minLeft + mapPadding * 2;
        const height = maxTop - minTop + mapPadding * 2;

        return { width, height, offsetX, offsetY };
    }, [pcs]);
    const mapScale = useMemo(() => {
        if (!mapFrameSize.width || !mapFrameSize.height) return 1;

        return Math.min(
            0.92,
            mapFrameSize.width / mapMetrics.width,
            mapFrameSize.height / mapMetrics.height,
        );
    }, [mapFrameSize.height, mapFrameSize.width, mapMetrics.height, mapMetrics.width]);

    useLayoutEffect(() => {
        const node = mapFrameRef.current;
        if (!node) return;

        const updateSize = () => {
            setMapFrameSize({
                width: node.clientWidth,
                height: node.clientHeight,
            });
        };

        updateSize();
        const observer = new ResizeObserver(updateSize);
        observer.observe(node);

        return () => observer.disconnect();
    }, []);

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
                    className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg bg-secondary px-3 py-2 text-sm font-medium hover:bg-secondary/80 disabled:opacity-50"
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
                    <div
                        ref={mapFrameRef}
                        className="relative h-[clamp(360px,calc(100svh-240px),620px)] overflow-hidden rounded-[22px] bg-[radial-gradient(circle_at_50%_45%,rgba(255,149,0,0.055),transparent_46%),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[length:auto,72px_72px,72px_72px]"
                    >
                        <div
                            className="absolute"
                            style={{
                                width: mapMetrics.width,
                                height: mapMetrics.height,
                                left: Math.max(0, (mapFrameSize.width - mapMetrics.width * mapScale) / 2),
                                top: Math.max(0, (mapFrameSize.height - mapMetrics.height * mapScale) / 2),
                                transform: `scale(${mapScale})`,
                                transformOrigin: "top left",
                            }}
                        >
                        {pcs.map((pc) => {
                            const tone = getPcTone(pc.status);

                            return (
                            <div
                                key={pc.id}
                                className={`absolute flex h-[58px] w-[58px] cursor-pointer flex-col items-center justify-center rounded-[15px] border p-1 transition-all duration-200 hover:-translate-y-1 hover:scale-105 ${tone.card}`}
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
                                            top: Number(pc.top ?? 0) + mapMetrics.offsetY,
                                            left: Number(pc.left ?? 0) + mapMetrics.offsetX,
                                        }}
                                title={`${pc.name} - ${tone.label}${pc.member ? ` (${pc.member})` : ""}`}
                            >
                                <span className="absolute left-2 top-2 h-2 w-2 rounded-full bg-current opacity-90 shadow-[0_0_10px_currentColor]" />
                                {pc.status === "busy" && (
                                    <span
                                        className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full border border-orange-200/60 bg-orange-500 text-white shadow-[0_0_12px_rgba(249,115,22,0.55)]"
                                        title="Клиент за ПК"
                                    >
                                        <UserRound className="h-2.5 w-2.5" />
                                    </span>
                                )}
                                <ComputerGlyph className={`mb-0.5 h-6 w-8 ${tone.icon}`} />
                                <span className="w-full truncate text-center text-[9px] font-black leading-none">
                                    {pc.name}
                                </span>
                                {pc.time_left && (
                                    <span className="mt-0.5 text-[7px] font-bold opacity-80">{pc.time_left}</span>
                                )}
                            </div>
                            );
                        })}
                        </div>
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

            <div className="overflow-hidden rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(24,25,28,0.96),rgba(15,16,18,0.96))] shadow-[inset_0_1px_0_rgba(255,255,255,0.055)]">
                <div className="px-4 py-4 border-b border-white/10">
                    <h3 className="text-sm font-semibold text-foreground">Список ПК</h3>
                    <p className="text-xs text-muted-foreground">Красивый и адаптивный список для мобильных и desktop</p>
                </div>

                <div className="divide-y divide-white/10">
                    {sortedPcs.map((pc) => {
                        const tone = getPcTone(pc.status);

                        return (
                            <div key={`row-${pc.id}`} className="px-4 py-3 flex flex-col gap-2 transition-colors hover:bg-white/[0.025] sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className={`h-10 w-10 rounded-xl border flex items-center justify-center shrink-0 ${tone.row}`}>
                                        <ComputerGlyph className={`h-5 w-6 ${tone.icon}`} />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-sm font-semibold text-foreground truncate">{pc.name}</div>
                                        <div className="text-xs text-muted-foreground truncate">{pc.member || "—"}</div>
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
