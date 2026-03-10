import { Trophy, CalendarDays, Users, MapPin, Medal, Crown, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import cs2Banner from "@/assets/tournamentsgcs.jpg";
import dota2Banner from "@/assets/tournamentsgdota.jpg";
import pubgBanner from "@/assets/tournamentsgpubg.jpg";

const gameSections = [
  { id: "cs2", title: "CS2", subtitle: "–ейтинг команд", image: cs2Banner },
  { id: "dota2", title: "Dota2", subtitle: "–ейтинг команд", image: dota2Banner },
  { id: "pubg-mobile", title: "PUBG Mobile", subtitle: "–ейтинг команд", image: pubgBanner },
];

const tournaments = [
  {
    id: 1,
    title: "FRAG Night Cup",
    date: "15 марта 2026, 19:00",
    players: "5v5 Х 16 команд",
    location: "TeamPro Sergeli",
    prize: "20 000 000 сум",
  },
  {
    id: 2,
    title: "Cyber Weekend Showdown",
    date: "22 марта 2026, 18:30",
    players: "2v2 Х 24 команды",
    location: "Energy Gaming",
    prize: "12 000 000 сум",
  },
];

export default function TournamentsPage() {
  return (
    <div className="min-h-screen pb-28 px-5 pt-7">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-[#1A1B1F] border border-[#2F3136] flex items-center justify-center text-[#FF7800]">
          <Trophy className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-[32px] font-display leading-none">“урниры</h1>
          <p className="text-xs text-[#949BA4]">–ейтинг по играм и ближайшие событи€</p>
        </div>
      </div>

      <section className="mb-7">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-[26px] leading-none">–ейтинг по играм</h2>
          <span className="text-[11px] uppercase tracking-wider text-[#949BA4]">—езон 2026</span>
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
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-[26px] leading-none">“урниры</h2>
          <Crown className="w-4 h-4 text-[#FF7800]" />
        </div>

        <div className="space-y-4">
          {tournaments.map((item) => (
            <div key={item.id} className="rounded-2xl border border-[#2F3136] bg-[linear-gradient(180deg,#151515_0%,#101010_100%)] p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <h3 className="font-display text-[24px] leading-none text-white">{item.title}</h3>
                <span className="inline-flex items-center gap-1 rounded-full border border-[#3a2a12] bg-[#2a1b08] px-2 py-1 text-[10px] font-semibold text-[#FF9A2F] uppercase">
                  <Medal className="w-3 h-3" />
                  {item.prize}
                </span>
              </div>

              <div className="space-y-2 text-sm text-[#b5bac1]">
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-[#FF7800]" />
                  <span>{item.date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#FF7800]" />
                  <span>{item.players}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#FF7800]" />
                  <span>{item.location}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
