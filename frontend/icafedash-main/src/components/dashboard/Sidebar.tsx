import {
  LayoutDashboard,
  Monitor,
  Wallet,
  BarChart3,
  Users,
  Menu,
  X,
  Shield,
  UserCheck,
  Settings,
  MessageSquare,
  CalendarClock,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/components/auth/AuthProvider";

const navItems = [
  { icon: LayoutDashboard, label: "Обзор" },
  { icon: Monitor, label: "Мониторинг" },
  { icon: CalendarClock, label: "Бронирование" },
  { icon: Wallet, label: "Финансы" },
  { icon: BarChart3, label: "Аналитика" },
  { icon: Users, label: "Участники" },
  { icon: MessageSquare, label: "Отзывы" },
  { icon: Settings, label: "Настройки" },
];

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

function playShortSignal() {
  if (typeof window === "undefined") return;
  const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextClass) return;
  try {
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.value = 0.04;

    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    osc.start(now);
    osc.stop(now + 0.12);
  } catch {
    // Ignore audio permission/device errors.
  }
}

const Sidebar = ({ activeTab, onTabChange }: SidebarProps) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isAdmin } = useAuth();
  const { data: cfg } = useQuery({ queryKey: ["config"], queryFn: api.getConfig });
  const prevPendingRef = useRef<number | null>(null);
  const { data: bookingData } = useQuery({
    queryKey: ["manager_bookings_badge"],
    queryFn: api.managerBookings,
    enabled: !isAdmin,
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
  });

  const clubName = cfg?.club_name || "iCafe";
  const clubLogo = cfg?.club_logo_url;
  const pendingBookingCount = bookingData?.summary?.pending_count ?? 0;

  useEffect(() => {
    if (isAdmin) return;
    const prev = prevPendingRef.current;
    if (prev !== null && pendingBookingCount > prev && typeof window !== "undefined" && "Notification" in window) {
      const newCount = pendingBookingCount - prev;
      playShortSignal();
      const notify = () =>
        new Notification("Новая бронь", {
          body: `Новых заявок: ${newCount}`,
        });

      if (Notification.permission === "granted") {
        notify();
      } else if (Notification.permission === "default") {
        Notification.requestPermission().then((permission) => {
          if (permission === "granted") notify();
        });
      }
    }
    prevPendingRef.current = pendingBookingCount;
  }, [isAdmin, pendingBookingCount]);

  const displayNavItems = isAdmin
    ? [
      { icon: Shield, label: "Клубы" },
      { icon: UserCheck, label: "Менеджеры" },
      { icon: Users, label: "Участники" },
      { icon: MessageSquare, label: "Отзывы" },
    ]
    : [...navItems];

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 lg:hidden rounded-lg bg-card p-2 text-muted-foreground"
      >
        <Menu className="h-5 w-5" />
      </button>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

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
          {clubLogo && (
            <span className="text-lg font-bold text-foreground truncate">{clubName}</span>
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
              <span>{item.label}</span>
              {!isAdmin && item.icon === CalendarClock && pendingBookingCount > 0 ? (
                <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[11px] font-bold text-white">
                  {pendingBookingCount > 99 ? "99+" : pendingBookingCount}
                </span>
              ) : null}
            </button>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
