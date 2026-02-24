import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, TrendingUp } from "lucide-react";
import { api, formatMoney } from "@/lib/api";

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  badge?: string;
  highlight?: boolean;
  loading?: boolean;
}

const StatCard = ({ title, value, subtitle, badge, highlight, loading }: StatCardProps) => (
  <div
    className={`relative rounded-xl border p-5 transition-all ${highlight
        ? "border-primary/30 bg-gradient-to-br from-primary/20 via-primary/10 to-card"
        : "border-border bg-card"
      }`}
  >
    <div className="flex items-start justify-between mb-3">
      <p className={`text-sm font-medium ${highlight ? "text-primary" : "text-muted-foreground"}`}>
        {title}
      </p>
      <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
    </div>
    {loading ? (
      <div className="h-8 w-32 rounded bg-secondary animate-pulse" />
    ) : (
      <p className="text-2xl font-bold text-foreground">{value}</p>
    )}
    {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
    {badge && (
      <span className="inline-flex items-center gap-1 mt-3 rounded-full bg-primary/15 px-2.5 py-1 text-xs font-medium text-primary">
        <TrendingUp className="h-3 w-3" />
        {badge}
      </span>
    )}
  </div>
);

const StatCards = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["overview"],
    queryFn: api.overview,
    refetchInterval: 30_000, // refresh every 30 s
  });

  const currency = "сум";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <StatCard
        title="Выручка сегодня"
        value={data ? `${formatMoney(data.today_revenue)} ${currency}` : "—"}
        badge={data ? undefined : undefined}
        highlight
        loading={isLoading}
      />
      <StatCard
        title="Участники клуба"
        value={data ? String(data.total_members) : "—"}
        subtitle="Всего зарегистрировано"
        loading={isLoading}
      />
      <StatCard
        title="За неделю"
        value={data ? `${formatMoney(data.week_revenue)} ${currency}` : "—"}
        subtitle="Доход за 7 дней"
        loading={isLoading}
      />
      <StatCard
        title="Активные ПК"
        value={data ? `${data.active_pcs} / ${data.total_pcs}` : "—"}
        subtitle={data ? `Загрузка ${data.pc_load_percent}%` : ""}
        loading={isLoading}
      />
    </div>
  );
};

export default StatCards;
