import { useQuery } from "@tanstack/react-query";
import { api, formatMoney } from "@/lib/api";

const COLORS = ["bg-primary", "bg-blue-500", "bg-yellow-500", "bg-red-400", "bg-purple-500"];

const PaymentMethods = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["paymentMethods"],
    queryFn: api.paymentMethods,
    refetchInterval: 60_000,
  });

  const methods = data?.methods ?? [];

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4">
        <h3 className="text-sm font-medium text-muted-foreground">Способы оплаты</h3>
        <p className="text-xs text-muted-foreground">Разбивка дохода за неделю</p>
      </div>

      {isLoading && (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="space-y-1.5">
              <div className="h-4 w-24 rounded bg-secondary animate-pulse" />
              <div className="h-2 w-full rounded-full bg-secondary animate-pulse" />
            </div>
          ))}
        </div>
      )}

      {!isLoading && methods.length === 0 && (
        <p className="text-xs text-muted-foreground">Нет данных</p>
      )}

      <div className="space-y-5">
        {methods.map((m, idx) => (
          <div key={m.name}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-medium text-foreground">{m.name}</span>
              <span className="text-sm font-bold text-foreground">{m.percent}%</span>
            </div>
            <div className="h-2 rounded-full bg-secondary">
              <div
                className={`h-full rounded-full ${COLORS[idx % COLORS.length]}`}
                style={{ width: `${m.percent}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">{formatMoney(m.amount)} сум</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PaymentMethods;
