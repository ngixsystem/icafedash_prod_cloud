import { Search, Settings, LogOut } from "lucide-react";
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
    <header className="glass-panel border-b border-white/5 min-h-20 px-4 py-3 lg:px-8 flex items-center justify-between sticky top-0 z-10 gap-3">
      <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-white pl-10 lg:pl-0 tracking-wide truncate">
        {user?.club_name || "Dashboard"}
      </h1>

      <div className="flex items-center gap-3">
        {!isAdmin && (
          <>
            <div className="hidden sm:flex items-center gap-2 rounded-lg bg-slate-900/50 border border-white/10 px-3 py-2">
              <Search className="h-4 w-4 text-gray-500" />
              <input
                placeholder="Поиск..."
                className="bg-transparent text-sm text-white placeholder:text-gray-600 outline-none w-32 lg:w-48"
              />
            </div>

            <button
              onClick={onOpenSettings}
              className="rounded-lg bg-slate-900/50 border border-white/10 p-2 text-gray-400 hover:text-white transition-colors"
              title="Настройки"
            >
              <Settings className="h-4 w-4" />
            </button>
          </>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 outline-none">
              <div className="h-9 w-9 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 p-[2px]">
                <div className="h-full w-full rounded-full bg-slate-900 flex items-center justify-center text-xs font-bold text-white uppercase">
                  {user?.username.slice(0, 2)}
                </div>
              </div>
              <div className="hidden md:block text-left max-w-32 lg:max-w-44">
                <p className="text-sm font-medium text-white leading-none truncate">{user?.username}</p>
                <p className="text-[10px] text-gray-400 mt-1 capitalize">{user?.role}</p>
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
    </header>
  );
};

export default TopBar;
