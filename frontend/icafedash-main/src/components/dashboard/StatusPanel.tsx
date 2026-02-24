import { useQuery } from "@tanstack/react-query";
import { api, formatMoney } from "@/lib/api";

const StatusPanel = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["overview"],
    queryFn: api.overview,
    refetchInterval: 30_000,
  });

  const pct = data?.pc_load_percent ?? 0;
  const activePcs = data?.active_pcs ?? 0;
  const totalPcs = data?.total_pcs ?? 0;
  const todayRev = data?.today_revenue ?? 0;
  const weekRev = data?.week_revenue ?? 0;
  const isConnected = data?.api_connected ?? false;

  return (
    <div className="space-y-4">
      {/* Current Status */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Текущий статус</h3>

        <div className="mb-4">
          <p className="text-xs text-muted-foreground">Активные ПК</p>
          {isLoading ? (
            <div className="h-8 w-20 rounded bg-secondary animate-pulse mt-1" />
          ) : (
            <p className="text-2xl font-bold text-foreground">{activePcs} / {totalPcs}</p>
          )}
          <div className="mt-2 h-1.5 rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        <div className="mb-4 rounded-lg bg-secondary p-3">
          <p className="text-xs text-muted-foreground">Выручка сегодня</p>
          {isLoading ? (
            <div className="h-6 w-32 rounded bg-muted animate-pulse mt-1" />
          ) : (
            <p className="text-xl font-bold text-primary">{formatMoney(todayRev)} сум</p>
          )}
        </div>

        <div className="rounded-lg bg-secondary p-3">
          <p className="text-xs text-muted-foreground">Выручка за неделю</p>
          {isLoading ? (
            <div className="h-6 w-32 rounded bg-muted animate-pulse mt-1" />
          ) : (
            <p className="text-xl font-bold text-foreground">{formatMoney(weekRev)} сум</p>
          )}
        </div>
      </div>

      {/* Club Status */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Статус клуба</h3>
        <div className="space-y-3">
          <div className="flex items-start gap-2">
            <span className="mt-1.5 h-2 w-2 rounded-full bg-success flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">Загрузка {pct}%</p>
              <p className="text-xs text-muted-foreground">{activePcs} из {totalPcs} ПК заняты</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="mt-1.5 h-2 w-2 rounded-full bg-success flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">
                Сегодня: {formatMoney(todayRev)} сум
              </p>
              <p className="text-xs text-muted-foreground">Данные из iCafe Cloud</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span
              className={`mt-1.5 h-2 w-2 rounded-full flex-shrink-0 ${isConnected ? "bg-success" : "bg-yellow-500"
                }`}
            />
            <div>
              <p className="text-sm font-medium text-foreground">
                {isConnected ? "API подключено" : "API не настроено"}
              </p>
              <p className="text-xs text-muted-foreground">
                {isConnected ? "Данные в реальном времени" : "Настройте ключ API"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatusPanel;
