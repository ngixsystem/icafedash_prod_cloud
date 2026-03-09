import { Search, MapPin, Cpu, Activity, TrendingUp } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { useClubs } from "@/hooks/use-clubs";
import ClubCard from "@/components/ClubCard";
import { distanceKm, hasValidCoords } from "@/lib/distance";
import { useUserLocation } from "@/hooks/use-user-location";
import brandLogo from "@/assets/frag.png";

type ClubWithDistance = {
  id: number;
  distanceKm: number | null;
};

export default function Index() {
  const [query, setQuery] = useState("");
  const { data: clubs = [], isLoading } = useClubs();
  const userLocation = useUserLocation();

  const filtered = clubs.filter(
    (c) => c.name.toLowerCase().includes(query.toLowerCase()) || c.address.toLowerCase().includes(query.toLowerCase()),
  );

  const clubsWithDistance = useMemo<ClubWithDistance[]>(() => {
    return filtered.map((club) => {
      if (userLocation && hasValidCoords(club.lat, club.lng)) {
        return {
          id: club.id,
          distanceKm: distanceKm(userLocation, { lat: Number(club.lat), lng: Number(club.lng) }),
        };
      }
      return { id: club.id, distanceKm: null };
    });
  }, [filtered, userLocation]);

  const nearestClubId = useMemo(() => {
    const nearest = clubsWithDistance.filter((x) => x.distanceKm != null).sort((a, b) => (a.distanceKm as number) - (b.distanceKm as number))[0];
    return nearest?.id ?? null;
  }, [clubsWithDistance]);

  const sorted = useMemo(() => {
    const distanceMap = new Map<number, number | null>(clubsWithDistance.map((item) => [item.id, item.distanceKm]));
    return [...filtered].sort((a, b) => {
      const da = distanceMap.get(a.id);
      const db = distanceMap.get(b.id);
      if (da == null && db == null) return 0;
      if (da == null) return 1;
      if (db == null) return -1;
      return da - db;
    });
  }, [clubsWithDistance, filtered]);

  const distanceByClubId = useMemo(
    () => new Map<number, number | null>(clubsWithDistance.map((item) => [item.id, item.distanceKm])),
    [clubsWithDistance],
  );

  const totalFree = clubs.reduce((s, c) => s + c.pcsFree, 0);
  const online = clubs.filter((c) => c.isOpen).length;

  return (
    <div className="h-screen w-full overflow-hidden flex flex-col antialiased">
      <header className="flex items-center justify-between px-5 pt-8 pb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative w-11 h-11 bg-[#1E1F22] rounded-xl flex items-center justify-center border border-[#2F3136] overflow-hidden shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-br from-[#1E1F22] to-[#121315] opacity-50" />
            <div className="absolute -left-2 -top-2 w-6 h-6 bg-[#F5A623]/20 rotate-45" />
            <img src={brandLogo} alt="Cloud Finder" className="relative z-10 w-7 h-7 object-contain" />
          </div>
          <div className="flex flex-col">
            <h1 className="font-display text-[30px] font-bold uppercase tracking-wide leading-tight">FRAG.GG</h1>
            <span className="text-[#F5A623] text-[10px] font-bold tracking-widest uppercase">Киберспортивный поиск</span>
          </div>
        </div>
        <button className="w-10 h-10 bg-[#1E1F22] rounded-xl flex items-center justify-center border border-[#2F3136] text-[#949BA4] hover:text-[#F5A623] transition-colors">
          <TrendingUp className="w-[18px] h-[18px]" />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar pb-24">
        <div className="px-5 mb-6">
          <div className="flex items-center bg-[#18191C] border border-[#2F3136] rounded-xl px-4 py-3.5 focus-within:border-[#F5A623] transition-colors shadow-inner">
            <Search className="w-[18px] h-[18px] text-[#949BA4] mr-3 shrink-0" />
            <input
              type="text"
              placeholder="Поиск по названию или адресу..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="bg-transparent text-sm w-full outline-none text-white placeholder-[#949BA4] font-medium"
            />
          </div>
        </div>

        <div className="flex gap-3 px-5 mb-8">
          <MetricCard label="Клубы" value={clubs.length} icon={<MapPin className="w-3 h-3 text-[#F5A623]" />} />
          <MetricCard label="Свободно" value={totalFree} icon={<Cpu className="w-3 h-3 text-[#F5A623]" />} />
          <MetricCard label="Онлайн" value={online} icon={<Activity className="w-3 h-3 text-[#F5A623]" />} />
        </div>

        <div className="px-5 mb-5 flex items-center">
          <div className="w-1.5 h-4 bg-[#F5A623] rounded-sm mr-3" />
          <h2 className="font-display text-lg font-bold text-[#949BA4] uppercase tracking-widest leading-none pt-1">Популярные локации</h2>
          <div className="flex-1 h-[1px] bg-[#2F3136] ml-4" />
        </div>

        <div className="px-5 flex flex-col gap-5">
          {isLoading ? (
            Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-72 rounded-2xl bg-[#1E1F22] border border-[#2F3136] animate-pulse" />)
          ) : sorted.length > 0 ? (
            sorted.map((club) => (
              <ClubCard key={club.id} club={club} distanceKm={distanceByClubId.get(club.id) ?? null} isNearest={club.id === nearestClubId} />
            ))
          ) : (
            <div className="rounded-2xl border border-[#2F3136] bg-[#1E1F22] p-8 text-center text-[#949BA4]">Ничего не найдено</div>
          )}
        </div>
      </main>
    </div>
  );
}

function MetricCard({ label, value, icon }: { label: string; value: number; icon: ReactNode }) {
  return (
    <div className="flex-1 bg-[#1E1F22] border border-[#2F3136] rounded-xl p-3.5 flex flex-col justify-between shadow-sm relative overflow-hidden">
      <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-[#121315] rounded-full opacity-50" />
      <div className="flex items-center gap-2 mb-3 relative z-10">
        <div className="w-6 h-6 rounded-full bg-[#121315] flex items-center justify-center border border-[#2F3136]">{icon}</div>
        <span className="text-[10px] text-[#949BA4] font-bold uppercase tracking-wider">{label}</span>
      </div>
      <div className="font-display text-3xl font-bold relative z-10 leading-none">{value}</div>
    </div>
  );
}
