import { Search } from "lucide-react";
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
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="px-4 pt-12 pb-4">
        <h1 className="text-2xl font-display font-bold neon-text">
          🎮 GameHub
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Найди свой клуб и забронируй место
        </p>
      </div>

      {/* Search */}
      <div className="px-4 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Поиск клуба..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
          />
        </div>
      </div>

      {/* Quick stats */}
      <div className="px-4 mb-4 flex gap-3">
        <div className="flex-1 rounded-lg glass p-3 text-center">
          <p className="text-2xl font-display font-bold text-primary">{clubs.length}</p>
          <p className="text-xs text-muted-foreground">Клубов</p>
        </div>
        <div className="flex-1 rounded-lg glass p-3 text-center">
          <p className="text-2xl font-display font-bold text-success">
            {clubs.reduce((s, c) => s + c.pcsFree, 0)}
          </p>
          <p className="text-xs text-muted-foreground">Свободных ПК</p>
        </div>
        <div className="flex-1 rounded-lg glass p-3 text-center">
          <p className="text-2xl font-display font-bold text-warning">
            {clubs.filter((c) => c.isOpen).length}
          </p>
          <p className="text-xs text-muted-foreground">Открыто</p>
        </div>
      </div>

      {/* Club list */}
      <div className="px-4 space-y-4">
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground"><p>Загрузка клубов...</p></div>
        ) : filtered.length > 0 ? (
          filtered.map((club) => <ClubCard key={club.id} club={club as any} />)
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg">Ничего не найдено</p>
          </div>
        )}
      </div>
    </div>
  );
}
