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
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[420px] bg-[#121315]/95 backdrop-blur-lg border-t border-[#2F3136] flex justify-between px-2 pt-2 pb-6 safe-bottom z-50">
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.to === "/"}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center justify-center py-2 relative transition-colors ${
              isActive ? "text-[#FF7800]" : "text-[#949BA4] hover:text-white"
            }`
          }
        >
          {({ isActive }) => (
            <>
              {isActive ? <div className="absolute top-0 w-12 h-[3px] bg-[#FF7800] rounded-b-full -mt-[9px]" /> : null}
              <div className={`mb-1.5 p-1.5 rounded-lg ${isActive ? "bg-[#FF7800]/10" : ""}`}>
                <tab.icon className="w-[22px] h-[22px]" />
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${isActive ? "text-[#FF7800]" : "text-[#949BA4]"}`}>{tab.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
