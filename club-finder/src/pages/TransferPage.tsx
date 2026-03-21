import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Users, User, PlusCircle, Trash2, MapPin, Gamepad2, X, ChevronDown, ChevronUp, Crosshair, Target, Trophy, Swords } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { FaceitLevelIcon } from "@/components/FaceitLevelIcon";
import {
  useTransferListings,
  useCreateListing,
  useDeleteListing,
  type CreateListingPayload,
  type TransferListing,
} from "@/hooks/use-transfer";

const API = import.meta.env.VITE_API_URL ?? "";

// ─── Мини-стата FACEIT ───────────────────────────────

function FaceitMiniStats({ userId }: { userId: number }) {
  const { data, isLoading } = useQuery({
    queryKey: ["faceit_mini", userId],
    queryFn: async () => {
      const r = await fetch(`${API}/api/public/players/${userId}/faceit-stats`);
      if (!r.ok) throw new Error("no stats");
      return r.json();
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-2">
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data?.lifetime) {
    return <p className="text-xs text-muted-foreground text-center py-2">Нет данных FACEIT</p>;
  }

  const lt = data.lifetime;
  const stats = [
    { icon: Swords, label: "Матчей", value: lt.matches, color: "#FF7800" },
    { icon: Trophy, label: "Винрейт", value: `${lt.win_rate}%`, color: "#22c55e" },
    { icon: Crosshair, label: "K/D", value: lt.kd_ratio, color: "#3b82f6" },
    { icon: Target, label: "HS %", value: `${lt.headshots}%`, color: "#a855f7" },
  ];

  return (
    <div className="grid grid-cols-4 gap-2 pt-1">
      {stats.map(({ icon: Icon, label, value, color }) => (
        <div key={label} className="flex flex-col items-center gap-1 bg-white/3 rounded-xl py-2">
          <Icon className="w-3 h-3" style={{ color }} />
          <span className="text-xs font-bold text-white leading-none">{value}</span>
          <span className="text-[9px] text-muted-foreground uppercase tracking-wide">{label}</span>
        </div>
      ))}
    </div>
  );
}

const GAMES = ["CS2", "Dota 2"];

// ─── Карточка объявления ─────────────────────────────

function ListingCard({ listing, onPlayerClick, myListingId, onDelete }: {
  listing: TransferListing;
  onPlayerClick: (id: number) => void;
  myListingId?: number;
  onDelete?: () => void;
}) {
  const isLft = listing.listing_type === "lft";
  const p = listing.player;
  const [showStats, setShowStats] = useState(false);
  const hasFaceit = p.faceit_level != null;

  return (
    <div className="rounded-2xl bg-[#1a1b1e] border border-white/8 p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span
          className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
            isLft
              ? "bg-[#FF7800]/15 text-[#FF7800]"
              : "bg-[#3b82f6]/15 text-[#3b82f6]"
          }`}
        >
          {isLft ? "Ищу команду" : "Ищу игрока"}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-muted-foreground">{listing.game}</span>
          {myListingId === listing.id && onDelete && (
            <button
              onClick={onDelete}
              className="text-red-400 hover:text-red-300 transition-colors"
              title="Удалить объявление"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Player row */}
      <button
        className="flex items-center gap-3 w-full text-left"
        onClick={() => onPlayerClick(p.id)}
      >
        <div className="relative flex-shrink-0">
          {p.avatar_url ? (
            <img
              src={p.avatar_url}
              alt={p.username}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-[#2a2b2e] flex items-center justify-center">
              <User className="w-5 h-5 text-muted-foreground" />
            </div>
          )}
          {p.faceit_level != null && (
            <div className="absolute -bottom-1 -right-1">
              <FaceitLevelIcon level={p.faceit_level} elo={p.faceit_elo} size={20} />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{p.username}</p>
          <p className="text-[11px] text-muted-foreground truncate">
            {p.team_name ? `Команда: ${p.team_name}` : "Без команды"}
            {p.faceit_elo != null && ` · ${p.faceit_elo} ELO`}
          </p>
        </div>
      </button>

      {/* Roles */}
      {listing.roles && (
        <div className="flex flex-wrap gap-1.5">
          {listing.roles.split(",").map((r) => (
            <span
              key={r}
              className="text-[10px] bg-white/5 border border-white/8 rounded-full px-2 py-0.5 text-muted-foreground"
            >
              {r.trim()}
            </span>
          ))}
        </div>
      )}

      {/* Description */}
      {listing.description && (
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
          {listing.description}
        </p>
      )}

      {/* FACEIT мини-стата */}
      {hasFaceit && showStats && <FaceitMiniStats userId={p.id} />}

      {/* Footer */}
      <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-white/5">
        <div className="flex items-center gap-1">
          {listing.region && (
            <>
              <MapPin className="w-3 h-3" />
              <span>{listing.region}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-3">
          {listing.contact && (
            <span className="text-[#FF7800] truncate max-w-[100px]">{listing.contact}</span>
          )}
          {hasFaceit && (
            <button
              onClick={() => setShowStats((s) => !s)}
              className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-white transition-colors"
            >
              {showStats ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              Стата
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Форма создания объявления ────────────────────────

function CreateListingModal({ onClose, token }: { onClose: () => void; token: string }) {
  const { mutate, isPending } = useCreateListing(token);
  const [form, setForm] = useState<CreateListingPayload>({
    listing_type: "lft",
    game: "CS2",
    roles: "",
    description: "",
    region: "",
    contact: "",
  });

  const set = (k: keyof CreateListingPayload, v: string) =>
    setForm((p) => ({ ...p, [k]: v }));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    mutate(form, { onSuccess: onClose });
  }

  return (
    <div className="fixed inset-0 z-[1100] flex items-end justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-[420px] bg-[#18191c] rounded-t-3xl border-t border-white/10 p-5 pb-[80px] space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-base">Подать объявление</h2>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Тип */}
          <div className="flex rounded-xl overflow-hidden border border-white/10 text-sm">
            {(["lft", "lfs"] as const).map((t) => (
              <button
                key={t}
                type="button"
                className={`flex-1 py-2 font-medium transition-colors ${
                  form.listing_type === t
                    ? "bg-[#FF7800] text-white"
                    : "bg-transparent text-muted-foreground"
                }`}
                onClick={() => set("listing_type", t)}
              >
                {t === "lft" ? "Ищу команду" : "Ищу игрока"}
              </button>
            ))}
          </div>

          {/* Игра */}
          <select
            value={form.game}
            onChange={(e) => set("game", e.target.value)}
            className="w-full bg-[#0b0d12] border border-white/10 rounded-xl px-3 py-2 text-sm text-white"
          >
            {GAMES.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>

          {/* Роли */}
          <input
            type="text"
            placeholder="Роли (Rifler, AWPer, IGL...)"
            value={form.roles}
            onChange={(e) => set("roles", e.target.value)}
            className="w-full bg-[#0b0d12] border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-muted-foreground"
          />

          {/* Регион */}
          <input
            type="text"
            placeholder="Регион (СНГ, EU, RU...)"
            value={form.region}
            onChange={(e) => set("region", e.target.value)}
            className="w-full bg-[#0b0d12] border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-muted-foreground"
          />

          {/* Описание */}
          <textarea
            placeholder="Расскажи о себе / требованиях..."
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            rows={3}
            className="w-full bg-[#0b0d12] border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-muted-foreground resize-none"
          />

          {/* Контакт */}
          <input
            type="text"
            placeholder="Telegram / Discord"
            value={form.contact}
            onChange={(e) => set("contact", e.target.value)}
            className="w-full bg-[#0b0d12] border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-muted-foreground"
          />

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-2.5 rounded-xl bg-[#FF7800] text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Опубликовать"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Главная страница ────────────────────────────────

const FILTER_TYPES = [
  { value: "", label: "Все" },
  { value: "lft", label: "Ищут команду" },
  { value: "lfs", label: "Ищут игрока" },
];

export default function TransferPage() {
  const navigate = useNavigate();
  const { token, user, isAuthenticated } = useAuth();
  const [filterType, setFilterType] = useState("");
  const [filterGame, setFilterGame] = useState("");
  const [showForm, setShowForm] = useState(false);

  const { data, isLoading } = useTransferListings({
    type: filterType,
    game: filterGame,
  });

  const { mutate: deleteListing } = useDeleteListing(token);

  const myListing = data?.items.find((l) => l.player.id === user?.id);

  return (
    <div className="pb-24 min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#121315]/95 backdrop-blur-sm border-b border-white/8 px-4 pt-4 pb-3 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">Трансфер-маркет</h1>
            <p className="text-xs text-muted-foreground">
              {data?.total ?? 0} объявлений
            </p>
          </div>
          {isAuthenticated && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#FF7800]/10 border border-[#FF7800]/20 text-[#FF7800] text-xs font-semibold"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Объявление
            </button>
          )}
        </div>

        {/* Тип фильтра */}
        <div className="flex gap-2">
          {FILTER_TYPES.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilterType(f.value)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                filterType === f.value
                  ? "bg-[#FF7800] text-white"
                  : "bg-white/5 text-muted-foreground border border-white/8"
              }`}
            >
              {f.value === "lft" && <User className="w-3 h-3" />}
              {f.value === "lfs" && <Users className="w-3 h-3" />}
              {f.label}
            </button>
          ))}
        </div>

        {/* Игра фильтр */}
        <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-none">
          <button
            onClick={() => setFilterGame("")}
            className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filterGame === ""
                ? "bg-white/15 text-white"
                : "bg-white/5 text-muted-foreground"
            }`}
          >
            <Gamepad2 className="w-3 h-3" />
            Все игры
          </button>
          {GAMES.map((g) => (
            <button
              key={g}
              onClick={() => setFilterGame(filterGame === g ? "" : g)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filterGame === g
                  ? "bg-white/15 text-white"
                  : "bg-white/5 text-muted-foreground"
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="px-4 pt-4 space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : !data?.items.length ? (
          <div className="text-center py-20 text-muted-foreground text-sm">
            Нет объявлений
          </div>
        ) : (
          data.items.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              onPlayerClick={(id) => navigate(`/players/${id}`)}
              myListingId={myListing?.id}
              onDelete={
                myListing?.id === listing.id
                  ? () => deleteListing(listing.id)
                  : undefined
              }
            />
          ))
        )}
      </div>

      {/* Форма */}
      {showForm && token && (
        <CreateListingModal token={token} onClose={() => setShowForm(false)} />
      )}
    </div>
  );
}
