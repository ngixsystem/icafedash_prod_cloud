import { Monitor, Star, MapPin, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import type { Club } from "@/data/clubs";

interface ClubCardProps {
  club: Club;
}

export default function ClubCard({ club }: ClubCardProps) {
  const freePercent = Math.round((club.pcsFree / club.pcsTotal) * 100);

  return (
    <Link
      to={`/club/${club.id}`}
      className="block group relative overflow-hidden glass card-hover rounded-2xl border-white/10"
    >
      {/* Image Section */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={(club as any).logo || club.image}
          alt={club.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />

        {/* Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Rating Badge */}
        <div className="absolute top-3 right-3 glass-dark px-2 py-1 rounded-full flex items-center gap-1.5 border-white/20">
          <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
          <span className="text-xs font-bold text-white">{club.rating}</span>
        </div>

        {/* Status Badge */}
        <div className="absolute top-3 left-3 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${club.isOpen ? "bg-emerald-500 shadow-[0_0_8px_#10b981]" : "bg-red-500"}`} />
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/90">
              {club.isOpen ? "Онлайн" : "Закрыто"}
            </span>
          </div>
        </div>

        {/* Content over image */}
        <div className="absolute bottom-4 left-4 right-4 focus-visible:outline-none">
          <h3 className="text-xl font-display font-bold text-white group-hover:text-primary transition-colors leading-tight mb-1">
            {club.name}
          </h3>
          <div className="flex items-center gap-1.5 text-white/70">
            <MapPin className="w-3.5 h-3.5 text-primary" />
            <p className="text-xs truncate">{club.address || "Адрес не указан"}</p>
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
              <Monitor className="w-4.5 h-4.5 text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Мест свободно</span>
              <span className="text-sm font-semibold">
                <span className={freePercent > 30 ? "text-emerald-400" : "text-amber-400"}>
                  {club.pcsFree}
                </span>
                <span className="text-white/40 font-normal ml-1"> / {club.pcsTotal} ПК</span>
              </span>
            </div>
          </div>

          <div className="text-right">
            <span className="block text-[10px] text-muted-foreground uppercase font-bold tracking-widest leading-none mb-1">Цена за час</span>
            <div className="flex items-baseline justify-end gap-1">
              <span className="text-xl font-display font-bold text-white">{club.pricePerHour}</span>
              <span className="text-xs text-white/40 font-medium">СУМ</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
