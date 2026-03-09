import { Home, Map, User, Gamepad2 } from "lucide-react";
import { NavLink } from "react-router-dom";

const tabs = [
  { to: "/", icon: Home, label: "Клубы" },
  { to: "/map", icon: Map, label: "Карта" },
  { to: "/booking", icon: Gamepad2, label: "Бронь" },
  { to: "/profile", icon: User, label: "Профиль" },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-4 md:bottom-6 left-4 right-4 md:left-8 md:right-8 z-50 rounded-2xl glass-dark border border-white/10 shadow-2xl safe-bottom overflow-hidden">
      <div className="flex items-center justify-around h-16 max-w-3xl mx-auto px-2">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.to === "/"}
            className={({ isActive }) =>
              `relative flex flex-col items-center justify-center w-16 h-14 transition-all duration-300 ${isActive ? "text-[#00E5FF]" : "text-white/45 hover:text-white/70"}`
            }
          >
            {({ isActive }) => (
              <>
                <tab.icon className={`w-5 h-5 transition-transform ${isActive ? "scale-110 drop-shadow-[0_0_10px_rgba(0,229,255,0.45)]" : ""}`} />
                <span className="mt-1 text-[10px] font-semibold tracking-wide">{tab.label}</span>
                {isActive && <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#00E5FF] shadow-[0_0_12px_#00E5FF]" />}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
