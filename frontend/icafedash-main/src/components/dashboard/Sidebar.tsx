import { LayoutDashboard, Monitor, Wallet, BarChart3, Users, Menu, X, Shield, UserCheck } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/components/auth/AuthProvider";

const navItems = [
  { icon: LayoutDashboard, label: "Обзор" },
  { icon: Monitor, label: "Мониторинг" },
  { icon: Wallet, label: "Финансы" },
  { icon: BarChart3, label: "Аналитика" },
  { icon: Users, label: "Участники" },
];

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Sidebar = ({ activeTab, onTabChange }: SidebarProps) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isAdmin } = useAuth();
  const { data: cfg } = useQuery({ queryKey: ["config"], queryFn: api.getConfig });

  const clubName = cfg?.club_name || "iCafe";
  const clubLogo = cfg?.club_logo_url;

  const displayNavItems = isAdmin
    ? [{ icon: Shield, label: "Клубы" }, { icon: UserCheck, label: "Клиенты" }]
    : [...navItems];

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 lg:hidden rounded-lg bg-card p-2 text-muted-foreground"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-60 border-r border-border bg-sidebar flex flex-col transition-transform duration-300 lg:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        <div className="flex items-center gap-3 px-6 py-6 border-b border-border/50 mb-2">
          {clubLogo ? (
            <img src={clubLogo} alt="Logo" className="h-8 w-8 rounded-lg object-contain" />
          ) : (
            <img src="/logo.png" alt="iCafeDash" className="h-8 object-contain drop-shadow-[0_0_10px_rgba(45,212,191,0.5)]" />
          )}
          {(!clubLogo && isAdmin) ? null : (
            <span className="text-lg font-bold text-foreground truncate">{clubLogo ? clubName : "iCafeDash"}</span>
          )}
          <button
            onClick={() => setMobileOpen(false)}
            className="ml-auto lg:hidden text-muted-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {displayNavItems.map((item) => (
            <button
              key={item.label}
              onClick={() => {
                onTabChange(item.label);
                setMobileOpen(false);
              }}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${activeTab === item.label
                ? "bg-primary/20 text-primary"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </button>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
