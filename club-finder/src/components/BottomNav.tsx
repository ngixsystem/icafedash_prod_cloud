import { Home, Map, User, Gamepad2 } from "lucide-react";
import { NavLink } from "react-router-dom";

const tabs = [
  { to: "/", icon: Home, label: "Clubs" },
  { to: "/map", icon: Map, label: "Map" },
  { to: "/booking", icon: Gamepad2, label: "Booking" },
  { to: "/profile", icon: User, label: "Profile" },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-6 left-6 right-6 z-50 rounded-2xl glass-dark border border-white/10 shadow-2xl safe-bottom overflow-hidden">
      <div className="flex items-center justify-around h-20 max-w-lg mx-auto px-2">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.to === "/"}
            className={({ isActive }) =>
              `relative flex flex-col items-center gap-1.5 px-4 py-2 transition-all duration-300 ${isActive ? "text-primary scale-110" : "text-white/40 hover:text-white/60"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <tab.icon className={`w-5 h-5 transition-transform ${isActive ? "drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]" : ""}`} />
                <span className={`text-[10px] font-bold uppercase tracking-wider ${isActive ? "opacity-100" : "opacity-0 scale-75"} transition-all`}>
                  {tab.label}
                </span>
                {isActive && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary shadow-[0_0_10px_#22c55e]" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
