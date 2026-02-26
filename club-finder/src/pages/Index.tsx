import { Search, MapPin, Cpu, TrendingUp } from "lucide-react";
import { useState } from "react";
import { useClubs } from "@/hooks/use-clubs";
import ClubCard from "@/components/ClubCard";

export default function Index() {
  const [query, setQuery] = useState("");
  const { data: clubs = [], isLoading } = useClubs();

  const filtered = clubs.filter(
    (c) =>
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.address.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="min-h-screen pb-32">
      {/* Dynamic Background Element */}
      <div className="fixed top-0 left-0 right-0 h-96 bg-gradient-to-b from-primary/10 via-transparent to-transparent -z-10 pointer-events-none" />

      {/* Header section */}
      <div className="relative px-6 pt-12 pb-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2.5">
              <img src="/logo.png" alt="ICAFE DASH" className="h-9 w-auto object-contain" />
              <div className="h-6 w-px bg-white/10 mx-1" />
              <p className="text-[9px] text-primary uppercase font-black tracking-[0.2em] leading-tight">
                Премиум<br />Поиск
              </p>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl glass flex items-center justify-center border-primary/20 animate-float">
            <TrendingUp className="w-5 h-5 text-primary" />
          </div>
        </div>

        {/* Improved Search */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary/50 to-accent/50 rounded-2xl blur opacity-20 group-focus-within:opacity-100 transition duration-500" />
          <div className="relative flex items-center glass-dark rounded-2xl border-white/10 overflow-hidden px-4">
            <Search className="w-4 h-4 text-primary" />
            <input
              type="text"
              placeholder="Поиск по названию или адресу..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-3 pr-4 py-3.5 bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none transition-all"
            />
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="px-6 mb-8">
        <div className="grid grid-cols-3 gap-2.5">
          <MetricCard
            label="Клубы"
            value={clubs.length}
            icon={<MapPin className="w-3.5 h-3.5 text-purple-400" />}
          />
          <MetricCard
            label="Свободно"
            value={clubs.reduce((s, c) => s + c.pcsFree, 0)}
            icon={<Cpu className="w-3.5 h-3.5 text-cyan-400" />}
            highlight
          />
          <MetricCard
            label="Онлайн"
            value={clubs.filter((c) => c.isOpen).length}
            icon={<TrendingUp className="w-3.5 h-3.5 text-emerald-400" />}
          />
        </div>
      </div>

      {/* Content wrapper */}
      <div className="px-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight uppercase text-white/40 text-[10px] tracking-[0.2em]">Популярные локации</h2>
          <div className="h-px flex-1 bg-white/5 ml-4" />
        </div>

        <div className="grid grid-cols-1 gap-5">
          {isLoading ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="h-64 w-full rounded-2xl glass animate-pulse" />
            ))
          ) : filtered.length > 0 ? (
            filtered.map((club) => <ClubCard key={club.id} club={club as any} />)
          ) : (
            <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
              <Search className="w-10 h-10 text-white/10 mx-auto mb-4" />
              <p className="text-white/40 font-medium">Ничего не найдено</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, icon, highlight = false }: { label: string, value: number, icon: any, highlight?: boolean }) {
  return (
    <div className={`flex-1 rounded-xl p-3 transition-all ${highlight ? 'glass-dark border-primary/30 ring-1 ring-primary/20' : 'glass border-white/5'}`}>
      <div className="flex items-center gap-1.5 mb-2">
        <div className="p-1 rounded-lg bg-white/5 border border-white/10">
          {icon}
        </div>
        <span className="text-[9px] uppercase tracking-wider text-white/40 font-bold whitespace-nowrap">{label}</span>
      </div>
      <p className="text-xl font-display font-black text-white">{value}</p>
    </div>
  );
}
