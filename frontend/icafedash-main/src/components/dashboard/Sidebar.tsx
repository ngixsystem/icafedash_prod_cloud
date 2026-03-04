import {
  BarChart3,
  CalendarClock,
  ChevronRight,
  Gamepad2,
  LayoutGrid,
  Menu,
  MessageSquare,
  MonitorPlay,
  QrCode,
  Settings,
  Shield,
  UserCheck,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/components/auth/AuthProvider";

const navItems = [
  { icon: LayoutGrid, label: "Обзор", section: "main", color: "text-[#00F0FF]" },
  { icon: MonitorPlay, label: "Мониторинг", section: "main", color: "text-[#BD00FF]" },
  { icon: CalendarClock, label: "Бронирование", section: "main", color: "text-[#2B59F9]" },
  { icon: Wallet, label: "Финансы", section: "ops", color: "text-[#00FF94]" },
  { icon: BarChart3, label: "Аналитика", section: "ops", color: "text-[#FF0055]" },
  { icon: Users, label: "Участники", section: "ops", color: "text-[#BD00FF]" },
  { icon: MessageSquare, label: "Отзывы", section: "ops", color: "text-[#00F0FF]" },
  { icon: QrCode, label: "Кешбек", section: "ops", color: "text-[#2B59F9]" },
  { icon: Settings, label: "Настройки", section: "other", color: "text-slate-200" },
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
    // ignore
  }
}

const Sidebar = ({ activeTab, onTabChange }: SidebarProps) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isAdmin, user } = useAuth();
  const { data: cfg } = useQuery({ queryKey: ["config"], queryFn: api.getConfig });
  const prevPendingRef = useRef<number | null>(null);
  const { data: bookingData } = useQuery({
    queryKey: ["manager_bookings_badge"],
    queryFn: api.managerBookings,
    enabled: !isAdmin,
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
  });

  const clubName = cfg?.club_name || "TeamPro";
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
        { icon: Shield, label: "Клубы", section: "main", color: "text-[#00F0FF]" },
        { icon: UserCheck, label: "Менеджеры", section: "main", color: "text-[#BD00FF]" },
        { icon: Users, label: "Участники", section: "ops", color: "text-[#00FF94]" },
        { icon: MessageSquare, label: "Отзывы", section: "ops", color: "text-[#2B59F9]" },
      ]
    : navItems;

  const mainItems = displayNavItems.filter((x) => x.section === "main");
  const opsItems = displayNavItems.filter((x) => x.section === "ops");
  const otherItems = displayNavItems.filter((x) => x.section === "other");

  const renderNavItem = (item: (typeof displayNavItems)[number]) => (
    <button
      key={item.label}
      onClick={() => {
        onTabChange(item.label);
        setMobileOpen(false);
      }}
      className={`nav-item flex w-full items-center gap-4 px-5 py-3.5 rounded-xl transition-all group ${
        activeTab === item.label ? "active text-[#00F0FF]" : "text-slate-400 hover:bg-white/5"
      }`}
    >
      <item.icon className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${activeTab === item.label ? "text-[#00F0FF]" : item.color}`} />
      <span className="font-medium group-hover:text-white transition-colors">{item.label}</span>
      {!isAdmin && item.label === "Бронирование" && pendingBookingCount > 0 ? (
        <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[11px] font-bold text-white">
          {pendingBookingCount > 99 ? "99+" : pendingBookingCount}
        </span>
      ) : null}
      {activeTab === item.label ? <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#00F0FF] shadow-[0_0_8px_currentColor]" /> : null}
    </button>
  );

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-[60] lg:hidden rounded-xl bg-white/5 border border-white/10 p-2 text-slate-200"
      >
        <Menu className="h-5 w-5" />
      </button>

      {mobileOpen && <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)} />}

      <aside
        className={`fixed top-0 left-0 z-50 h-full w-[85vw] max-w-[280px] lg:w-[280px] glass-panel flex flex-col transition-transform duration-300 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="h-24 flex items-center px-8 relative overflow-hidden group cursor-pointer">
          <div className="absolute inset-0 bg-gradient-to-r from-[#00F0FF]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="flex items-center gap-4 relative z-10 min-w-0">
            <div className="relative w-11 h-11 flex items-center justify-center shrink-0">
              <div className="absolute inset-0 bg-gradient-to-tr from-[#00F0FF] to-[#2B59F9] rounded-xl blur opacity-50 group-hover:opacity-80 transition-opacity duration-500 animate-pulse-glow" />
              <div className="relative w-full h-full bg-[#0A0A0F] rounded-xl border border-white/10 flex items-center justify-center shadow-2xl group-hover:border-[#00F0FF]/50 transition-colors">
                <Gamepad2 className="w-6 h-6 text-white group-hover:text-[#00F0FF] transition-colors" />
              </div>
            </div>
            <div className="min-w-0">
              <h1 className="font-bold text-2xl text-white tracking-tight leading-none truncate">{clubName}</h1>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00F0FF] animate-pulse" />
                <span className="text-[10px] font-mono font-bold text-[#00F0FF] tracking-[0.2em] uppercase">Sergeli</span>
              </div>
            </div>
          </div>
          <button onClick={() => setMobileOpen(false)} className="absolute right-4 top-1/2 -translate-y-1/2 lg:hidden text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-8 px-3 space-y-1.5">
          <div className="px-5 mb-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Main Menu</div>
          {mainItems.map(renderNavItem)}

          {opsItems.length > 0 && (
            <>
              <div className="px-5 mt-8 mb-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Operations</div>
              {opsItems.map(renderNavItem)}
            </>
          )}

          {otherItems.length > 0 && <div className="pt-6 mt-auto">{otherItems.map(renderNavItem)}</div>}
        </nav>

        <div className="p-4 border-t border-white/5 bg-black/20 backdrop-blur-md">
          <button className="w-full glass-card !bg-white/5 hover:!bg-white/10 rounded-xl p-3 flex items-center gap-3 transition-colors group">
            <div className="relative shrink-0">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#00F0FF] to-[#BD00FF] p-[2px]">
                <div className="w-full h-full rounded-full bg-[#0A0A0F] flex items-center justify-center text-xs font-bold uppercase text-white">
                  {user?.username?.slice(0, 2) ?? "TP"}
                </div>
              </div>
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#00FF94] border-2 border-[#0A0A0F] rounded-full">
                <div className="status-ping bg-[#00FF94]" />
              </div>
            </div>
            <div className="text-left overflow-hidden">
              <p className="text-sm font-bold text-white truncate group-hover:text-[#00F0FF] transition-colors">{user?.username ?? "TeamPro Admin"}</p>
              <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wide">{user?.role ?? "manager"}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-600 ml-auto group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
