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

interface TopBarProps {
  onOpenSettings: () => void;
}

const TopBar = ({ onOpenSettings }: TopBarProps) => {
  const { user, logout, isAdmin } = useAuth();

  return (
    <header className="h-20 lg:h-24 px-4 lg:px-8 flex items-center justify-between shrink-0 z-20 relative">
      <div>
        <h2 className="text-2xl lg:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
          Панель управления
          <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] text-slate-400 font-mono tracking-normal">v2.4.0</span>
        </h2>
        <div className="hidden sm:flex items-center gap-2 mt-1.5">
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00FF94]" />
          <p className="text-sm text-slate-400 font-medium">Все системы работают в штатном режиме</p>
        </div>
      </div>

      <div className="flex items-center gap-3 lg:gap-6">
        {!isAdmin && (
          <div className="relative group hidden xl:block">
            <div className="relative flex items-center bg-[#0A0A0F]/80 border border-white/10 rounded-full px-5 py-3 w-72 focus-within:w-80 transition-all duration-300 backdrop-blur-md">
              <Search className="w-4 h-4 text-slate-500 mr-3" />
              <input
                type="text"
                placeholder="Поиск по системе..."
                className="bg-transparent border-none outline-none text-sm text-white placeholder-slate-600 w-full font-medium"
              />
              <kbd className="hidden 2xl:inline-flex h-5 px-1.5 text-[10px] font-mono text-slate-500 bg-white/5 border border-white/10 rounded items-center justify-center">
                Ctrl+K
              </kbd>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 lg:gap-4 pl-3 lg:pl-6 border-l border-white/10">
          <button className="relative w-10 h-10 lg:w-11 lg:h-11 rounded-full glass-card !bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:!bg-white/10 hover:border-white/20 transition-all group">
            <Bell className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-[#FF0055] rounded-full border border-[#0A0A0F] animate-pulse shadow-[0_0_8px_#FF0055]" />
          </button>

          <div className="hidden md:flex flex-col items-end">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Сервер AP-1</span>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00FF94] shadow-[0_0_5px_#00FF94]" />
              <span className="text-xs font-mono font-bold text-[#00FF94]">12ms</span>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 outline-none">
                <div className="h-9 w-9 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 p-[2px]">
                  <div className="h-full w-full rounded-full bg-slate-900 flex items-center justify-center text-xs font-bold text-white uppercase">
                    {user?.username?.slice(0, 2) ?? "TP"}
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
