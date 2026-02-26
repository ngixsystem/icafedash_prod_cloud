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
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.to === "/"}
            className={({ isActive }) =>
              `relative flex items-center justify-center w-14 h-14 transition-all duration-300 ${isActive ? "text-primary scale-110" : "text-white/40 hover:text-white/60"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <tab.icon className={`w-6 h-6 transition-transform ${isActive ? "drop-shadow-[0_0_12px_rgba(var(--primary),0.5)]" : ""}`} />
                {isActive && (
                  <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_12px_hsl(var(--primary))]" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
