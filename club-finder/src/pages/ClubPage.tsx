import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Star, Monitor, Clock, MapPin, Wifi } from "lucide-react";
import { useClub } from "@/hooks/use-clubs";
import { Button } from "@/components/ui/button";

export default function ClubPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: club, isLoading } = useClub(id);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground animate-pulse">
        Загрузка...
      </div>
    );
  }

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
      <div className="relative h-64 overflow-hidden rounded-b-[2rem]">
        <img src={club.logo || club.image} alt={club.name} className="w-full h-full object-cover" />
        {/* Dark gradient for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0b] via-[#0a0a0b]/40 to-transparent" />

        <button
          onClick={() => navigate(-1)}
          className="absolute top-10 left-6 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center cursor-pointer hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Title Overlaid on Hero Bottom */}
        <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
          <h1 className="text-3xl font-display font-black tracking-wide text-white drop-shadow-xl">{club.name}</h1>
          <div className="flex items-center gap-1.5 text-warning font-black drop-shadow-md mb-1">
            <Star className="w-5 h-5 fill-current" />
            <span className="text-lg">{club.rating}</span>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="px-6 py-5 relative z-10 space-y-7">
        <div className="flex items-center gap-2 text-[13px] text-white/50 -mt-2">
          <MapPin className="w-3.5 h-3.5" /> {club.address}
        </div>

        {/* Status chips */}
        <div className="flex gap-2.5 flex-wrap">
          <span className="px-4 py-1.5 rounded-full text-xs font-bold text-black bg-white">
            {club.isOpen ? "Открыто" : "Закрыто"}
          </span>
          <span className="px-4 py-1.5 rounded-full text-xs font-bold bg-[#04283b] text-[#00bfff]">
            <Monitor className="w-3.5 h-3.5 inline mr-1.5" />
            {club.pcsFree} свободно
          </span>
          <span className="px-4 py-1.5 rounded-full text-xs font-bold bg-white/5 text-white/60">
            <Wifi className="w-3.5 h-3.5 inline mr-1.5" />1 Гбит/с
          </span>
        </div>

        {/* Zones */}
        <h2 className="text-xl font-display font-black tracking-wide mb-4 mt-2">Зоны</h2>
        <div className="space-y-4 mb-8">
          {(!club.zones || club.zones.length === 0) ? (
            <div className="text-sm text-white/40">Нет информации о залах</div>
          ) : club.zones.map((zone: any, i: number) => {
            const zTotal = parseInt(zone.capacity) || 0;
            const zFree = parseInt(zone.pcsFree) || 0;
            // Progress bar shows "Busy" or simply how much is available. Based on styling, it looks like it's a fill. Let's make it the occupied percentage.
            const progressPercent = zTotal > 0 ? ((zTotal - zFree) / zTotal) * 100 : 0;

            return (
              <div
                key={i}
                onClick={() => navigate(`/booking?club=${club.id}&zone=${encodeURIComponent(zone.name)}`)}
                className="rounded-2xl bg-[#0f1015]/90 border border-white/5 p-5 cursor-pointer hover:bg-white/5 active:scale-[0.98] transition-all group"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-display font-black uppercase tracking-wider text-base text-white group-hover:text-[#00bfff] transition-colors">
                    {zone.name}
                  </h3>
                  <span className="text-[#00bfff] font-display font-bold text-base">{zone.price || 0} СУМ/ч</span>
                </div>
                <p className="text-[13px] text-white/50 mb-5">{zone.specs}</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000 ease-out bg-[#10b981] shadow-[0_0_10px_rgba(16,185,129,0.4)]"
                      style={{
                        width: `${progressPercent}%`
                      }}
                    />
                  </div>
                  <span className="text-[13px] font-medium text-white/40 whitespace-nowrap leading-none mt-0.5">
                    {zTotal} ПК
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Tariffs */}
        <h2 className="text-xl font-display font-black tracking-wide mb-4">Тарифы</h2>
        <div className="grid grid-cols-3 gap-3 mb-8">
          {(!club.tariffs || club.tariffs.length === 0) ? (
            <div className="col-span-3 text-sm text-muted-foreground">Нет информации о тарифах</div>
          ) : club.tariffs.map((t: any, i: number) => (
            <div key={i} className="rounded-lg glass p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-muted-foreground text-xs mb-1">
                <Clock className="w-3 h-3" /> {t.duration}
              </div>
              <p className="text-primary font-display font-bold text-lg">{t.price || 0} СУМ</p>
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
