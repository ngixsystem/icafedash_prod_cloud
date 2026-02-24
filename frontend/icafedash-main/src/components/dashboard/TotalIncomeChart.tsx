import { useQuery } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { api, formatMoney } from "@/lib/api";

const TotalIncomeChart = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["monthlyChart"],
    queryFn: api.monthlyChart,
    refetchInterval: 120_000,
  });

  const chartData = data?.points ?? [];

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4">
        <h3 className="text-sm font-medium text-muted-foreground">Общий доход</h3>
        <p className="text-xs text-muted-foreground">Разбивка за 30 дней</p>
      </div>
      <div className="flex gap-6 mb-4 text-sm">
        <div>
          <span className="text-muted-foreground">Cash</span>
          {isLoading ? (
            <div className="h-5 w-28 rounded bg-secondary animate-pulse mt-1" />
          ) : (
            <p className="font-semibold text-foreground">{formatMoney(data?.total_cash ?? 0)} сум</p>
          )}
        </div>
        <div>
          <span className="text-muted-foreground">Balance</span>
          {isLoading ? (
            <div className="h-5 w-28 rounded bg-secondary animate-pulse mt-1" />
          ) : (
            <p className="font-semibold text-foreground">{formatMoney(data?.total_balance ?? 0)} сум</p>
          )}
        </div>
      </div>
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "hsl(215,15%,55%)", fontSize: 11 }}
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
              cursor={{ stroke: 'rgba(255, 255, 255, 0.1)', strokeWidth: 1 }}
              formatter={(v: number, name: string) => [`${formatMoney(v)} сум`, name]}
            />
            <Line type="monotone" dataKey="cash" stroke="hsl(172,66%,50%)" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="balance" stroke="hsl(220,70%,55%)" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TotalIncomeChart;
