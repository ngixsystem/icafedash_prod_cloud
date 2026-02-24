import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { api, formatMoney } from "@/lib/api";

const DailyIncomeChart = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["dailyChart"],
    queryFn: api.dailyChart,
    refetchInterval: 60_000,
  });

  const chartData = data?.days ?? [
    { day: "пн", value: 0 }, { day: "вт", value: 0 }, { day: "ср", value: 0 },
    { day: "чт", value: 0 }, { day: "пт", value: 0 }, { day: "сб", value: 0 },
    { day: "вс", value: 0 },
  ];

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-start justify-between mb-1">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">Доход по дням</h3>
          <p className="text-xs text-muted-foreground">Последние 7 дней</p>
        </div>
      </div>
      {isLoading ? (
        <div className="h-8 w-40 rounded bg-secondary animate-pulse mb-1" />
      ) : (
        <p className="text-2xl font-bold text-foreground mb-1">
          {formatMoney(data?.total ?? 0)} сум
        </p>
      )}
      <span className="inline-block rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-medium text-primary mb-4">
        За неделю
      </span>
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barCategoryGap="30%">
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "hsl(215,15%,55%)", fontSize: 12 }}
            />
            <YAxis hide />
            <Tooltip
              contentStyle={{
                background: "hsl(220,18%,11%)",
                border: "1px solid hsl(220,13%,18%)",
                borderRadius: 8,
                color: "hsl(210,20%,92%)",
                fontSize: 12,
              }}
              cursor={{ fill: "rgba(255, 255, 255, 0.05)" }}
              formatter={(v: number) => [`${formatMoney(v)} сум`, "Доход"]}
            />
            <Bar dataKey="value" fill="hsl(172,66%,50%)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default DailyIncomeChart;
