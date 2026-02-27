import { useState } from "react";
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

function statusUi(status: string) {
  if (status === "approved") {
    return { label: "Подтверждено", className: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40" };
  }
  if (status === "rejected") {
    return { label: "Отказано", className: "bg-rose-500/20 text-rose-300 border border-rose-500/40" };
  }
  if (status === "cancelled") {
    return { label: "Отменено", className: "bg-slate-500/20 text-slate-300 border border-slate-500/40" };
  }
  return { label: "Ожидание", className: "bg-amber-500/20 text-amber-300 border border-amber-500/40" };
}

const BookingPanel = () => {
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["manager_bookings"],
    queryFn: api.managerBookings,
    refetchInterval: 10000,
  });

  const bookings = data?.bookings || [];
  const summary = data?.summary || { count: 0, pending_count: 0, cancelled_count: 0 };

  const handleStatusUpdate = async (bookingId: number, status: "approved" | "rejected") => {
    setUpdatingId(bookingId);
    try {
      await api.updateBookingStatus(bookingId, status);
      await refetch();
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCancel = async (bookingId: number) => {
    const reason = window.prompt("Укажите причину отмены");
    if (!reason || !reason.trim()) return;
    setUpdatingId(bookingId);
    try {
      await api.cancelBooking(bookingId, reason.trim());
      await refetch();
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <CalendarClock className="h-6 w-6 text-primary" />
            Бронирование
          </h2>
          <p className="text-muted-foreground mt-1">
            Менеджер подтверждает или отклоняет входящие бронирования клиентов
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

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-sm text-muted-foreground">Всего заявок</div>
          <div className="mt-1 text-2xl font-bold">{summary.count}</div>
        </div>
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4">
          <div className="text-sm text-amber-300">Ожидают решения</div>
          <div className="mt-1 text-2xl font-bold text-amber-200">{summary.pending_count}</div>
        </div>
        <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-4">
          <div className="text-sm text-rose-300">Отменено</div>
          <div className="mt-1 text-2xl font-bold text-rose-200">{summary.cancelled_count}</div>
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
          {bookings.map((booking) => {
            const current = statusUi(booking.status);
            const isPending = booking.status === "pending";
            return (
              <div key={booking.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm font-semibold text-foreground">Заявка #{booking.id}</div>
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
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${current.className}`}>
                    {current.label}
                  </span>
                </div>

                {booking.status === "cancelled" && booking.cancellation_reason ? (
                  <div className="mt-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
                    Причина отмены: {booking.cancellation_reason}
                  </div>
                ) : null}

                {isPending ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={updatingId === booking.id}
                      onClick={() => handleStatusUpdate(booking.id, "approved")}
                      className="rounded-lg border border-emerald-500/40 bg-emerald-500/20 px-3 py-1.5 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/30 disabled:opacity-60"
                    >
                      Подтвердить
                    </button>
                    <button
                      type="button"
                      disabled={updatingId === booking.id}
                      onClick={() => handleStatusUpdate(booking.id, "rejected")}
                      className="rounded-lg border border-rose-500/40 bg-rose-500/20 px-3 py-1.5 text-xs font-semibold text-rose-200 hover:bg-rose-500/30 disabled:opacity-60"
                    >
                      Отказать
                    </button>
                    <button
                      type="button"
                      disabled={updatingId === booking.id}
                      onClick={() => handleCancel(booking.id)}
                      className="rounded-lg border border-border bg-muted/40 px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted/60 disabled:opacity-60"
                    >
                      Отменить
                    </button>
                  </div>
                ) : booking.status === "approved" ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={updatingId === booking.id}
                      onClick={() => handleCancel(booking.id)}
                      className="rounded-lg border border-border bg-muted/40 px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted/60 disabled:opacity-60"
                    >
                      Отменить с причиной
                    </button>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BookingPanel;
