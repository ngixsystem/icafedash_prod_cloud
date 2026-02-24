import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { api, formatMoney } from "@/lib/api";

const MonthlyIncomeChart = () => {
    const { data, isLoading } = useQuery({
        queryKey: ["monthlyAggregatedIncome"],
        queryFn: api.getMonthlyAggregatedIncome,
        refetchInterval: 600_000, // Monthly data changes slowly
    });

    const chartData = data?.data ?? [
        { month: "...", amount: 0 },
    ];

    const totalAmount = data?.data?.reduce((acc, curr) => acc + curr.amount, 0) ?? 0;

    return (
        <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-start justify-between mb-1">
                <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Доход по месяцам</h3>
                    <p className="text-xs text-muted-foreground">Последние 7 месяцев</p>
                </div>
            </div>
            {isLoading ? (
                <div className="h-8 w-40 rounded bg-secondary animate-pulse mb-1" />
            ) : (
                <p className="text-2xl font-bold text-foreground mb-1">
                    {formatMoney(totalAmount)} сум
                </p>
            )}
            <span className="inline-block rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-medium text-primary mb-4">
                Суммарно за период
            </span>
            <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} barCategoryGap="25%">
                        <XAxis
                            dataKey="month"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "hsl(215,15%,55%)", fontSize: 10 }}
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
                        <Bar dataKey="amount" fill="hsl(217,91%,60%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default MonthlyIncomeChart;
