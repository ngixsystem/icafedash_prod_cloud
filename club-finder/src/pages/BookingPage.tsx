import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Monitor, Clock, Check } from "lucide-react";
import { clubs } from "@/data/clubs";
import { Button } from "@/components/ui/button";

const timeSlots = ["1 час", "2 часа", "3 часа", "5 часов", "Ночь (22–08)"];

export default function BookingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const clubId = searchParams.get("club") || "1";
  const club = clubs.find((c) => c.id === clubId) || clubs[0];

  const [selectedZone, setSelectedZone] = useState(club.zones[0]?.id || "");
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedPc, setSelectedPc] = useState<number | null>(null);
  const [booked, setBooked] = useState(false);

  const zone = club.zones.find((z) => z.id === selectedZone);

  if (booked) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <div className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center mb-6 neon-glow">
          <Check className="w-10 h-10 text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-display font-bold mb-2">Забронировано!</h1>
        <p className="text-muted-foreground text-sm mb-2">
          {club.name} · {zone?.name} · ПК #{selectedPc}
        </p>
        <p className="text-muted-foreground text-sm mb-6">{selectedTime}</p>
        <Button
          onClick={() => navigate("/")}
          className="gradient-primary text-primary-foreground font-display font-bold px-8 h-11"
        >
          На главную
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-4">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full glass flex items-center justify-center">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-display font-bold">Бронирование</h1>
          <p className="text-xs text-muted-foreground">{club.name}</p>
        </div>
      </div>

      {/* Zone selection */}
      <div className="px-4 mb-5">
        <h2 className="text-sm font-display font-bold mb-2 text-muted-foreground uppercase tracking-wider">Зона</h2>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {club.zones.map((z) => (
            <button
              key={z.id}
              onClick={() => { setSelectedZone(z.id); setSelectedPc(null); }}
              className={`flex-shrink-0 rounded-lg px-4 py-3 text-sm font-medium transition border ${
                selectedZone === z.id
                  ? "border-primary bg-primary/10 text-primary neon-border"
                  : "border-border bg-secondary text-secondary-foreground"
              }`}
            >
              <div className="font-display font-bold">{z.name}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{z.pricePerHour} ₽/ч</div>
            </button>
          ))}
        </div>
        {zone && <p className="text-xs text-muted-foreground mt-2">{zone.specs}</p>}
      </div>

      {/* PC grid */}
      {zone && (
        <div className="px-4 mb-5">
          <h2 className="text-sm font-display font-bold mb-2 text-muted-foreground uppercase tracking-wider">
            <Monitor className="w-3.5 h-3.5 inline mr-1" /> Выбери ПК
          </h2>
          <div className="grid grid-cols-6 gap-2">
            {Array.from({ length: zone.pcsTotal }, (_, i) => {
              const pcNum = i + 1;
              const isFree = pcNum <= zone.pcsFree;
              const isSelected = selectedPc === pcNum;
              return (
                <button
                  key={pcNum}
                  disabled={!isFree}
                  onClick={() => setSelectedPc(pcNum)}
                  className={`aspect-square rounded-md text-xs font-bold flex items-center justify-center transition ${
                    isSelected
                      ? "gradient-primary text-primary-foreground neon-glow"
                      : isFree
                      ? "bg-secondary text-foreground hover:bg-primary/20"
                      : "bg-muted/30 text-muted-foreground/30 cursor-not-allowed"
                  }`}
                >
                  {pcNum}
                </button>
              );
            })}
          </div>
          <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-secondary" /> Свободно</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-muted/30" /> Занято</span>
          </div>
        </div>
      )}

      {/* Time selection */}
      <div className="px-4 mb-6">
        <h2 className="text-sm font-display font-bold mb-2 text-muted-foreground uppercase tracking-wider">
          <Clock className="w-3.5 h-3.5 inline mr-1" /> Время
        </h2>
        <div className="flex gap-2 flex-wrap">
          {timeSlots.map((t) => (
            <button
              key={t}
              onClick={() => setSelectedTime(t)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition border ${
                selectedTime === t
                  ? "border-primary bg-primary/10 text-primary neon-border"
                  : "border-border bg-secondary text-secondary-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Book button */}
      <div className="px-4">
        <Button
          onClick={() => setBooked(true)}
          disabled={!selectedPc || !selectedTime}
          className="w-full h-12 rounded-lg gradient-primary text-primary-foreground font-display font-bold text-base neon-glow disabled:opacity-40 disabled:shadow-none"
        >
          Забронировать
        </Button>
      </div>
    </div>
  );
}
