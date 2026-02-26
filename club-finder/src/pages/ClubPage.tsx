import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Star, Monitor, Clock, MapPin, Wifi } from "lucide-react";
import { clubs } from "@/data/clubs";
import { Button } from "@/components/ui/button";

export default function ClubPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const club = clubs.find((c) => c.id === id);

  if (!club) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Клуб не найден
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Hero */}
      <div className="relative h-56">
        <img src={club.image} alt={club.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        <button
          onClick={() => navigate(-1)}
          className="absolute top-10 left-4 w-9 h-9 rounded-full glass flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      </div>

      {/* Info */}
      <div className="px-4 -mt-8 relative z-10">
        <div className="flex items-start justify-between mb-2">
          <h1 className="text-2xl font-display font-bold">{club.name}</h1>
          <div className="flex items-center gap-1 text-warning text-sm font-bold mt-1">
            <Star className="w-4 h-4 fill-current" /> {club.rating}
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <MapPin className="w-3.5 h-3.5" /> {club.address}
        </div>

        {/* Status chips */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${club.isOpen ? "status-free" : "status-busy"}`}>
            {club.isOpen ? "Открыто" : "Закрыто"}
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary/15 text-primary">
            <Monitor className="w-3 h-3 inline mr-1" />
            {club.pcsFree} свободно
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
            <Wifi className="w-3 h-3 inline mr-1" />1 Гбит/с
          </span>
        </div>

        {/* Zones */}
        <h2 className="text-lg font-display font-bold mb-3">Зоны</h2>
        <div className="space-y-3 mb-6">
          {club.zones.map((zone) => {
            const freePercent = (zone.pcsFree / zone.pcsTotal) * 100;
            return (
              <div key={zone.id} className="rounded-lg glass p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-display font-bold text-sm">{zone.name}</h3>
                  <span className="text-primary font-display font-bold">{zone.pricePerHour} ₽/ч</span>
                </div>
                <p className="text-xs text-muted-foreground mb-2">{zone.specs}</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${freePercent}%`,
                        background: freePercent > 30
                          ? "hsl(var(--success))"
                          : freePercent > 0
                          ? "hsl(var(--warning))"
                          : "hsl(var(--destructive))",
                      }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {zone.pcsFree}/{zone.pcsTotal} ПК
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Tariffs */}
        <h2 className="text-lg font-display font-bold mb-3">Тарифы</h2>
        <div className="grid grid-cols-3 gap-2 mb-6">
          {[
            { label: "1 час", price: club.pricePerHour },
            { label: "3 часа", price: Math.round(club.pricePerHour * 2.7) },
            { label: "Ночь", price: Math.round(club.pricePerHour * 4) },
          ].map((t) => (
            <div key={t.label} className="rounded-lg glass p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-muted-foreground text-xs mb-1">
                <Clock className="w-3 h-3" /> {t.label}
              </div>
              <p className="text-primary font-display font-bold text-lg">{t.price} ₽</p>
            </div>
          ))}
        </div>

        {/* Book button */}
        <Button
          onClick={() => navigate(`/booking?club=${club.id}`)}
          className="w-full h-12 rounded-lg gradient-primary text-primary-foreground font-display font-bold text-base neon-glow"
          disabled={!club.isOpen}
        >
          {club.isOpen ? "Забронировать место" : "Клуб закрыт"}
        </Button>
      </div>
    </div>
  );
}
