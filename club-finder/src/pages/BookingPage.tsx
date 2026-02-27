import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Monitor, Clock, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface ClubZone {
  name: string;
  price?: string;
  specs?: string;
  capacity?: string;
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

const durationOptions = ["30 мин", "1 час", "2 часа", "3 часа", "5 часов"];

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
  const [booked, setBooked] = useState<null | { zone_name: string; pc_names: string[] }>(null);

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
      if (prev.includes(pc.name)) {
        return prev.filter((name) => name !== pc.name);
      }
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

    const token = localStorage.getItem("icafe_client_token");
    if (!token) {
      navigate("/auth", { state: { from: { pathname: `/booking?club=${clubId}&zone=${encodeURIComponent(selectedZone)}` } } });
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
      if (!res.ok) throw new Error(payload?.message || "Не удалось создать бронь");

      setBooked({
        zone_name: payload.booking?.zone_name || selectedZone,
        pc_names: Array.isArray(payload.booking?.pc_names) ? payload.booking.pc_names : selectedPcs,
      });
      toast({ title: "Готово", description: "Бронь отправлена менеджеру" });
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

  if (booked && club) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <div className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center mb-6 neon-glow">
          <Check className="w-10 h-10 text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-display font-bold mb-2">Бронь отправлена</h1>
        <p className="text-muted-foreground text-sm mb-2">
          {club.name} · {booked.zone_name}
        </p>
        <p className="text-muted-foreground text-sm mb-6">{booked.pc_names.join(", ")}</p>
        <Button onClick={() => navigate("/")} className="gradient-primary text-primary-foreground font-display font-bold px-8 h-11">
          На главную
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

      {!clubId ? (
        <div className="px-4 text-sm text-muted-foreground">Клуб не выбран</div>
      ) : loadingClub ? (
        <div className="px-4 text-sm text-muted-foreground">Загрузка клуба...</div>
      ) : !club ? (
        <div className="px-4 text-sm text-muted-foreground">Клуб не найден</div>
      ) : (
        <>
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
                  return (
                    <button
                      key={String(pc.id)}
                      type="button"
                      disabled={!clickable}
                      onClick={() => togglePc(pc)}
                      className={`rounded-md px-2 py-2 text-xs font-bold flex items-center justify-center transition border ${
                        selected
                          ? "border-primary bg-primary/10 text-primary neon-border"
                          : clickable
                          ? "border-border bg-secondary text-foreground hover:bg-primary/15"
                          : "border-border bg-muted/20 text-muted-foreground/70 cursor-not-allowed"
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
              disabled={submitting || selectedPcs.length < 1 || !clientName.trim() || !phone.trim()}
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
