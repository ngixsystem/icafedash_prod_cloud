import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Cloud,
  MonitorPlay,
  ShieldCheck,
  Users,
  Wallet,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api, formatMoney } from "@/lib/api";

function formatTooltipDate(value: string | number | undefined): string {
  if (!value) return "Дата неизвестна";
  const raw = String(value);
  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleDateString("ru-RU", { day: "2-digit", month: "long" });
  }
  return raw;
}

function toIsoDay(value: string | undefined): string {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
}

const ManagerHyperOverview = () => {
  const [hoveredDayKey, setHoveredDayKey] = useState<string | null>(null);
  const [hoveredWeekKey, setHoveredWeekKey] = useState<string | null>(null);

  const { data: overview } = useQuery({
    queryKey: ["overview"],
    queryFn: api.overview,
    refetchInterval: 30_000,
  });

  const { data: dailyChart } = useQuery({
    queryKey: ["dailyChart"],
    queryFn: api.dailyChart,
    refetchInterval: 60_000,
  });

  const { data: monthlyChart } = useQuery({
    queryKey: ["monthlyChart"],
    queryFn: api.monthlyChart,
    refetchInterval: 120_000,
  });

  const { data: incomeByMonth } = useQuery({
    queryKey: ["monthlyAggregatedIncome"],
    queryFn: api.getMonthlyAggregatedIncome,
    refetchInterval: 600_000,
  });

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const cards = document.querySelectorAll<HTMLElement>(".glass-card");
      cards.forEach((card) => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty("--mouse-x", `${event.clientX - rect.left}px`);
        card.style.setProperty("--mouse-y", `${event.clientY - rect.top}px`);
      });
    };

    document.addEventListener("mousemove", handleMouseMove);
    return () => document.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const dailyBars = dailyChart?.days ?? [];
  const maxDaily = Math.max(...dailyBars.map((d) => d.value), 1);
  const maxWeeklyMini = Math.max(...dailyBars.map((d) => d.value), 1);
  const monthBars = (incomeByMonth?.data ?? []).slice(-6);
  const monthTotal = monthBars.reduce((sum, item) => sum + item.amount, 0);

  const lineData =
    monthlyChart?.points.map((point, i) => ({
      x: i + 1,
      cash: point.cash,
      balance: point.balance,
      date: point.date,
    })) ?? [];

  const totalCash = monthlyChart?.total_cash ?? 0;
  const totalBalance = monthlyChart?.total_balance ?? 0;
  const todayRevenue = overview?.today_revenue ?? 0;
  const weekRevenue = overview?.week_revenue ?? 0;
  const members = overview?.total_members ?? 0;
  const newMembersWeek = overview?.new_members_week ?? 0;
  const activePcs = overview?.active_pcs ?? 0;
  const totalPcs = overview?.total_pcs ?? 0;
  const pcLoad = overview?.pc_load_percent ?? 0;
  const latencyMs = 12;

  const todayIso = new Date().toISOString().slice(0, 10);
  const todayIdx = dailyBars.findIndex((d) => toIsoDay(d.date) === todayIso);
  const safeTodayIdx = todayIdx >= 0 ? todayIdx : dailyBars.length - 1;
  const yesterdayIdx = safeTodayIdx > 0 ? safeTodayIdx - 1 : -1;
  const yesterdayRevenue = yesterdayIdx >= 0 ? (dailyBars[yesterdayIdx]?.value ?? 0) : 0;
  const trendPercentRaw = yesterdayRevenue > 0 ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100 : 0;
  const trendPercent = Number.isFinite(trendPercentRaw) ? trendPercentRaw : 0;
  const isTrendUp = trendPercent >= 0;
  const trendLabel = `${isTrendUp ? "+" : ""}${trendPercent.toFixed(1)}%`;

  return (
    <div className="max-w-[1920px] mx-auto space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 gap-6">
        <div className="glass-card rounded-3xl p-6 group">
          <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 rounded-2xl bg-[#00F0FF]/10 border border-[#00F0FF]/20 flex items-center justify-center text-[#00F0FF]">
              <Wallet className="w-6 h-6" />
            </div>
            <span
              className={`px-2.5 py-1 rounded-lg text-xs font-bold inline-flex items-center gap-1 ${
                isTrendUp
                  ? "bg-[#00FF94]/10 border border-[#00FF94]/20 text-[#00FF94]"
                  : "bg-[#FF0055]/10 border border-[#FF0055]/20 text-[#FF0055]"
              }`}
            >
              {isTrendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />} {trendLabel}
            </span>
          </div>
          <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2 font-mono">Выручка сегодня</h3>
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-3xl lg:text-4xl font-bold text-white tracking-tight">{formatMoney(todayRevenue)}</span>
            <span className="text-sm text-slate-500 font-bold">сум</span>
          </div>
          <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#00F0FF] to-[#2B59F9] rounded-full shimmer-bar"
              style={{ width: `${Math.min(100, pcLoad + 54)}%` }}
            />
          </div>
        </div>

        <div className="glass-card rounded-3xl p-6 group">
          <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 rounded-2xl bg-[#BD00FF]/10 border border-[#BD00FF]/20 flex items-center justify-center text-[#BD00FF]">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2 font-mono">Участники клуба</h3>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl lg:text-4xl font-bold text-white tracking-tight">{formatMoney(members)}</span>
            <span className="text-sm text-slate-500 font-bold">чел</span>
          </div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#BD00FF]/10 text-[10px] font-bold text-[#BD00FF] border border-[#BD00FF]/10">
            <span className="w-1.5 h-1.5 rounded-full bg-[#BD00FF] animate-pulse" />
            +{newMembersWeek} новых за неделю
          </div>
        </div>

        <div className="glass-card rounded-3xl p-6 group">
          <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 rounded-2xl bg-[#2B59F9]/10 border border-[#2B59F9]/20 flex items-center justify-center text-[#2B59F9]">
              <BarChart3 className="w-6 h-6" />
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-slate-400 text-[10px] font-bold uppercase tracking-wider font-mono">
              Неделя
            </span>
          </div>
          <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2 font-mono">Доход за неделю</h3>
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-3xl lg:text-4xl font-bold text-white tracking-tight">{(weekRevenue / 1_000_000).toFixed(1)}M</span>
            <span className="text-sm text-slate-500 font-bold">сум</span>
          </div>
          <div className="h-10 flex items-end justify-between gap-2">
            {dailyBars.map((day) => {
              const weekKey = `week-${day.day}-${day.date}`;
              const miniHeight = Math.max(6, Math.round((day.value / maxWeeklyMini) * 26));
              const isHovered = hoveredWeekKey === weekKey;
              return (
                <div
                  key={weekKey}
                  className="relative flex-1 h-full flex items-end"
                  onMouseEnter={() => setHoveredWeekKey(weekKey)}
                  onMouseLeave={() => setHoveredWeekKey((prev) => (prev === weekKey ? null : prev))}
                >
                  <div
                    className={`absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full px-2 py-1 rounded-lg border border-white/10 bg-[#0A0A0F]/95 text-[10px] font-bold text-white whitespace-nowrap transition-all duration-150 ${
                      isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1 pointer-events-none"
                    }`}
                  >
                    {day.day}: {formatMoney(day.value)} сум
                  </div>
                  <div
                    className="w-full bg-[#2B59F9] rounded-sm shadow-[0_0_10px_rgba(43,89,249,0.35)] transition-all duration-200 hover:bg-[#3E6AFB]"
                    style={{ height: `${miniHeight}px` }}
                  />
                </div>
              );
            })}
          </div>
        </div>

        <div className="glass-card rounded-3xl p-6 group">
          <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 rounded-2xl bg-[#00FF94]/10 border border-[#00FF94]/20 flex items-center justify-center text-[#00FF94]">
              <MonitorPlay className="w-6 h-6" />
            </div>
            <span className="relative w-2.5 h-2.5 bg-[#00FF94] rounded-full shadow-[0_0_10px_#00FF94]">
              <span className="status-ping bg-[#00FF94]" />
            </span>
          </div>
          <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2 font-mono">Активные ПК</h3>
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-3xl lg:text-4xl font-bold text-white tracking-tight">{activePcs}</span>
            <span className="text-xl text-slate-500 font-medium">/ {totalPcs}</span>
          </div>
          <div className="flex justify-between text-xs mb-2 font-medium">
            <span className="text-[#00FF94]">Загрузка</span>
            <span className="text-white">{pcLoad}%</span>
          </div>
          <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#00FF94] to-emerald-400 rounded-full shadow-[0_0_10px_rgba(0,255,148,0.6)]"
              style={{ width: `${pcLoad}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-3 glass-card rounded-3xl p-6 flex flex-col min-h-[320px]">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="font-bold text-lg text-white">Доход по дням</h3>
              <p className="text-xs text-slate-500 mt-1 font-medium">Текущая неделя</p>
            </div>
          </div>
          <div className="flex-1 flex items-end justify-between gap-2 px-1">
            {dailyBars.map((day) => {
              const h = Math.max(12, Math.round((day.value / maxDaily) * 100));
              const dayKey = `${day.day}-${day.date}`;
              const isHovered = hoveredDayKey === dayKey;
              return (
                <div
                  key={dayKey}
                  className="relative flex flex-col items-center gap-3 flex-1 h-full justify-end"
                  onMouseEnter={() => setHoveredDayKey(dayKey)}
                  onMouseLeave={() => setHoveredDayKey((prev) => (prev === dayKey ? null : prev))}
                >
                  <div
                    className={`absolute -top-2 -translate-y-full px-2 py-1 rounded-lg border border-white/10 bg-[#0A0A0F]/95 text-[10px] font-bold text-white whitespace-nowrap transition-all duration-150 ${
                      isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1 pointer-events-none"
                    }`}
                  >
                    {formatMoney(day.value)} сум
                  </div>
                  <div className="w-full bg-white/5 rounded-t-lg h-full flex items-end overflow-hidden">
                    <div className="w-full bg-gradient-to-t from-[#00F0FF]/20 to-[#00F0FF] rounded-t-lg transition-all duration-500" style={{ height: `${h}%` }} />
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 font-mono uppercase">{day.day}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="xl:col-span-6 glass-card rounded-3xl p-0 overflow-hidden flex flex-col min-h-[320px]">
          <div className="p-6 lg:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-2xl font-bold text-white">Общий доход</h3>
              <p className="text-xs text-slate-500 mt-1 font-medium">Динамика за 30 дней</p>
            </div>
            <div className="flex gap-8">
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 font-mono">НАЛИЧНЫЕ</p>
                <p className="text-2xl font-bold text-white">{(totalCash / 1_000_000).toFixed(1)}M</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 font-mono">БАЛАНС</p>
                <p className="text-2xl font-bold text-[#00FF94]">{formatMoney(totalBalance)}</p>
              </div>
            </div>
          </div>
          <div className="flex-1 min-h-[220px] px-3 pb-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={lineData}>
                <defs>
                  <linearGradient id="cashGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#BD00FF" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#BD00FF" stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="x" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ background: "#0A0A0F", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }}
                  formatter={(v: number) => `${formatMoney(v)} сум`}
                  labelFormatter={(_, payload) => formatTooltipDate(payload?.[0]?.payload?.date)}
                />
                <Area type="monotone" dataKey="cash" stroke="#BD00FF" fill="url(#cashGrad)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="xl:col-span-3 glass-card rounded-3xl p-6 flex flex-col min-h-[320px]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-white text-lg">По месяцам</h3>
            <span className="text-[10px] font-bold bg-[#2B59F9]/10 text-[#2B59F9] px-2 py-1 rounded border border-[#2B59F9]/20 uppercase tracking-wider font-mono">ИТОГ</span>
          </div>
          <div className="mb-6">
            <h2 className="text-4xl font-bold text-white tracking-tight">{(monthTotal / 1_000_000).toFixed(1)}M</h2>
            <p className="text-[10px] text-[#00F0FF] mt-1 font-bold uppercase tracking-wider font-mono">Общая выручка</p>
          </div>
          <div className="flex-1 h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthBars}>
                <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ background: "#0A0A0F", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }}
                  cursor={false}
                  formatter={(v: number) => [`${formatMoney(v)} сум`, "доход"]}
                />
                <Bar dataKey="amount" fill="#00F0FF" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <div className="glass-card rounded-2xl p-5 flex items-center justify-between border-l-4 border-[#00FF94]">
          <div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 font-mono">Статус системы</div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#00FF94]" />
              <span className="text-sm font-bold text-white">Все системы в норме</span>
            </div>
          </div>
          <Activity className="w-5 h-5 text-[#00FF94]" />
        </div>

        <div className="glass-card rounded-2xl p-5 flex items-center justify-between border-l-4 border-[#00F0FF]">
          <div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 font-mono">iCafe Облако</div>
            <div className="flex items-center gap-2">
              <Cloud className="w-4 h-4 text-[#00F0FF]" />
              <span className="text-sm font-bold text-white">Синхронизировано</span>
            </div>
          </div>
          <div className="text-right">
            <span className="block text-[10px] text-slate-500 font-bold font-mono">ПИНГ</span>
            <span className="text-xs font-mono font-bold text-[#00F0FF]">{latencyMs}ms</span>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 flex items-center justify-between border-l-4 border-[#BD00FF]">
          <div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 font-mono">API ШЛЮЗ</div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#BD00FF]" />
              <span className="text-sm font-bold text-white">Защищенное соединение</span>
            </div>
          </div>
          <div className="text-right">
            <span className="block text-[10px] text-slate-500 font-bold font-mono">АПТАЙМ</span>
            <span className="text-xs font-mono font-bold text-[#BD00FF]">99.9%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerHyperOverview;
