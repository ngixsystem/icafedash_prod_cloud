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
    <header className="flex items-center justify-between px-4 py-4 lg:px-6">
      <h1 className="text-xl font-bold text-foreground pl-10 lg:pl-0">
        {user?.club_name || "Дашборд"}
      </h1>

      <div className="flex items-center gap-3">
        {!isAdmin && (
          <>
            <div className="hidden sm:flex items-center gap-2 rounded-lg bg-card border border-border px-3 py-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                placeholder="Поиск..."
                className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-32 lg:w-48"
              />
            </div>

            <button
              onClick={onOpenSettings}
              className="rounded-lg bg-card border border-border p-2 text-muted-foreground hover:text-foreground transition-colors"
              title="Настройки"
            >
              <Settings className="h-4 w-4" />
            </button>
          </>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 outline-none">
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground uppercase">
                {user?.username.slice(0, 2)}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-foreground leading-none">{user?.username}</p>
                <p className="text-[10px] text-muted-foreground mt-1 capitalize">{user?.role}</p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-card border-border">
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
