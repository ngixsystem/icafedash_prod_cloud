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
        `w-11 h-11 flex items-center justify-center transition-colors ${isActive ? "text-[#FF7800]" : "text-[#a5adba] hover:text-white"}`
      }
    >
      <Icon className="w-[21px] h-[21px]" />
    </NavLink>
  );
}

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[420px] h-[60px] bg-[#0b0d12] border-t border-[#2F3136] px-8 z-50">
      <div className="h-full flex items-center justify-between">
        <div className="flex items-center gap-5">
          {leftTabs.map((tab) => (
            <IconTab key={tab.to} to={tab.to} icon={tab.icon} end={tab.to === "/"} />
          ))}
        </div>

        <NavLink to="/tournaments" className="absolute left-1/2 -translate-x-1/2 -top-[22px]">
          {({ isActive }) => (
            <div
              className={`w-[86px] h-[86px] rounded-full bg-white flex items-center justify-center transition-all ${
                isActive ? "scale-[1.02] shadow-[0_8px_22px_rgba(0,0,0,0.45)]" : "shadow-[0_6px_16px_rgba(0,0,0,0.35)]"
              }`}
            >
              <img
                src={fragLogo}
                alt="FRAG.GG"
                className={`w-[66px] h-[66px] object-contain transition-all ${
                  isActive ? "drop-shadow-[0_0_12px_rgba(255,120,0,0.55)]" : "drop-shadow-[0_0_6px_rgba(0,0,0,0.35)]"
                }`}
              />
            </div>
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
