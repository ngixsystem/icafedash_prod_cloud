import { Home, Map, User, Gamepad2, Trophy } from "lucide-react";
import { NavLink } from "react-router-dom";

const tabs = [
  { to: "/", icon: Home, label: "Клубы" },
  { to: "/map", icon: Map, label: "Карта" },
  { to: "/tournaments", icon: Trophy, label: "Турниры", center: true },
  { to: "/booking", icon: Gamepad2, label: "Бронь" },
  { to: "/profile", icon: User, label: "Профиль" },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[420px] bg-[#121315]/95 backdrop-blur-lg border-t border-[#2F3136] px-2 pt-2 pb-6 safe-bottom z-50">
      <div className="grid grid-cols-5 items-end">
        {tabs.map((tab) => {
          const CenterIcon = tab.icon;
          if (tab.center) {
            return (
              <NavLink
                key={tab.to}
                to={tab.to}
                className={({ isActive }) => `flex flex-col items-center justify-end relative -mt-8 ${isActive ? "text-[#FF7800]" : "text-[#949BA4]"}`}
              >
                {({ isActive }) => (
                  <>
                    <div
                      className={`w-14 h-14 rounded-full border flex items-center justify-center transition-all ${
                        isActive
                          ? "bg-[#FF7800] text-black border-[#ffbf7f] shadow-[0_8px_22px_rgba(255,120,0,0.5)]"
                          : "bg-[#1A1B1F] text-[#FF7800] border-[#3A3A3A]"
                      }`}
                    >
                      <CenterIcon className="w-6 h-6" />
                    </div>
                    <span className={`mt-2 text-[10px] font-bold uppercase tracking-wider ${isActive ? "text-[#FF7800]" : "text-[#949BA4]"}`}>{tab.label}</span>
                  </>
                )}
              </NavLink>
            );
          }

          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.to === "/"}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-2 relative transition-colors ${
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
          );
        })}
      </div>
    </nav>
  );
}
