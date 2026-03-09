import { Home, Map, User, Gamepad2 } from "lucide-react";
import { NavLink } from "react-router-dom";
import fragLogo from "@/assets/frag.png";

const leftTabs = [
  { to: "/", icon: Home },
  { to: "/map", icon: Map },
];

const rightTabs = [
  { to: "/booking", icon: Gamepad2 },
  { to: "/profile", icon: User },
];

function IconTab({ to, icon: Icon, end = false }: { to: string; icon: any; end?: boolean }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `w-12 h-12 flex items-center justify-center transition-colors ${isActive ? "text-[#FF7800]" : "text-[#a5adba] hover:text-white"}`
      }
    >
      <Icon className="w-5 h-5" />
    </NavLink>
  );
}

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[420px] h-[78px] bg-[#0b0d12] border-t border-[#2F3136] px-8 z-50">
      <div className="h-full flex items-center justify-between">
        <div className="flex items-center gap-5">
          {leftTabs.map((tab) => (
            <IconTab key={tab.to} to={tab.to} icon={tab.icon} end={tab.to === "/"} />
          ))}
        </div>

        <NavLink to="/tournaments" className="absolute left-1/2 -translate-x-1/2 -top-5">
          {({ isActive }) => (
            <img
              src={fragLogo}
              alt="FRAG.GG"
              className={`w-16 h-16 object-contain transition-all ${
                isActive
                  ? "drop-shadow-[0_0_14px_rgba(255,120,0,0.6)] scale-105"
                  : "drop-shadow-[0_0_8px_rgba(0,0,0,0.55)]"
              }`}
            />
          )}
        </NavLink>

        <div className="flex items-center gap-5">
          {rightTabs.map((tab) => (
            <IconTab key={tab.to} to={tab.to} icon={tab.icon} />
          ))}
        </div>
      </div>
    </nav>
  );
}
