import {
  BarChart3,
  CalendarClock,
  ChevronRight,
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
  Trophy,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/components/auth/AuthProvider";
import brandLogo from "@/assets/frag.png";

const navItems = [
  { icon: LayoutGrid, label: "Обзор", section: "main", color: "text-[#00E5FF]" },
  { icon: MonitorPlay, label: "Мониторинг", section: "main", color: "text-[#6C5CE7]" },
  { icon: CalendarClock, label: "Бронирование", section: "main", color: "text-[#00E5FF]" },
  { icon: Trophy, label: "Турниры", section: "main", color: "text-[#FF9A2F]" },
  { icon: Wallet, label: "Финансы", section: "ops", color: "text-[#58d68d]" },
  { icon: BarChart3, label: "Аналитика", section: "ops", color: "text-[#ff7f9f]" },
  { icon: Users, label: "Участники", section: "ops", color: "text-[#6C5CE7]" },
  { icon: MessageSquare, label: "Отзывы", section: "ops", color: "text-[#00E5FF]" },
  { icon: QrCode, label: "Кешбек", section: "ops", color: "text-[#6C5CE7]" },
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
  const { isAdmin, isCaptain, user } = useAuth();
  const role = user?.role || "";
  const canUseManagerBookings = role === "manager";
  const { data: cfg } = useQuery({ queryKey: ["config"], queryFn: api.getConfig });
  const prevPendingRef = useRef<number | null>(null);
  const { data: bookingData } = useQuery({
    queryKey: ["manager_bookings_badge"],
    queryFn: api.managerBookings,
    enabled: canUseManagerBookings,
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
  });

  const clubName = cfg?.club_name || "Cloud Finder";
  const pendingBookingCount = bookingData?.summary?.pending_count ?? 0;

  useEffect(() => {
    if (!canUseManagerBookings || isAdmin) return;
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
  }, [canUseManagerBookings, isAdmin, pendingBookingCount]);

  const displayNavItems = isAdmin
    ? [
        { icon: Shield, label: "Клубы", section: "main", color: "text-[#00E5FF]" },
        { icon: UserCheck, label: "Менеджеры", section: "main", color: "text-[#6C5CE7]" },
        { icon: Trophy, label: "Турниры", section: "main", color: "text-[#FF9A2F]" },
        { icon: Users, label: "Пользователи", section: "ops", color: "text-[#58d68d]" },
        { icon: MessageSquare, label: "Отзывы", section: "ops", color: "text-[#00E5FF]" },
      ]
    : isCaptain
      ? [
          { icon: Trophy, label: "Турниры", section: "main", color: "text-[#FF9A2F]" },
          { icon: Users, label: "Команда", section: "main", color: "text-[#6C5CE7]" },
        ]
      : role === "member" || role === "client"
        ? [{ icon: Trophy, label: "Турниры", section: "main", color: "text-[#FF9A2F]" }]
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
      className={`nav-item flex w-full items-center gap-4 px-4 py-3 rounded-xl border border-transparent transition-all group ${
        activeTab === item.label
          ? "active text-[#00E5FF] border-[#00E5FF]/20 bg-[#00E5FF]/5 shadow-[0_0_20px_rgba(0,229,255,0.1)]"
          : "text-slate-300 hover:bg-white/5 hover:border-white/10"
      }`}
    >
      <item.icon
        className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${
          activeTab === item.label ? "text-[#00E5FF]" : item.color
        }`}
      />
      <span className="font-medium group-hover:text-white transition-colors">{item.label}</span>
      {!isAdmin && item.label === "Бронирование" && pendingBookingCount > 0 ? (
        <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[11px] font-bold text-white">
          {pendingBookingCount > 99 ? "99+" : pendingBookingCount}
        </span>
      ) : null}
      {activeTab === item.label ? <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#00E5FF] shadow-[0_0_10px_#00E5FF]" /> : null}
    </button>
  );

  return (
    <>
      {!mobileOpen && (
        <button
          onClick={() => setMobileOpen(true)}
          className="fixed top-3 left-3 z-[60] lg:hidden rounded-xl bg-[#0e1427]/90 border border-white/10 p-2 text-slate-200"
        >
          <Menu className="h-5 w-5" />
        </button>
      )}

      {mobileOpen && <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)} />}

      <aside
        className={`fixed top-0 left-0 z-50 h-full w-[85vw] max-w-[290px] lg:w-[290px] glass-panel flex flex-col transition-transform duration-300 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="h-24 flex items-center px-6 relative overflow-hidden border-b border-white/10">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-12 w-12 rounded-2xl border border-white/10 bg-black/30 p-2 shadow-[0_0_26px_rgba(108,92,231,0.32)] shrink-0">
              <img src={brandLogo} alt="Cloud Finder Logo" className="h-full w-full object-contain" />
            </div>
            <div className="min-w-0">
              <h1 className="font-display text-xl text-white leading-none truncate">Cloud Finder</h1>
              <p className="text-[11px] text-[#00E5FF] uppercase tracking-[0.24em] mt-1 font-semibold truncate">{clubName}</p>
            </div>
          </div>
          <button onClick={() => setMobileOpen(false)} className="absolute right-4 top-1/2 -translate-y-1/2 lg:hidden text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-7 px-3 space-y-1.5">
          <div className="px-4 mb-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Main</div>
          {mainItems.map(renderNavItem)}

          {opsItems.length > 0 && (
            <>
              <div className="px-4 mt-8 mb-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Operations</div>
              {opsItems.map(renderNavItem)}
            </>
          )}

          {otherItems.length > 0 && <div className="pt-6 mt-auto">{otherItems.map(renderNavItem)}</div>}
        </nav>

        <div className="p-4 border-t border-white/10 bg-black/15 backdrop-blur-md">
          <button className="w-full glass-card !bg-white/5 hover:!bg-white/10 rounded-xl p-3 flex items-center gap-3 transition-colors group">
            <div className="relative shrink-0">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#00E5FF] to-[#6C5CE7] p-[2px]">
                <div className="w-full h-full rounded-full bg-[#0A0F1B] flex items-center justify-center text-xs font-bold uppercase text-white">
                  {user?.username?.slice(0, 2) ?? "CF"}
                </div>
              </div>
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#58d68d] border-2 border-[#0A0F1B] rounded-full">
                <div className="status-ping bg-[#58d68d]" />
              </div>
            </div>
            <div className="text-left overflow-hidden">
              <p className="text-sm font-bold text-white truncate group-hover:text-[#00E5FF] transition-colors">{user?.username ?? "Cloud Manager"}</p>
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
