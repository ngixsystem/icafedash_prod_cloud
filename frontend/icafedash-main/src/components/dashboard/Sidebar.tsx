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
  QrCode,
  Zap,
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
  { icon: QrCode, label: "Кешбек" },
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
        className="fixed top-4 left-4 z-50 lg:hidden rounded-lg glass-panel p-2 text-muted-foreground"
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
        className={`fixed top-0 left-0 z-50 h-full w-[85vw] max-w-xs glass-panel border-r border-white/5 flex flex-col transition-transform duration-300 lg:w-64 lg:max-w-none lg:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        <div className="h-20 flex items-center gap-3 px-6 border-b border-white/5">
          {clubLogo ? (
            <img src={clubLogo} alt="Logo" className="h-10 w-10 rounded-lg object-contain" />
          ) : (
            <img src="/logo.png" alt="iCafeDash" className="h-10 object-contain drop-shadow-[0_0_10px_rgba(45,212,191,0.5)]" />
          )}
          <span className="text-base font-semibold text-white truncate">{clubName}</span>
          <button
            onClick={() => setMobileOpen(false)}
            className="ml-auto lg:hidden text-gray-400"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
          {displayNavItems.map((item) => (
            <button
              key={item.label}
              onClick={() => {
                onTabChange(item.label);
                setMobileOpen(false);
              }}
              className={`group relative flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all ${activeTab === item.label
                ? "bg-gradient-to-r from-primary/15 to-transparent text-primary border-l-2 border-primary"
                : "text-gray-400 hover:text-white hover:bg-white/5 border-l-2 border-transparent"
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

        {!isAdmin && (
          <div className="p-6 border-t border-white/5">
            <div className="glass-panel p-4 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <span className="w-2 h-2 absolute top-0 right-0 bg-emerald-400 rounded-full animate-pulse" />
                  <div className="w-8 h-8 rounded-full bg-slate-700/70 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-primary" />
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-400">System</p>
                  <p className="text-sm font-semibold text-emerald-400">Online</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};

export default Sidebar;
