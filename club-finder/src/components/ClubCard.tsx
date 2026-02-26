import { Monitor, Star } from "lucide-react";
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
      className="block rounded-lg overflow-hidden glass animate-slide-up transition-transform hover:scale-[1.02] active:scale-[0.98]"
    >
      <div className="relative h-36">
        <img src={(club as any).logo || club.image} alt={club.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
          <div>
            <h3 className="text-lg font-display font-bold">{club.name}</h3>
            <p className="text-xs text-muted-foreground">{club.address}</p>
          </div>
          <div className="flex items-center gap-1 text-warning text-sm font-semibold">
            <Star className="w-3.5 h-3.5 fill-current" />
            {club.rating}
          </div>
        </div>
      </div>

      <div className="p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Monitor className="w-4 h-4 text-primary" />
          <span className="text-sm">
            <span className={freePercent > 30 ? "text-success font-semibold" : "text-destructive font-semibold"}>
              {club.pcsFree}
            </span>
            <span className="text-muted-foreground"> / {club.pcsTotal} свободно</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className={`inline-block w-2 h-2 rounded-full ${club.isOpen ? "bg-success animate-pulse-neon" : "bg-destructive"}`} />
          <span className="text-xs text-muted-foreground">{club.isOpen ? "Открыто" : "Закрыто"}</span>
        </div>
      </div>

      <div className="px-3 pb-3">
        <span className="text-primary font-display font-bold text-lg">от {club.pricePerHour} ₽</span>
        <span className="text-muted-foreground text-xs"> / час</span>
      </div>
    </Link>
  );
}
