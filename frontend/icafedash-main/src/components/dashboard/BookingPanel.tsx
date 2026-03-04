import { useEffect, useMemo, useState } from "react";
import {
  CalendarClock,
  Clock3,
  MapPin,
  Monitor,
  Phone,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api, type BookingPcOption, type DashboardBooking } from "@/lib/api";

type FilterKey = "all" | "active" | "pending" | "cancelled" | "completed";

interface BookingPanelProps {
  searchQuery?: string;
}

function formatDateTime(value: string | null): string {
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

function formatCardTime(value: string | null): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "U";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

function statusUi(status: string): {
  label: string;
  chipClass: string;
  borderClass: string;
  accentClass: string;
  isActive: boolean;
} {
  if (status === "completed") {
    return {
      label: "Завершено",
      chipClass: "bg-cyan-500/10 text-cyan-300 border border-cyan-500/30",
      borderClass: "group-hover:border-cyan-500/50",
      accentClass: "bg-cyan-500/60 group-hover:bg-cyan-400",
      isActive: false,
    };
  }
  if (status === "approved") {
    return {
      label: "Активен",
      chipClass: "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30",
      borderClass: "group-hover:border-emerald-500/50",
      accentClass: "bg-emerald-500/80 group-hover:bg-emerald-500",
      isActive: true,
    };
  }
  if (status === "rejected") {
    return {
      label: "Отклонено",
      chipClass: "bg-rose-500/10 text-rose-300 border border-rose-500/30",
      borderClass: "group-hover:border-rose-500/50",
      accentClass: "bg-rose-500/50 group-hover:bg-rose-500",
      isActive: false,
    };
  }
  if (status === "cancelled") {
    return {
      label: "Отменено",
      chipClass: "bg-rose-500/10 text-rose-300 border border-rose-500/30",
      borderClass: "group-hover:border-rose-500/50",
      accentClass: "bg-rose-500/50 group-hover:bg-rose-500",
      isActive: false,
    };
  }
  return {
    label: "Ожидание",
    chipClass: "bg-amber-500/10 text-amber-300 border border-amber-500/30",
    borderClass: "group-hover:border-amber-500/50",
    accentClass: "bg-amber-500/60 group-hover:bg-amber-400",
    isActive: false,
  };
}

function trend(nowValue: number, prevValue: number) {
  if (prevValue <= 0) {
    return {
      value: nowValue > 0 ? 100 : 0,
      up: nowValue >= prevValue,
    };
  }
  const raw = ((nowValue - prevValue) / prevValue) * 100;
  return {
    value: Math.abs(raw),
    up: raw >= 0,
  };
}

const BookingPanel = ({ searchQuery = "" }: BookingPanelProps) => {
  const ITEMS_PER_PAGE = 8;
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [duration, setDuration] = useState("1 час");
  const [selectedPcKeys, setSelectedPcKeys] = useState<string[]>([]);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["manager_bookings"],
    queryFn: api.managerBookings,
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
  });

  const { data: pcsData, isFetching: isFetchingPcs, refetch: refetchPcs } = useQuery({
    queryKey: ["manager_booking_pcs"],
    queryFn: api.bookingPcOptions,
    refetchInterval: 10000,
    refetchOnWindowFocus: true,
    enabled: showCreateForm,
  });

  const bookings = useMemo(() => {
    return [...(data?.bookings ?? [])].sort((a, b) => {
      const aDate = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bDate = b.created_at ? new Date(b.created_at).getTime() : 0;
      return bDate - aDate;
    });
  }, [data?.bookings]);

  const summary = useMemo(() => {
    const count = bookings.length;
    const pending = bookings.filter((x) => x.status === "pending").length;
    const cancelled = bookings.filter((x) => x.status === "cancelled" || x.status === "rejected").length;
    const active = bookings.filter((x) => x.status === "approved").length;
    return {
      count,
      pending,
      cancelled,
      active,
    };
  }, [bookings]);

  const trendStats = useMemo(() => {
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    const nowStart = now - day;
    const prevStart = now - 2 * day;

    const inRange = (booking: DashboardBooking, from: number, to: number) => {
      if (!booking.created_at) return false;
      const t = new Date(booking.created_at).getTime();
      if (Number.isNaN(t)) return false;
      return t >= from && t < to;
    };

    const nowAll = bookings.filter((x) => inRange(x, nowStart, now)).length;
    const prevAll = bookings.filter((x) => inRange(x, prevStart, nowStart)).length;

    const nowPending = bookings.filter((x) => x.status === "pending" && inRange(x, nowStart, now)).length;
    const prevPending = bookings.filter((x) => x.status === "pending" && inRange(x, prevStart, nowStart)).length;

    const nowCancelled = bookings.filter(
      (x) => (x.status === "cancelled" || x.status === "rejected") && inRange(x, nowStart, now),
    ).length;
    const prevCancelled = bookings.filter(
      (x) => (x.status === "cancelled" || x.status === "rejected") && inRange(x, prevStart, nowStart),
    ).length;

    return {
      all: trend(nowAll, prevAll),
      pending: trend(nowPending, prevPending),
      cancelled: trend(nowCancelled, prevCancelled),
    };
  }, [bookings]);

  const activity24h = useMemo(() => {
    const bucketCount = 8;
    const buckets = Array.from({ length: bucketCount }, () => ({ blue: 0, rose: 0 }));
    const now = Date.now();
    const from = now - 24 * 60 * 60 * 1000;
    const bucketMs = (24 * 60 * 60 * 1000) / bucketCount;

    bookings.forEach((booking) => {
      if (!booking.created_at) return;
      const t = new Date(booking.created_at).getTime();
      if (Number.isNaN(t) || t < from || t > now) return;
      const idx = Math.min(bucketCount - 1, Math.floor((t - from) / bucketMs));
      if (booking.status === "cancelled" || booking.status === "rejected") {
        buckets[idx].rose += 1;
      } else {
        buckets[idx].blue += 1;
      }
    });

    const maxTotal = Math.max(1, ...buckets.map((x) => x.blue + x.rose));
    return buckets.map((x) => ({
      bluePercent: Math.max(10, Math.round((x.blue / maxTotal) * 100)),
      rosePercent: Math.round((x.rose / maxTotal) * 100),
      totalPercent: Math.max(16, Math.round(((x.blue + x.rose) / maxTotal) * 100)),
    }));
  }, [bookings]);

  const filterButtons: Array<{ key: FilterKey; label: string; dot: string | null }> = [
    { key: "all", label: "Все заявки", dot: null },
    { key: "active", label: "Активные", dot: "bg-emerald-500" },
    { key: "pending", label: "В ожидании", dot: "bg-amber-400" },
    { key: "cancelled", label: "Отмененные", dot: "bg-rose-500" },
    { key: "completed", label: "Завершенные", dot: "bg-cyan-400" },
  ];

  const filteredBookings = useMemo(() => {
    let byStatus = bookings;
    if (activeFilter === "active") byStatus = bookings.filter((x) => x.status === "approved");
    if (activeFilter === "pending") byStatus = bookings.filter((x) => x.status === "pending");
    if (activeFilter === "cancelled") byStatus = bookings.filter((x) => x.status === "cancelled" || x.status === "rejected");
    if (activeFilter === "completed") byStatus = bookings.filter((x) => x.status === "completed");

    const q = searchQuery.trim().toLowerCase();
    if (!q) return byStatus;

    const qDigits = q.replace(/\D/g, "");
    return byStatus.filter((b) => {
      const idText = String(b.id);
      const nameText = String(b.client_name || b.username || "").toLowerCase();
      const phoneText = String(b.phone || "");
      const phoneDigits = phoneText.replace(/\D/g, "");

      const byId = idText.includes(q) || (qDigits ? idText.includes(qDigits) : false);
      const byName = nameText.includes(q);
      const byPhone = phoneText.toLowerCase().includes(q) || (qDigits ? phoneDigits.includes(qDigits) : false);
      return byId || byName || byPhone;
    });
  }, [activeFilter, bookings, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredBookings.length / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const pagedBookings = useMemo(() => {
    const start = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
    return filteredBookings.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredBookings, safeCurrentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter, searchQuery]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const groupedPcs = useMemo(() => {
    const pcs = pcsData?.pcs ?? [];
    const map = new Map<string, BookingPcOption[]>();
    pcs.forEach((pc) => {
      const room = (pc.room || "Без зоны").trim() || "Без зоны";
      const existing = map.get(room) ?? [];
      existing.push(pc);
      map.set(room, existing);
    });
    const entries = Array.from(map.entries()).map(([room, list]) => {
      const sorted = [...list].sort((a, b) => String(a.name).localeCompare(String(b.name), "ru"));
      return {
        room,
        pcs: sorted,
        freeCount: sorted.filter((pc) => pc.status === "free").length,
      };
    });
    return entries.sort((a, b) => a.room.localeCompare(b.room, "ru"));
  }, [pcsData?.pcs]);

  const selectedPcEntries = useMemo(() => {
    return selectedPcKeys
      .map((key) => {
        const [zoneName, pcName] = key.split("::");
        if (!zoneName || !pcName) return null;
        return { zone_name: zoneName, pc_name: pcName };
      })
      .filter((item): item is { zone_name: string; pc_name: string } => item !== null);
  }, [selectedPcKeys]);

  const createBookingMutation = useMutation({
    mutationFn: () =>
      api.createManagerBooking({
        client_name: clientName.trim(),
        phone: clientPhone.trim(),
        duration: duration.trim() || undefined,
        selected_pcs: selectedPcEntries,
      }),
    onSuccess: async () => {
      setClientName("");
      setClientPhone("");
      setDuration("1 час");
      setSelectedPcKeys([]);
      setShowCreateForm(false);
      await refetch();
      await refetchPcs();
    },
  });

  const handleStatusUpdate = async (bookingId: number, status: "approved" | "rejected" | "completed") => {
    setUpdatingId(bookingId);
    try {
      const response = await api.updateBookingStatus(bookingId, status);
      if (status === "approved" && response.maintenance?.requested && response.maintenance?.success === false) {
        const m = response.maintenance;
        const details = [
          m?.message ? `Причина: ${m.message}` : "",
          m?.mode ? `Режим: ${m.mode}` : "",
          m?.result?.code ? `Код API: ${m.result.code}` : "",
          m?.result?.message ? `Ответ API: ${m.result.message}` : "",
          m?.fallback_from_names_result?.message ? `Fallback(names): ${m.fallback_from_names_result.message}` : "",
          m?.fallback_from_name_objects_result?.message ? `Fallback(name_objects): ${m.fallback_from_name_objects_result.message}` : "",
          m?.fallback_from_rich_objects_result?.message ? `Fallback(rich_objects): ${m.fallback_from_rich_objects_result.message}` : "",
          m?.fallback_from_full_names_result?.message ? `Fallback(full_names): ${m.fallback_from_full_names_result.message}` : "",
          m?.fallback_from_ids_str_result?.message ? `Fallback(ids): ${m.fallback_from_ids_str_result.message}` : "",
        ]
          .filter(Boolean)
          .join("\n");
        window.alert(
          `Заявка активирована, но ПК не удалось перевести в ремонт.\n${details || "Проверьте ключ iCafeCloud и права на управление ПК."}`,
        );
      }
      await refetch();
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Не удалось обновить статус заявки";
      window.alert(message);
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

  const togglePcSelection = (room: string, name: string) => {
    const key = `${room}::${name}`;
    setSelectedPcKeys((prev) => (prev.includes(key) ? prev.filter((x) => x !== key) : [...prev, key]));
  };

  const handleCreateBooking = async () => {
    if (!clientName.trim()) {
      window.alert("Введите имя клиента");
      return;
    }
    if (!clientPhone.trim()) {
      window.alert("Введите телефон клиента");
      return;
    }
    if (selectedPcEntries.length === 0) {
      window.alert("Выберите минимум один свободный ПК");
      return;
    }
    try {
      await createBookingMutation.mutateAsync();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Не удалось создать заявку";
      window.alert(message);
    }
  };

  return (
    <section className="space-y-6 md:space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-3">
            <span className="rounded-lg bg-blue-500/10 p-2 text-blue-400">
              <CalendarClock className="h-6 w-6" />
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-white">Бронирование</h2>
          </div>
          <p className="max-w-xl text-sm text-slate-400">
            Менеджер подтверждает или отклоняет входящие бронирования клиентов в реальном времени.
          </p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#2A2E45] bg-[#1F2235] px-4 py-2 text-sm text-slate-300 transition-all hover:border-[#3a4060] hover:bg-[#2A2E45]"
        >
          <RefreshCw className={`h-4 w-4 transition-transform ${isFetching ? "animate-spin" : ""}`} />
          Обновить
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:col-span-8">
          <div className="relative overflow-hidden rounded-xl border border-white/10 bg-[rgba(21,23,37,0.78)] p-5 backdrop-blur-xl">
            <div className="absolute -right-14 -top-14 h-36 w-36 rounded-full bg-blue-500/10 blur-3xl" />
            <div className="relative z-10">
              <div className="text-sm font-medium text-slate-400">Всего заявок</div>
              <div className="mt-1 text-4xl font-bold text-white">{summary.count}</div>
              <div className="mt-4 flex h-10 items-end gap-1 opacity-70">
                {activity24h.slice(0, 6).map((item, idx) => (
                  <div key={`all-${idx}`} className="h-full flex-1 rounded-t-sm bg-blue-500/20">
                    <div className="h-full rounded-t-sm bg-blue-500" style={{ height: `${item.totalPercent}%` }} />
                  </div>
                ))}
              </div>
              <div
                className={`absolute bottom-0 right-0 inline-flex items-center gap-1 text-xs font-mono ${trendStats.all.up ? "text-blue-400" : "text-rose-400"}`}
              >
                {trendStats.all.up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {trendStats.all.up ? "+" : "-"}
                {trendStats.all.value.toFixed(1)}%
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-xl border border-white/10 bg-[rgba(21,23,37,0.78)] p-5 backdrop-blur-xl">
            <div className="absolute -right-14 -top-14 h-36 w-36 rounded-full bg-amber-400/10 blur-3xl" />
            <div className="relative z-10">
              <div className="text-sm font-medium text-slate-400">Ожидают решения</div>
              <div className="mt-1 text-4xl font-bold text-white">{summary.pending}</div>
              <div className="mt-4 h-10">
                <svg className="h-full w-full text-amber-300/70" viewBox="0 0 100 40" preserveAspectRatio="none">
                  <path d="M0 35 Q 25 35 50 35 T 100 35" fill="none" stroke="currentColor" strokeDasharray="4 2" strokeWidth="2" />
                </svg>
              </div>
              <div
                className={`absolute bottom-0 right-0 inline-flex items-center gap-1 text-xs font-mono ${
                  trendStats.pending.up ? "text-amber-300" : "text-rose-400"
                }`}
              >
                {trendStats.pending.up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {trendStats.pending.up ? "+" : "-"}
                {trendStats.pending.value.toFixed(1)}%
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-xl border border-white/10 bg-[rgba(21,23,37,0.78)] p-5 shadow-[0_0_20px_rgba(244,63,94,0.15)] backdrop-blur-xl">
            <div className="absolute -right-14 -top-14 h-36 w-36 rounded-full bg-rose-500/10 blur-3xl" />
            <div className="relative z-10">
              <div className="text-sm font-medium text-slate-400">Отменено</div>
              <div className="mt-1 text-4xl font-bold text-white">{summary.cancelled}</div>
              <div className="mt-4 flex h-10 items-end gap-1">
                {activity24h.slice(0, 6).map((item, idx) => (
                  <div key={`cancel-${idx}`} className="h-full flex-1 rounded-t-sm bg-rose-500/20">
                    <div className="rounded-t-sm bg-rose-500" style={{ height: `${Math.max(18, item.rosePercent)}%` }} />
                  </div>
                ))}
              </div>
              <div
                className={`absolute bottom-0 right-0 inline-flex items-center gap-1 text-xs font-mono ${
                  trendStats.cancelled.up ? "text-rose-300" : "text-emerald-400"
                }`}
              >
                {trendStats.cancelled.up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {trendStats.cancelled.up ? "+" : "-"}
                {trendStats.cancelled.value.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-[rgba(21,23,37,0.78)] p-5 backdrop-blur-xl lg:col-span-4">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Активность за 24ч</h3>
            <div className="flex gap-2">
              <span className="h-2 w-2 rounded-full bg-blue-500" />
              <span className="h-2 w-2 rounded-full bg-rose-500" />
            </div>
          </div>
          <div className="flex h-40 items-end gap-2 px-1">
            {activity24h.map((bucket, idx) => (
              <div key={idx} className="relative h-full flex-1 overflow-hidden rounded-t bg-[#1F2235]">
                <div className="absolute bottom-0 w-full rounded-t bg-blue-500/80" style={{ height: `${bucket.bluePercent}%` }} />
                {bucket.rosePercent > 0 ? (
                  <div
                    className="absolute w-full rounded-t border-b border-[#151725] bg-rose-500/80"
                    style={{ height: `${bucket.rosePercent}%`, bottom: `${bucket.bluePercent}%` }}
                  />
                ) : null}
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between border-t border-white/10 pt-2 text-[10px] font-mono text-slate-500">
            <span>00:00</span>
            <span>06:00</span>
            <span>12:00</span>
            <span>18:00</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 overflow-x-auto pb-2">
        {filterButtons.map((button) => {
          const active = activeFilter === button.key;
          return (
            <button
              key={button.key}
              type="button"
              onClick={() => setActiveFilter(button.key)}
              className={
                active
                  ? "whitespace-nowrap rounded-full bg-white px-4 py-1.5 text-sm font-medium text-[#0B0C15] shadow-lg shadow-white/10"
                  : "inline-flex whitespace-nowrap rounded-full border border-[#2A2E45] bg-[#1F2235] px-4 py-1.5 text-sm font-medium text-slate-400 transition-all hover:border-[#3a4060] hover:bg-[#2A2E45] hover:text-white"
              }
            >
              {button.dot ? <span className={`mr-2 mt-1 h-1.5 w-1.5 rounded-full ${button.dot}`} /> : null}
              {button.label}
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => setShowCreateForm((prev) => !prev)}
          className="ml-auto inline-flex whitespace-nowrap rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5 text-sm font-medium text-cyan-200 transition-all hover:bg-cyan-500/20"
        >
          {showCreateForm ? "Скрыть форму" : "Создать заявку"}
        </button>
      </div>

      {showCreateForm ? (
        <div className="rounded-xl border border-white/10 bg-[rgba(21,23,37,0.9)] p-4 backdrop-blur-xl md:p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-white">Новая заявка</h3>
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="rounded-md border border-[#2A2E45] bg-[#1F2235] p-1.5 text-slate-300 hover:bg-[#2A2E45]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <label className="text-xs text-slate-400">
              Имя клиента
              <input
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Введите имя"
                className="mt-1 w-full rounded-lg border border-[#2A2E45] bg-[#151725] px-3 py-2 text-sm text-white outline-none transition-colors focus:border-cyan-500/50"
              />
            </label>
            <label className="text-xs text-slate-400">
              Телефон
              <input
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                placeholder="998..."
                className="mt-1 w-full rounded-lg border border-[#2A2E45] bg-[#151725] px-3 py-2 text-sm text-white outline-none transition-colors focus:border-cyan-500/50"
              />
            </label>
            <label className="text-xs text-slate-400">
              Длительность
              <input
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="1 час"
                className="mt-1 w-full rounded-lg border border-[#2A2E45] bg-[#151725] px-3 py-2 text-sm text-white outline-none transition-colors focus:border-cyan-500/50"
              />
            </label>
          </div>

          <div className="mt-4 rounded-lg border border-white/10 bg-[#151725]/70 p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-medium text-white">Выбор свободных ПК</p>
              <button
                type="button"
                onClick={() => refetchPcs()}
                className="inline-flex items-center gap-1 rounded-md border border-[#2A2E45] bg-[#1F2235] px-2 py-1 text-xs text-slate-300 hover:bg-[#2A2E45]"
              >
                <RefreshCw className={`h-3 w-3 ${isFetchingPcs ? "animate-spin" : ""}`} />
                Обновить ПК
              </button>
            </div>

            <div className="max-h-64 space-y-3 overflow-y-auto pr-1">
              {groupedPcs.length === 0 ? (
                <p className="text-xs text-slate-500">Список ПК пуст или API недоступен.</p>
              ) : (
                groupedPcs.map((group) => (
                  <div key={group.room} className="rounded-lg border border-white/10 bg-[#101321] p-2.5">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-300">{group.room}</span>
                      <span className="text-[11px] text-emerald-300">Свободно: {group.freeCount}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4">
                      {group.pcs.map((pc) => {
                        const key = `${group.room}::${pc.name}`;
                        const checked = selectedPcKeys.includes(key);
                        const isFree = pc.status === "free";
                        return (
                          <label
                            key={key}
                            className={`flex items-center gap-2 rounded-md border px-2 py-1.5 text-xs ${
                              isFree
                                ? checked
                                  ? "border-cyan-500/50 bg-cyan-500/10 text-cyan-100"
                                  : "border-white/10 bg-[#151725] text-slate-300"
                                : "cursor-not-allowed border-rose-500/20 bg-rose-500/5 text-slate-500"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              disabled={!isFree}
                              onChange={() => togglePcSelection(group.room, String(pc.name))}
                              className="accent-cyan-400"
                            />
                            <span className="truncate">{pc.name}</span>
                            {!isFree ? <span className="ml-auto text-[10px] uppercase">{pc.status}</span> : null}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleCreateBooking}
              disabled={createBookingMutation.isPending}
              className="rounded-lg border border-cyan-500/40 bg-cyan-500/20 px-4 py-2 text-sm font-semibold text-cyan-100 transition-colors hover:bg-cyan-500/30 disabled:opacity-60"
            >
              {createBookingMutation.isPending ? "Создание..." : "Создать заявку"}
            </button>
            <span className="text-xs text-slate-500">Выбрано ПК: {selectedPcEntries.length}</span>
          </div>
        </div>
      ) : null}

      {isLoading ? (
        <div className="rounded-xl border border-white/10 bg-[rgba(21,23,37,0.78)] p-5 text-sm text-slate-400">
          Загрузка бронирований...
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-[rgba(21,23,37,0.78)] p-5 text-sm text-slate-400">
          По выбранному фильтру заявок нет.
        </div>
      ) : (
        <>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {pagedBookings.map((booking) => {
            const current = statusUi(booking.status);
            const isPending = booking.status === "pending";
            const canCancel = booking.status === "pending" || booking.status === "approved";
            const canComplete = booking.status === "approved";
            const equipmentText = booking.pc_names.length > 0 ? booking.pc_names.join(", ") : "-";

            return (
              <div
                key={booking.id}
                className={`group relative overflow-hidden rounded-xl border border-white/10 bg-[rgba(21,23,37,0.78)] transition-all duration-300 ${current.borderClass}`}
              >
                <div className={`absolute left-0 top-0 h-full w-1 ${current.accentClass}`} />

                <div className="p-4">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-400 transition-colors group-hover:text-white">#{booking.id}</span>
                      <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${current.chipClass}`}>
                        {current.label}
                      </span>
                    </div>
                    <span className="font-mono text-xs text-slate-500">{formatCardTime(booking.created_at)}</span>
                  </div>

                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-600 bg-gradient-to-b from-slate-700 to-slate-800 text-sm font-bold text-white shadow-lg">
                      {getInitials(booking.client_name || booking.username || "U")}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-bold text-white">{booking.client_name || booking.username || "Без имени"}</div>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-400">
                        <Phone className="h-3 w-3 shrink-0" />
                        <span className="truncate">{booking.phone || "-"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mb-3 grid grid-cols-2 gap-2">
                    <div className="rounded border border-white/10 bg-[#151725]/70 p-2">
                      <div className="text-[10px] uppercase text-slate-500">Локация</div>
                      <div className="flex items-center gap-1 text-xs font-medium text-slate-300">
                        <MapPin className="h-3 w-3 text-cyan-400" />
                        <span className="truncate">{booking.zone_name || "-"}</span>
                      </div>
                    </div>
                    <div className="rounded border border-white/10 bg-[#151725]/70 p-2">
                      <div className="text-[10px] uppercase text-slate-500">Оборудование</div>
                      <div className="flex items-start gap-1 text-xs font-medium text-slate-300" title={equipmentText}>
                        <Monitor className="h-3 w-3 text-violet-400" />
                        <span className="leading-tight break-words">{equipmentText}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-white/10 pt-3 text-xs">
                    <span className="text-slate-500">
                      Длительность: <span className="text-white">{booking.duration || "1 час"}</span>
                    </span>
                    {current.isActive ? (
                      <div className="flex items-end gap-0.5">
                        <div className="h-1.5 w-1 bg-emerald-500/30" />
                        <div className="h-2.5 w-1 bg-emerald-500/50" />
                        <div className="h-3.5 w-1 animate-pulse bg-emerald-500" />
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-slate-500">
                        <Clock3 className="h-3 w-3" />
                        {formatDateTime(booking.created_at)}
                      </span>
                    )}
                  </div>

                  {booking.status === "cancelled" && booking.cancellation_reason ? (
                    <div className="mt-3 rounded border border-rose-500/20 bg-rose-500/5 px-2 py-1.5">
                      <div className="mb-0.5 text-[10px] text-rose-300/70">Причина отмены</div>
                      <div className="text-xs text-slate-300">{booking.cancellation_reason}</div>
                    </div>
                  ) : null}

                  {isPending ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={updatingId === booking.id}
                        onClick={() => handleStatusUpdate(booking.id, "approved")}
                        className="rounded-lg border border-emerald-500/40 bg-emerald-500/20 px-3 py-1.5 text-xs font-semibold text-emerald-200 transition-colors hover:bg-emerald-500/30 disabled:opacity-60"
                      >
                        Подтвердить
                      </button>
                      <button
                        type="button"
                        disabled={updatingId === booking.id}
                        onClick={() => handleStatusUpdate(booking.id, "rejected")}
                        className="rounded-lg border border-rose-500/40 bg-rose-500/20 px-3 py-1.5 text-xs font-semibold text-rose-200 transition-colors hover:bg-rose-500/30 disabled:opacity-60"
                      >
                        Отказать
                      </button>
                    </div>
                  ) : null}

                  {canComplete ? (
                    <div className="mt-2">
                      <button
                        type="button"
                        disabled={updatingId === booking.id}
                        onClick={() => handleStatusUpdate(booking.id, "completed")}
                        className="rounded-lg border border-cyan-500/40 bg-cyan-500/20 px-3 py-1.5 text-xs font-semibold text-cyan-200 transition-colors hover:bg-cyan-500/30 disabled:opacity-60"
                      >
                        Завершить успешно
                      </button>
                    </div>
                  ) : null}

                  {canCancel ? (
                    <div className="mt-2">
                      <button
                        type="button"
                        disabled={updatingId === booking.id}
                        onClick={() => handleCancel(booking.id)}
                        className="rounded-lg border border-[#2A2E45] bg-[#1F2235] px-3 py-1.5 text-xs font-semibold text-slate-200 transition-colors hover:bg-[#2A2E45] disabled:opacity-60"
                      >
                        Отменить с причиной
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>

        {totalPages > 1 ? (
          <div className="mt-4 flex items-center justify-center gap-2">
            <button
              type="button"
              disabled={safeCurrentPage <= 1}
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              className="rounded-md border border-[#2A2E45] bg-[#1F2235] px-3 py-1.5 text-xs text-slate-300 disabled:opacity-50"
            >
              Назад
            </button>
            <span className="text-xs text-slate-400">
              Страница {safeCurrentPage} из {totalPages}
            </span>
            <button
              type="button"
              disabled={safeCurrentPage >= totalPages}
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              className="rounded-md border border-[#2A2E45] bg-[#1F2235] px-3 py-1.5 text-xs text-slate-300 disabled:opacity-50"
            >
              Вперед
            </button>
          </div>
        ) : null}
        </>
      )}
    </section>
  );
};

export default BookingPanel;



