import { Monitor, Star, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import type { ClubData } from "@/hooks/use-clubs";
import { formatDistance } from "@/lib/distance";

interface ClubCardProps {
  club: ClubData;
  distanceKm?: number | null;
  isNearest?: boolean;
}

export default function ClubCard({ club, distanceKm, isNearest = false }: ClubCardProps) {
  const image = (club as any).main_photo_url || (club as any).logo || (club as any).image;

  return (
    <Link to={`/club/${club.id}`} className="bg-[#1E1F22] border border-[#2F3136] rounded-2xl overflow-hidden flex flex-col shadow-lg transition-transform duration-300 hover:scale-[1.01]">
      <div className="relative h-44 bg-[#111214] group overflow-hidden">
        <img
          src={image}
          alt={club.name}
          className={`w-full h-full object-cover transition-all duration-500 ${club.isOpen ? "opacity-70 group-hover:scale-105" : "opacity-45 grayscale group-hover:opacity-60"}`}
        />

        {club.isOpen ? <div className="absolute inset-0 bg-gradient-to-t from-[#1E1F22] via-transparent to-transparent opacity-80" /> : null}

        <div className="absolute top-3 left-3 bg-[#121315]/90 backdrop-blur-md border border-[#2F3136] rounded-full px-2.5 py-1.5 flex items-center gap-2 shadow-sm">
          <div className={`w-2 h-2 rounded-full ${club.isOpen ? "bg-[#57F287]" : "bg-[#ED4245] animate-pulse"}`} />
          <span className="text-[10px] font-bold text-white uppercase tracking-wider leading-none pt-0.5">{club.isOpen ? "Открыто" : "Закрыто"}</span>
        </div>

        <div className="absolute top-3 right-3 bg-[#121315]/90 backdrop-blur-md border border-[#2F3136] rounded-full px-2.5 py-1.5 flex items-center gap-1.5 shadow-sm">
          <Star className="w-3 h-3 text-[#FEE75C] fill-[#FEE75C]" />
          <span className="text-[11px] font-bold text-white leading-none pt-0.5">{club.rating}</span>
        </div>

        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="font-display text-[32px] leading-none font-bold text-white uppercase tracking-wide drop-shadow-md">{club.name}</h3>
        </div>
      </div>

      <div className="p-5 pt-4">
        <div className="flex items-start gap-2 mb-5 text-[#949BA4]">
          <MapPin className="w-[14px] h-[14px] text-[#F5A623] mt-0.5 shrink-0" />
          <span className="text-xs font-medium line-clamp-2 leading-relaxed">{club.address || "Адрес не указан"}</span>
        </div>

        <div className="h-[1px] bg-[#2F3136] w-full mb-4 relative">
          <div className="absolute left-0 -top-[1.5px] w-8 h-[4px] bg-[#F5A623] rounded-full" />
        </div>

        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-[#121315] rounded-xl flex items-center justify-center border border-[#2F3136]">
              <Monitor className="w-5 h-5 text-[#F5A623]" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-[#949BA4] font-bold uppercase tracking-widest mb-0.5">Свободно</span>
              <div className="font-display text-xl font-bold leading-none tracking-wide">
                <span className={club.pcsFree > 0 ? "text-[#57F287]" : "text-[#F5A623]"}>{club.pcsFree}</span>
                <span className="text-[#949BA4] text-lg"> / {club.pcsTotal} ПК</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end">
            <span className="text-[10px] text-[#949BA4] font-bold uppercase tracking-widest mb-0.5">{isNearest ? "Ближайший" : "Расстояние"}</span>
            <span className="font-display text-xl font-bold leading-none">{distanceKm != null ? formatDistance(distanceKm) : "-"}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
