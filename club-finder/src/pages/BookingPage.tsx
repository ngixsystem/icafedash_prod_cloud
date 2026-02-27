import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Monitor, Clock, Check, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface ClubZone {
  name: string;
  price?: string;
}

interface ClubPayload {
  id: number;
  name: string;
  zones: ClubZone[];
}

interface ZonePc {
  id: string | number;
  name: string;
  status: "free" | "busy" | "offline";
}

interface MyBooking {
  id: number;
  club_name: string;
  zone_name: string;
  duration: string | null;
  pc_names: string[];
  status: "pending" | "approved" | "rejected" | "cancelled";
  cancellation_reason?: string | null;
  canceled_by?: string | null;
  canceled_at?: string | null;
  chat_url?: string | null;
  created_at: string | null;
}

const durationOptions = ["30 мин", "1 час", "2 часа", "3 часа", "5 часов"];

function formatDate(value: string | null): string {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function bookingStatusUi(status: string) {
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

export default function BookingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const clubId = searchParams.get("club");
  const zoneQuery = (searchParams.get("zone") || "").trim();

  const [club, setClub] = useState<ClubPayload | null>(null);
  const [loadingClub, setLoadingClub] = useState(true);

  const [selectedZone, setSelectedZone] = useState("");
  const [zonePcs, setZonePcs] = useState<ZonePc[]>([]);
  const [loadingPcs, setLoadingPcs] = useState(false);
  const [selectedPcs, setSelectedPcs] = useState<string[]>([]);

  const [duration, setDuration] = useState(durationOptions[1]);
  const [clientName, setClientName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [booked, setBooked] = useState<null | { id: number; zone_name: string; pc_names: string[]; status: string }>(null);

  const [myBookings, setMyBookings] = useState<MyBooking[]>([]);
  const [loadingMyBookings, setLoadingMyBookings] = useState(false);
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  const token = localStorage.getItem("icafe_client_token");

  const activeBooking = useMemo(
    () => myBookings.find((b) => b.status === "pending" || b.status === "approved"),
    [myBookings]
  );

  const loadMyBookings = async (opts?: { silent?: boolean }) => {
    if (!token) {
      setMyBookings([]);
      return;
    }
    if (!opts?.silent) {
      setLoadingMyBookings(true);
    }
    try {
      const res = await fetch("/api/public/bookings/my", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await res.json();
      if (res.status === 401 || res.status === 422) {
        localStorage.removeItem("icafe_client_token");
        localStorage.removeItem("icafe_client_user");
        setMyBookings([]);
        return;
      }
      if (!res.ok) throw new Error(payload?.message || "Не удалось загрузить бронирования");
      const nextBookings = Array.isArray(payload?.bookings) ? payload.bookings : [];
      setMyBookings((prev) => {
        if (JSON.stringify(prev) === JSON.stringify(nextBookings)) return prev;
        return nextBookings;
      });
    } catch {
      if (!opts?.silent) {
        setMyBookings([]);
      }
    } finally {
      if (!opts?.silent) {
        setLoadingMyBookings(false);
      }
    }
  };

  const cancelMyBooking = async (bookingId: number) => {
    if (!token) return;
    const reason = window.prompt("Укажите причину отмены");
    if (!reason || !reason.trim()) {
      toast({ title: "Ошибка", description: "Причина отмены обязательна", variant: "destructive" });
      return;
    }
    setCancellingId(bookingId);
    try {
      const res = await fetch(`/api/public/bookings/${bookingId}/cancel`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: reason.trim() }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.message || "Не удалось отменить бронь");
      await loadMyBookings();
      toast({ title: "Готово", description: "Бронь отменена" });
    } catch (err: any) {
      toast({ title: "Ошибка", description: err?.message || "Не удалось отменить бронь", variant: "destructive" });
    } finally {
      setCancellingId(null);
    }
  };

  useEffect(() => {
    loadMyBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      loadMyBookings({ silent: true });
    }, 5000);
    return () => window.clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onFocus = () => {
      loadMyBookings({ silent: true });
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!booked) return;
    const refreshed = myBookings.find((b) => b.id === booked.id);
    if (!refreshed) return;
    if (refreshed.status !== booked.status) {
      setBooked((prev) => (prev ? { ...prev, status: refreshed.status } : prev));
    }
  }, [myBookings, booked]);

  useEffect(() => {
    if (!clubId) {
      setLoadingClub(false);
      return;
    }

    let alive = true;
    setLoadingClub(true);

    fetch(`/api/public/clubs/${clubId}`)
      .then(async (res) => {
        const payload = await res.json();
        if (!res.ok) throw new Error(payload?.message || "Не удалось загрузить клуб");
        return payload as ClubPayload;
      })
      .then((payload) => {
        if (!alive) return;
        setClub(payload);
        const zones = payload.zones || [];
        const queryZone = zones.find((z) => (z.name || "").toLowerCase() === zoneQuery.toLowerCase());
        setSelectedZone(queryZone?.name || zones[0]?.name || "");
      })
      .catch((err: any) => {
        toast({
          title: "Ошибка",
          description: err?.message || "Не удалось загрузить клуб",
          variant: "destructive",
        });
      })
      .finally(() => {
        if (alive) setLoadingClub(false);
      });

    return () => {
      alive = false;
    };
  }, [clubId, zoneQuery, toast]);

  useEffect(() => {
    if (!clubId || !selectedZone) {
      setZonePcs([]);
      return;
    }

    let alive = true;
    setLoadingPcs(true);
    setSelectedPcs([]);

    fetch(`/api/public/clubs/${clubId}/zone-pcs?zone_name=${encodeURIComponent(selectedZone)}`)
      .then(async (res) => {
        const payload = await res.json();
        if (!res.ok) throw new Error(payload?.message || "Не удалось загрузить ПК");
        return payload;
      })
      .then((payload) => {
        if (!alive) return;
        setZonePcs(Array.isArray(payload?.pcs) ? payload.pcs : []);
      })
      .catch((err: any) => {
        setZonePcs([]);
        toast({
          title: "Ошибка",
          description: err?.message || "Не удалось загрузить ПК по зоне",
          variant: "destructive",
        });
      })
      .finally(() => {
        if (alive) setLoadingPcs(false);
      });

    return () => {
      alive = false;
    };
  }, [clubId, selectedZone, toast]);

  const freeCount = useMemo(() => zonePcs.filter((pc) => pc.status === "free").length, [zonePcs]);

  const togglePc = (pc: ZonePc) => {
    if (pc.status !== "free") return;
    setSelectedPcs((prev) => {
      if (prev.includes(pc.name)) return prev.filter((name) => name !== pc.name);
      if (prev.length >= 10) {
        toast({
          title: "Лимит",
          description: "Можно забронировать максимум 10 ПК",
          variant: "destructive",
        });
        return prev;
      }
      return [...prev, pc.name];
    });
  };

  const submitBooking = async () => {
    if (!clubId || !selectedZone) return;
    if (!token) {
      navigate("/auth", { state: { from: { pathname: "/booking", search: `?club=${clubId}&zone=${encodeURIComponent(selectedZone)}` } } });
      return;
    }
    if (activeBooking) {
      toast({
        title: "Ограничение",
        description: "У вас уже есть активная бронь. Сначала отмените её.",
        variant: "destructive",
      });
      return;
    }
    if (!clientName.trim()) {
      toast({ title: "Ошибка", description: "Введите имя", variant: "destructive" });
      return;
    }
    if (!phone.trim()) {
      toast({ title: "Ошибка", description: "Введите номер телефона", variant: "destructive" });
      return;
    }
    if (selectedPcs.length < 1) {
      toast({ title: "Ошибка", description: "Выберите хотя бы один ПК", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/public/clubs/${clubId}/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          client_name: clientName.trim(),
          phone: phone.trim(),
          zone_name: selectedZone,
          duration,
          pc_names: selectedPcs,
        }),
      });

      const payload = await res.json();
      if (res.status === 401 || res.status === 422) {
        localStorage.removeItem("icafe_client_token");
        localStorage.removeItem("icafe_client_user");
        toast({
          title: "Сессия истекла",
          description: "Войдите заново, чтобы продолжить бронирование",
          variant: "destructive",
        });
        navigate("/auth", { state: { from: { pathname: "/booking", search: `?club=${clubId}&zone=${encodeURIComponent(selectedZone)}` } } });
        return;
      }
      if (!res.ok) throw new Error(payload?.message || "Не удалось создать бронь");

      setBooked({
        id: payload.booking?.id || 0,
        zone_name: payload.booking?.zone_name || selectedZone,
        pc_names: Array.isArray(payload.booking?.pc_names) ? payload.booking.pc_names : selectedPcs,
        status: payload.booking?.status || "pending",
      });
      await loadMyBookings();
      toast({ title: "Готово", description: "Бронь отправлена менеджеру (статус: ожидание)" });
    } catch (err: any) {
      toast({
        title: "Ошибка",
        description: err?.message || "Не удалось создать бронь",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!clubId) {
    return (
      <div className="min-h-screen pb-24">
        <div className="flex items-center gap-3 px-4 pt-12 pb-4">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full glass flex items-center justify-center">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-display font-bold">Бронирование</h1>
            <p className="text-xs text-muted-foreground">Мои брони</p>
          </div>
        </div>

        <div className="px-4 mb-4">
          <Button onClick={() => navigate("/")} variant="outline" className="w-full">
            Выбрать клуб для новой брони
          </Button>
        </div>

        <div className="px-4 space-y-3">
          {loadingMyBookings ? (
            <div className="text-sm text-muted-foreground">Загрузка бронирований...</div>
          ) : myBookings.length === 0 ? (
            <div className="text-sm text-muted-foreground">У вас пока нет бронирований</div>
          ) : (
            myBookings.map((b) => {
              const ui = bookingStatusUi(b.status);
              const canCancel = b.status === "pending" || b.status === "approved";
              const canOpenChat = b.status === "approved" && !!b.chat_url;
              return (
                <div
                  key={b.id}
                  onClick={() => {
                    if (canOpenChat && b.chat_url) window.open(b.chat_url, "_blank", "noopener,noreferrer");
                  }}
                  className={`rounded-xl border border-white/10 bg-[#11131a] p-4 ${canOpenChat ? "cursor-pointer hover:border-emerald-400/40" : ""}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-semibold text-white">#{b.id} · {b.club_name}</div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${ui.className}`}>{ui.label}</span>
                  </div>
                  <div className="mt-2 text-sm text-white/80">{b.zone_name}</div>
                  <div className="mt-1 text-xs text-white/60">{b.pc_names.join(", ")}</div>
                  <div className="mt-1 text-xs text-white/50">{formatDate(b.created_at)}</div>

                  {b.status === "cancelled" && b.cancellation_reason ? (
                    <div className="mt-2 rounded-lg border border-slate-500/40 bg-slate-500/10 px-2.5 py-2 text-xs text-slate-200">
                      Причина отмены: {b.cancellation_reason}
                    </div>
                  ) : null}

                  <div className="mt-3 flex flex-wrap gap-2">
                    {canCancel ? (
                      <button
                        type="button"
                        disabled={cancellingId === b.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          cancelMyBooking(b.id);
                        }}
                        className="rounded-lg border border-border bg-muted/40 px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted/60 disabled:opacity-60"
                      >
                        Отменить бронь
                      </button>
                    ) : null}
                    {b.status === "approved" && b.chat_url ? (
                      <a
                        href={b.chat_url}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/40 bg-emerald-500/20 px-3 py-1.5 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/30"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        Чат с менеджером
                      </a>
                    ) : null}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  }

  if (booked && club) {
    const ui = bookingStatusUi(booked.status);
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <div className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center mb-6 neon-glow">
          <Check className="w-10 h-10 text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-display font-bold mb-2">Бронь отправлена</h1>
        <p className="text-muted-foreground text-sm mb-2">
          {club.name} · {booked.zone_name}
        </p>
        <p className="text-muted-foreground text-sm mb-3">{booked.pc_names.join(", ")}</p>
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold mb-6 ${ui.className}`}>{ui.label}</span>
        <Button onClick={() => navigate("/booking")} className="gradient-primary text-primary-foreground font-display font-bold px-8 h-11">
          Мои брони
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      <div className="flex items-center gap-3 px-4 pt-12 pb-4">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full glass flex items-center justify-center">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-display font-bold">Бронирование</h1>
          <p className="text-xs text-muted-foreground">{club?.name || "Загрузка..."}</p>
        </div>
      </div>

      {loadingClub ? (
        <div className="px-4 text-sm text-muted-foreground">Загрузка клуба...</div>
      ) : !club ? (
        <div className="px-4 text-sm text-muted-foreground">Клуб не найден</div>
      ) : (
        <>
          {activeBooking ? (
            <div className="mx-4 mb-4 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
              У вас уже есть активная бронь #{activeBooking.id}. Чтобы создать новую, сначала отмените текущую в разделе "Мои брони".
            </div>
          ) : null}

          <div className="px-4 mb-5">
            <h2 className="text-sm font-display font-bold mb-2 text-muted-foreground uppercase tracking-wider">Зона</h2>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {(club.zones || []).map((zone) => (
                <button
                  key={zone.name}
                  onClick={() => setSelectedZone(zone.name)}
                  className={`flex-shrink-0 rounded-lg px-4 py-3 text-sm font-medium transition border ${
                    selectedZone === zone.name
                      ? "border-primary bg-primary/10 text-primary neon-border"
                      : "border-border bg-secondary text-secondary-foreground"
                  }`}
                >
                  <div className="font-display font-bold">{zone.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{zone.price || "Цена не указана"}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="px-4 mb-5">
            <h2 className="text-sm font-display font-bold mb-2 text-muted-foreground uppercase tracking-wider">
              <Monitor className="w-3.5 h-3.5 inline mr-1" /> Выбери ПК
            </h2>
            <div className="text-xs text-muted-foreground mb-2">
              Свободно: {freeCount} из {zonePcs.length} · Выбрано: {selectedPcs.length}/10
            </div>
            {loadingPcs ? (
              <div className="text-sm text-muted-foreground">Загрузка ПК...</div>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {zonePcs.map((pc) => {
                  const selected = selectedPcs.includes(pc.name);
                  const clickable = pc.status === "free";
                  const statusClass =
                    pc.status === "free"
                      ? "border-emerald-500/50 text-emerald-300 bg-emerald-500/10"
                      : pc.status === "busy"
                      ? "border-orange-500/50 text-orange-300 bg-orange-500/10"
                      : "border-slate-500/40 text-slate-400 bg-slate-500/10";
                  return (
                    <button
                      key={String(pc.id)}
                      type="button"
                      disabled={!clickable}
                      onClick={() => togglePc(pc)}
                      className={`rounded-md px-2 py-2 text-xs font-bold flex items-center justify-center transition border ${
                        selected
                          ? "border-primary bg-primary/10 text-primary neon-border"
                          : `${statusClass} ${clickable ? "hover:brightness-110" : "cursor-not-allowed opacity-90"}`
                      }`}
                    >
                      {pc.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="px-4 mb-5">
            <h2 className="text-sm font-display font-bold mb-2 text-muted-foreground uppercase tracking-wider">
              <Clock className="w-3.5 h-3.5 inline mr-1" /> Время
            </h2>
            <div className="flex gap-2 flex-wrap">
              {durationOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => setDuration(option)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition border ${
                    duration === option
                      ? "border-primary bg-primary/10 text-primary neon-border"
                      : "border-border bg-secondary text-secondary-foreground"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="px-4 mb-6 space-y-3">
            <Input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Имя клиента *" />
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Номер телефона *" />
          </div>

          <div className="px-4">
            <Button
              onClick={submitBooking}
              disabled={!!activeBooking || submitting || selectedPcs.length < 1 || !clientName.trim() || !phone.trim()}
              className="w-full h-12 rounded-lg gradient-primary text-primary-foreground font-display font-bold text-base neon-glow disabled:opacity-40 disabled:shadow-none"
            >
              {submitting ? "Отправка..." : "Забронировать"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
