import { CalendarClock, Phone, User, Monitor, MapPin, RefreshCw } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

function formatDate(value: string | null): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const BookingPanel = () => {
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["manager_bookings"],
    queryFn: api.managerBookings,
    refetchInterval: 10000,
  });

  const bookings = data?.bookings || [];
  const summary = data?.summary || { count: 0, new_count: 0 };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <CalendarClock className="h-6 w-6 text-primary" />
            Бронирование
          </h2>
          <p className="text-muted-foreground mt-1">
            Новые заявки клиентов приходят в эту вкладку автоматически
          </p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm hover:bg-accent transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          Обновить
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-sm text-muted-foreground">Всего заявок</div>
          <div className="mt-1 text-2xl font-bold">{summary.count}</div>
        </div>
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4">
          <div className="text-sm text-amber-300">Новые</div>
          <div className="mt-1 text-2xl font-bold text-amber-200">{summary.new_count}</div>
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">
          Загрузка бронирований...
        </div>
      ) : bookings.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">
          Пока нет заявок на бронирование
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((booking) => (
            <div key={booking.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm font-semibold text-foreground">
                  Заявка #{booking.id}
                </div>
                <div className="text-xs text-muted-foreground">{formatDate(booking.created_at)}</div>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                <div className="inline-flex items-center gap-2 text-foreground">
                  <User className="h-4 w-4 text-muted-foreground" />
                  {booking.client_name}
                </div>
                <div className="inline-flex items-center gap-2 text-foreground">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  {booking.phone}
                </div>
                <div className="inline-flex items-center gap-2 text-foreground">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  {booking.zone_name}
                </div>
                <div className="inline-flex items-center gap-2 text-foreground">
                  <Monitor className="h-4 w-4 text-muted-foreground" />
                  {booking.pc_names.join(", ")}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {booking.duration ? (
                  <span className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground">
                    {booking.duration}
                  </span>
                ) : null}
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    booking.status === "new"
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                      : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                  }`}
                >
                  {booking.status === "new" ? "Новая" : booking.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BookingPanel;
