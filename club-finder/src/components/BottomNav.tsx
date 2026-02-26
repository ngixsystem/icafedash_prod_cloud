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
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-border safe-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.to === "/"}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-3 py-2 text-xs transition-colors ${
                isActive ? "text-primary neon-text" : "text-muted-foreground"
              }`
            }
          >
            <tab.icon className="w-5 h-5" />
            <span className="font-medium">{tab.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
