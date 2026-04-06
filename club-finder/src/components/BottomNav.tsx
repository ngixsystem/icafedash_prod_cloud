import { Home, Map, User, Trophy, BarChart2 } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const RATING_GAMES = ["/tournaments/cs2", "/tournaments/dota2", "/tournaments/pubg-mobile"];

const tabs = [
  { to: "/",          icon: Home,     match: (p: string) => p === "/" },
  { to: "/map",       icon: Map,      match: (p: string) => p.startsWith("/map") },
  { to: "/tournaments", icon: Trophy, match: (p: string) => p.startsWith("/tournaments") && !RATING_GAMES.includes(p) },
  { to: "/ratings",   icon: BarChart2, match: (p: string) => p.startsWith("/ratings") || RATING_GAMES.includes(p) },
  { to: "/profile",   icon: User,     match: (p: string) => p.startsWith("/profile") },
];

export default function BottomNav() {
  const { pathname } = useLocation();
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[420px] h-[60px] bg-[#0b0d12] border-t border-[#2F3136] z-[1001]">
      <div className="h-full flex items-center justify-around">
        {tabs.map(({ to, icon: Icon, match }) => (
          <Link
            key={to}
            to={to}
            className={`w-11 h-11 flex items-center justify-center transition-colors ${match(pathname) ? "text-[#FF7800]" : "text-[#a5adba] hover:text-white"}`}
          >
            <Icon className="w-[21px] h-[21px]" />
          </Link>
        ))}
      </div>
    </nav>
  );
}
