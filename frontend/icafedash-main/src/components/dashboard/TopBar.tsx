import { Bell, LogOut, Search, Settings } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
const brandLogo = "/logo.png";

interface TopBarProps {
  onOpenSettings: () => void;
  searchQuery?: string;
  onSearchChange?: (value: string) => void;
  searchEnabled?: boolean;
}

const TopBar = ({ onOpenSettings, searchQuery = "", onSearchChange, searchEnabled = false }: TopBarProps) => {
  const { user, logout, isAdmin } = useAuth();

  return (
    <header className="h-20 lg:h-24 px-4 lg:px-8 flex items-center justify-between shrink-0 z-20 relative">
      <div className="pl-12 lg:pl-0">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl border border-white/70 bg-white/70 p-1.5 hidden sm:block shadow-[0_12px_24px_rgba(80,111,150,0.13)] backdrop-blur-xl">
            <img src={brandLogo} alt="Cloud Finder" className="h-full w-full object-contain" />
          </div>
          <h2 className="font-display text-2xl lg:text-3xl text-slate-950 tracking-tight">Cloud Finder Command</h2>
        </div>
        <div className="hidden sm:flex items-center gap-2 mt-1.5">
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#58d68d]" />
          <p className="text-sm text-slate-400 font-medium">Все сервисы работают стабильно</p>
        </div>
      </div>

      <div className="flex items-center gap-3 lg:gap-6">
        {!isAdmin && (
          <div className="relative group hidden xl:block">
            <div className="relative flex items-center bg-white/65 border border-white/70 rounded-full px-5 py-3 w-72 focus-within:w-80 transition-all duration-300 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_12px_28px_rgba(80,111,150,0.12)]">
              <Search className="w-4 h-4 text-slate-500 mr-3" />
              <input
                type="text"
                placeholder="Поиск заявок..."
                className="bg-transparent border-none outline-none text-sm text-slate-800 placeholder-slate-400 w-full font-medium disabled:opacity-40"
                value={searchQuery}
                onChange={(e) => onSearchChange?.(e.target.value)}
                disabled={!searchEnabled}
              />
              <kbd className="hidden 2xl:inline-flex h-5 px-1.5 text-[10px] font-mono text-slate-500 bg-white/5 border border-white/10 rounded items-center justify-center">
                Ctrl+K
              </kbd>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 lg:gap-4 pl-3 lg:pl-6 border-l border-slate-200/70">
          <button className="relative w-10 h-10 lg:w-11 lg:h-11 rounded-full glass-card flex items-center justify-center text-slate-500 hover:text-blue-600 transition-all group">
            <Bell className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border border-white animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.55)]" />
          </button>

          <div className="hidden md:flex flex-col items-end">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Region EU-1</span>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#58d68d] shadow-[0_0_5px_#58d68d]" />
              <span className="text-xs font-mono font-bold text-[#58d68d]">12ms</span>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 outline-none">
                <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-cyan-300 via-blue-500 to-indigo-500 p-[2px] shadow-[0_0_26px_rgba(56,189,248,0.28)]">
                  <div className="h-full w-full rounded-full border border-white/10 bg-[#0b1220]/90 flex items-center justify-center text-xs font-black text-white uppercase backdrop-blur-xl">
                    {user?.username?.slice(0, 2) ?? "CF"}
                  </div>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-slate-950 border-white/10 text-gray-200">
              <DropdownMenuLabel>Мой аккаунт</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onOpenSettings}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Настройки</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Выйти</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
