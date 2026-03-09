import { Home, Map, User, Gamepad2 } from "lucide-react";
import { NavLink } from "react-router-dom";
import fragLogo from "@/assets/frag.png";

const tabs = [
  { to: "/", icon: Home, label: "Клубы" },
  { to: "/map", icon: Map, label: "Карта" },
  { to: "/tournaments", label: "Турниры", center: true },
  { to: "/booking", icon: Gamepad2, label: "Бронь" },
  { to: "/profile", icon: User, label: "Профиль" },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[420px] bg-[#121315]/95 backdrop-blur-lg border-t border-[#2F3136] px-2 pt-2 pb-6 safe-bottom z-50">
      <div className="grid grid-cols-5 items-end">
        {tabs.map((tab) => {
          if (tab.center) {
            return (
              <NavLink
                key={tab.to}
                to={tab.to}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-end relative -mt-8 ${isActive ? "text-[#FF7800]" : "text-[#949BA4]"}`
                }
              >
                {({ isActive }) => (
                  <>
                    <img
                      src={fragLogo}
                      alt="FRAG.GG"
                      className={`object-contain transition-all ${isActive ? "w-11 h-11 animate-center-logo" : "w-9 h-9 opacity-80"}`}
                    />
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
                  <div className={`p-1.5 rounded-lg ${isActive ? "bg-[#FF7800]/10" : ""}`}>
                    <tab.icon className="w-[22px] h-[22px]" />
                  </div>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
