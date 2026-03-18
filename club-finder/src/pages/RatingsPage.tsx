import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import cs2Banner from "@/assets/tournamentsgcs.jpg";
import dota2Banner from "@/assets/tournamentsgdota.jpg";
import pubgBanner from "@/assets/tournamentsgpubg.jpg";

const gameSections = [
  { id: "cs2", title: "CS2", subtitle: "Рейтинг команд", image: cs2Banner },
  { id: "dota2", title: "Dota2", subtitle: "Рейтинг команд", image: dota2Banner },
  { id: "pubg-mobile", title: "PUBG Mobile", subtitle: "Рейтинг команд", image: pubgBanner },
];

export default function RatingsPage() {
  return (
    <div className="min-h-screen pb-28 px-5 pt-7">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display text-[26px] leading-none">Рейтинг по играм</h2>
        <span className="text-[11px] uppercase tracking-wider text-[#949BA4]">Сезон 2026</span>
      </div>

      <div className="space-y-3">
        {gameSections.map((game) => (
          <Link
            key={game.id}
            to={`/tournaments/${game.id}`}
            className="group relative block h-[106px] overflow-hidden rounded-2xl border border-[#2F3136]"
          >
            <img
              src={game.image}
              alt={game.title}
              className="absolute inset-0 h-full w-full object-cover grayscale transition-all duration-300 group-hover:grayscale-0 group-focus-visible:grayscale-0 group-active:grayscale-0"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/55 to-black/20" />
            <div className="relative flex h-full items-center justify-between px-4">
              <div>
                <h3 className="font-display text-[28px] leading-none text-white">{game.title}</h3>
                <p className="text-[11px] uppercase tracking-wide text-[#C4CAD2]">{game.subtitle}</p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/25 bg-black/35 text-white">
                <ChevronRight className="h-4 w-4" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
