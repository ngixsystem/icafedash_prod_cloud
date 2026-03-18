import { Home, Map, User, BarChart3, Trophy } from "lucide-react";
import { NavLink } from "react-router-dom";

const tabs = [
  { to: "/", icon: Home, end: true },
  { to: "/map", icon: Map },
  { to: "/tournaments", icon: Trophy },
  { to: "/ratings", icon: BarChart3 },
  { to: "/profile", icon: User },
];

function IconTab({ to, icon: Icon, end = false }: { to: string; icon: any; end?: boolean }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `w-11 h-11 flex items-center justify-center transition-colors ${isActive ? "text-[#FF7800]" : "text-[#a5adba] hover:text-white"}`
      }
    >
      <Icon className="w-[21px] h-[21px]" />
    </NavLink>
  );
}

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[420px] h-[60px] bg-[#0b0d12] border-t border-[#2F3136] z-[1001]">
      <div className="h-full flex items-center justify-around">
        {tabs.map((tab) => (
          <IconTab key={tab.to} to={tab.to} icon={tab.icon} end={!!tab.end} />
        ))}
      </div>
    </nav>
  );
}
