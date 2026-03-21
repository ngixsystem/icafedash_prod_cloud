import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2, User, PlusCircle, Trash2, MapPin, X,
  ChevronDown, ChevronUp, Crosshair, Target, Trophy,
  Swords, ArrowLeftRight, Zap, Shield, MessageCircle, BarChart2,
} from "lucide-react";
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
const GAMES = ["CS2", "Dota 2"];

// ─── Мини-стата FACEIT ──────────────────────────────────────────────────────

function FaceitMiniStats({ userId }: { userId: number }) {
  const { data, isLoading } = useQuery({
    queryKey: ["faceit_mini", userId],
    queryFn: async () => {
      const r = await fetch(`${API}/public/players/${userId}/faceit-stats`);
      if (!r.ok) throw new Error("no stats");
      return r.json();
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-3">
        <Loader2 className="w-4 h-4 animate-spin text-[#FF7800]" />
      </div>
    );
  }

  if (!data?.lifetime) {
    return (
      <p className="text-xs text-white/30 text-center py-2">Нет данных FACEIT</p>
    );
  }

  const lt = data.lifetime;
  const wr = parseFloat(lt.win_rate) || 0;
  const wrColor = wr >= 55 ? "#22c55e" : wr >= 45 ? "#eab308" : "#ef4444";

  return (
    <div className="mt-3 rounded-xl bg-white/3 border border-white/6 p-3 space-y-3">
      {/* Четыре стата */}
      <div className="grid grid-cols-4 gap-2">
        {([
          { icon: Swords,   label: "Матчей",  value: lt.matches,    color: "#FF7800" },
          { icon: Trophy,   label: "Победы",  value: `${lt.win_rate}%`, color: wrColor },
          { icon: Crosshair,label: "K/D",     value: lt.kd_ratio,   color: "#3b82f6" },
          { icon: Target,   label: "HS%",     value: `${lt.headshots}%`, color: "#a855f7" },
        ] as const).map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="flex flex-col items-center gap-1">
            <span className="text-sm font-bold" style={{ color }}>{value}</span>
            <span className="text-[9px] text-white/30 uppercase tracking-widest">{label}</span>
          </div>
        ))}
      </div>

      {/* Прогресс-бар винрейта */}
      <div className="space-y-1">
        <div className="flex justify-between text-[10px] text-white/30">
          <span>Винрейт</span>
          <span style={{ color: wrColor }}>{lt.win_rate}%</span>
        </div>
        <div className="h-1 rounded-full bg-white/5 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${Math.min(wr, 100)}%`, background: `linear-gradient(90deg, ${wrColor}88, ${wrColor})` }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Карточка объявления ────────────────────────────────────────────────────

function ListingCard({
  listing, onPlayerClick, isMyListing, onDelete,
}: {
  listing: TransferListing;
  onPlayerClick: (id: number) => void;
  isMyListing: boolean;
  onDelete?: () => void;
}) {
  const [showStats, setShowStats] = useState(false);
  const isLft = listing.listing_type === "lft";
  const p = listing.player;
  const hasFaceit = p.faceit_level != null;

  const accentColor = isLft ? "#FF7800" : "#3b82f6";
  const accentBg    = isLft ? "rgba(255,120,0,0.08)" : "rgba(59,130,246,0.08)";
  const accentBorder= isLft ? "rgba(255,120,0,0.25)" : "rgba(59,130,246,0.25)";

  return (
    <div
      className="relative rounded-2xl overflow-hidden transition-all duration-200 active:scale-[0.99]"
      style={{
        background: `linear-gradient(135deg, #1c1d21 0%, #18191d 100%)`,
        border: `1px solid ${accentBorder}`,
        boxShadow: `0 0 0 0 ${accentColor}00`,
      }}
    >
      {/* Цветная полоска слева */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-2xl"
        style={{ background: `linear-gradient(180deg, ${accentColor}, ${accentColor}44)` }}
      />

      <div className="pl-5 pr-4 pt-4 pb-3 space-y-3">

        {/* Тип + игра + удаление */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full"
              style={{ background: accentBg, color: accentColor, border: `1px solid ${accentBorder}` }}
            >
              {isLft ? "Ищу команду" : "Ищу игрока"}
            </span>
            <span className="text-[11px] text-white/30 font-medium">{listing.game}</span>
          </div>
          {isMyListing && onDelete && (
            <button
              onClick={onDelete}
              className="p-1.5 rounded-lg text-red-400/60 hover:text-red-400 hover:bg-red-400/10 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Игрок */}
        <button
          className="flex items-center gap-3 w-full text-left group"
          onClick={() => onPlayerClick(p.id)}
        >
          {/* Аватар */}
          <div className="relative flex-shrink-0">
            <div
              className="w-12 h-12 rounded-xl overflow-hidden"
              style={{ boxShadow: hasFaceit ? `0 0 0 2px ${accentColor}40` : undefined }}
            >
              {p.avatar_url ? (
                <img src={p.avatar_url} alt={p.username} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center" style={{ background: accentBg }}>
                  <User className="w-5 h-5" style={{ color: accentColor }} />
                </div>
              )}
            </div>
            {hasFaceit && (
              <div className="absolute -bottom-1.5 -right-1.5">
                <FaceitLevelIcon level={p.faceit_level!} elo={p.faceit_elo} size={22} />
              </div>
            )}
          </div>

          {/* Инфо */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="font-bold text-sm text-white group-hover:text-[#FF7800] transition-colors truncate">
                {p.username}
              </p>
              {isMyListing && (
                <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-[#FF7800]/15 text-[#FF7800]">
                  Мой
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              {p.team_name ? (
                <span className="text-[11px] text-white/40 flex items-center gap-1">
                  <Shield className="w-2.5 h-2.5" />
                  {p.team_name}
                </span>
              ) : (
                <span className="text-[11px] text-white/25">Без команды</span>
              )}
              {p.faceit_elo != null && (
                <>
                  <span className="text-white/15">·</span>
                  <span className="text-[11px] font-semibold" style={{ color: accentColor }}>
                    {p.faceit_elo} ELO
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Стрелка */}
          <ArrowLeftRight className="w-3.5 h-3.5 text-white/20 group-hover:text-white/50 transition-colors flex-shrink-0" />
        </button>

        {/* Роли */}
        {listing.roles && (
          <div className="flex flex-wrap gap-1.5">
            {listing.roles.split(",").map((r) => (
              <span
                key={r}
                className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                style={{ background: `${accentColor}12`, color: `${accentColor}cc`, border: `1px solid ${accentColor}25` }}
              >
                {r.trim()}
              </span>
            ))}
          </div>
        )}

        {/* Описание */}
        {listing.description && (
          <p className="text-xs text-white/40 leading-relaxed line-clamp-2">
            {listing.description}
          </p>
        )}

        {/* FACEIT стата (раскрываемая) */}
        {hasFaceit && showStats && <FaceitMiniStats userId={p.id} />}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-white/5">
          <div className="flex items-center gap-3">
            {listing.region && (
              <span className="flex items-center gap-1 text-[11px] text-white/30">
                <MapPin className="w-3 h-3" />
                {listing.region}
              </span>
            )}
            {listing.contact && (
              <span className="flex items-center gap-1 text-[11px]" style={{ color: `${accentColor}cc` }}>
                <MessageCircle className="w-3 h-3" />
                {listing.contact}
              </span>
            )}
          </div>

          {hasFaceit && (
            <button
              onClick={() => setShowStats((s) => !s)}
              className="flex items-center gap-1 text-[11px] font-semibold transition-all px-2.5 py-1 rounded-full"
              style={{
                color: showStats ? accentColor : "rgba(255,255,255,0.35)",
                background: showStats ? accentBg : "transparent",
                border: `1px solid ${showStats ? accentBorder : "transparent"}`,
              }}
            >
              <Zap className="w-3 h-3" />
              FACEIT
              {showStats ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Форма создания объявления ──────────────────────────────────────────────

const INPUT_CLS = "w-full bg-[#0e0f12] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#FF7800]/50 transition-all";

function CreateListingModal({ onClose, token }: { onClose: () => void; token: string | null }) {
  const { mutate, isPending } = useCreateListing(token);
  const { toast } = useToast();
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

  function handleSubmit() {
    if (!token) {
      toast({ title: "Необходима авторизация", description: "Войдите в аккаунт", variant: "destructive" });
      return;
    }
    mutate(form, {
      onSuccess: () => {
        toast({ title: "Объявление опубликовано" });
        onClose();
      },
      onError: (e: any) => {
        toast({ title: "Ошибка", description: e?.message ?? "Не удалось опубликовать", variant: "destructive" });
      },
    });
  }

  return (
    <div className="fixed inset-0 z-[1100]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />

      {/* Sheet */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-center pointer-events-none">
      <div className="relative w-full max-w-[420px] rounded-t-3xl overflow-hidden max-h-[92vh] flex flex-col pointer-events-auto"
        style={{ background: "linear-gradient(180deg, #1e1f24 0%, #18191d 100%)", borderTop: "1px solid rgba(255,255,255,0.08)" }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-white/15" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3">
          <div>
            <h2 className="font-bold text-base text-white">Подать объявление</h2>
            <p className="text-xs text-white/35 mt-0.5">Найди команду или игрока</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/6 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 pb-[84px] space-y-3">
          {/* Тип */}
          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-white/4 border border-white/6">
            {(["lft", "lfs"] as const).map((t) => {
              const active = form.listing_type === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => set("listing_type", t)}
                  className="py-2.5 rounded-lg text-sm font-semibold transition-all"
                  style={
                    active
                      ? { background: t === "lft" ? "#FF7800" : "#3b82f6", color: "#fff", boxShadow: `0 2px 12px ${t === "lft" ? "#FF780040" : "#3b82f640"}` }
                      : { color: "rgba(255,255,255,0.35)" }
                  }
                >
                  {t === "lft" ? "Ищу команду" : "Ищу игрока"}
                </button>
              );
            })}
          </div>

          {/* Игра */}
          <div className="grid grid-cols-2 gap-2">
            {GAMES.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => set("game", g)}
                className="py-2.5 rounded-xl text-sm font-medium border transition-all"
                style={
                  form.game === g
                    ? { background: "rgba(255,120,0,0.12)", color: "#FF7800", borderColor: "rgba(255,120,0,0.3)" }
                    : { background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.4)", borderColor: "rgba(255,255,255,0.07)" }
                }
              >
                {g}
              </button>
            ))}
          </div>

          <input className={INPUT_CLS} type="text" placeholder="Роли (Rifler, AWPer, IGL...)"
            value={form.roles} onChange={(e) => set("roles", e.target.value)} />

          <input className={INPUT_CLS} type="text" placeholder="Регион (СНГ, EU, RU...)"
            value={form.region} onChange={(e) => set("region", e.target.value)} />

          <textarea className={`${INPUT_CLS} resize-none`} placeholder="Расскажи о себе / требованиях..."
            value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} />

          <input className={INPUT_CLS} type="text" placeholder="Telegram / Discord"
            value={form.contact} onChange={(e) => set("contact", e.target.value)} />

          <button
            onClick={handleSubmit}
            disabled={isPending}
            className="w-full py-3.5 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-2"
            style={{ background: "linear-gradient(135deg, #FF7800, #ff9a2f)", boxShadow: "0 4px 20px rgba(255,120,0,0.35)" }}
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : (
              <><PlusCircle className="w-4 h-4" /> Опубликовать</>
            )}
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}

// ─── Главная страница ───────────────────────────────────────────────────────

const FILTER_TYPES = [
  { value: "", label: "Все" },
  { value: "lft", label: "Игроки", color: "#FF7800" },
  { value: "lfs", label: "Команды", color: "#3b82f6" },
];

export default function TransferPage() {
  const navigate = useNavigate();
  const { token, user, isAuthenticated } = useAuth();
  const [filterType, setFilterType] = useState("");
  const [filterGame, setFilterGame] = useState("");
  const [showForm, setShowForm] = useState(false);

  function handleOpenForm() {
    if (!isAuthenticated) {
      navigate("/auth");
      return;
    }
    setShowForm(true);
  }

  const { data, isLoading, isError, error } = useTransferListings({ type: filterType, game: filterGame });
  const { mutate: deleteListing } = useDeleteListing(token);
  const myListing = data?.items.find((l) => l.player.id === user?.id);

  return (
    <div className="pb-24 min-h-screen">

      {/* Hero-шапка */}
      <div className="relative overflow-hidden px-4 pt-6 pb-5">
        {/* Glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-40 h-40 rounded-full bg-[#FF7800]/10 blur-3xl" />
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-[#3b82f6]/8 blur-3xl" />
        </div>

        <div className="relative flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-lg bg-[#FF7800]/15 flex items-center justify-center">
                <ArrowLeftRight className="w-3.5 h-3.5 text-[#FF7800]" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#FF7800]">Transfer Market</span>
            </div>
            <h1 className="text-2xl font-black text-white leading-tight">
              Найди{" "}
              <span style={{ background: "linear-gradient(90deg,#FF7800,#ff9a2f)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                команду
              </span>
            </h1>
            <p className="text-xs text-white/35 mt-1">
              {data?.total ?? 0} активных объявлений
            </p>
          </div>

          <button
            onClick={handleOpenForm}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-xs font-bold transition-all active:scale-95 mt-1"
            style={{
              background: "linear-gradient(135deg, #FF7800, #ff9a2f)",
              boxShadow: "0 4px 16px rgba(255,120,0,0.35)",
            }}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            Подать
          </button>
        </div>
      </div>

      {/* Кнопка рейтинга */}
      <div className="px-4 pb-3">
        <button
          onClick={() => navigate("/ratings")}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-[#FFD700]/20 bg-[#FFD700]/5 hover:bg-[#FFD700]/10 active:scale-[0.98] transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#FFD700]/15 flex items-center justify-center">
              <BarChart2 className="w-4 h-4 text-[#FFD700]" />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-white">Рейтинг CYBER UNION</p>
              <p className="text-[10px] text-white/40">Топ игроков и команд</p>
            </div>
          </div>
          <ChevronDown className="w-4 h-4 text-white/30 -rotate-90 group-hover:text-[#FFD700] transition-colors" />
        </button>
      </div>

      {/* Фильтры — прилипают к верху */}
      <div className="sticky top-0 z-10 bg-[#121315]/95 backdrop-blur-md border-b border-white/6 px-4 py-3 space-y-2.5">

        {/* Тип */}
        <div className="flex gap-2">
          {FILTER_TYPES.map((f) => {
            const active = filterType === f.value;
            return (
              <button
                key={f.value}
                onClick={() => setFilterType(f.value)}
                className="px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all"
                style={
                  active
                    ? {
                        background: f.color ? `${f.color}18` : "rgba(255,255,255,0.1)",
                        color: f.color ?? "#fff",
                        border: `1px solid ${f.color ? `${f.color}35` : "rgba(255,255,255,0.2)"}`,
                        boxShadow: f.color ? `0 0 12px ${f.color}20` : undefined,
                      }
                    : {
                        background: "rgba(255,255,255,0.04)",
                        color: "rgba(255,255,255,0.4)",
                        border: "1px solid rgba(255,255,255,0.06)",
                      }
                }
              >
                {f.label}
              </button>
            );
          })}
        </div>

        {/* Игра */}
        <div className="flex gap-2">
          {["", ...GAMES].map((g) => {
            const active = filterGame === g;
            const label = g === "" ? "Все игры" : g;
            return (
              <button
                key={g}
                onClick={() => setFilterGame(g === filterGame && g !== "" ? "" : g)}
                className="px-3 py-1 rounded-full text-[11px] font-medium transition-all"
                style={
                  active
                    ? { background: "rgba(255,255,255,0.12)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)" }
                    : { background: "transparent", color: "rgba(255,255,255,0.3)", border: "1px solid rgba(255,255,255,0.06)" }
                }
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Список */}
      <div className="px-4 pt-4 space-y-3">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 className="w-7 h-7 animate-spin text-[#FF7800]" />
            <p className="text-xs text-white/25">Загрузка объявлений...</p>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-center px-4">
            <p className="text-sm font-semibold text-red-400">Ошибка загрузки</p>
            <p className="text-xs text-white/30">{(error as any)?.message ?? "Не удалось загрузить объявления"}</p>
          </div>
        ) : !data?.items.length ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/4 flex items-center justify-center">
              <ArrowLeftRight className="w-7 h-7 text-white/20" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-white/40">Объявлений нет</p>
              <p className="text-xs text-white/20 mt-1">Будь первым — подай объявление</p>
            </div>
          </div>
        ) : (
          data.items.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              onPlayerClick={(id) => navigate(`/players/${id}`)}
              isMyListing={myListing?.id === listing.id}
              onDelete={
                myListing?.id === listing.id
                  ? () => deleteListing(listing.id)
                  : undefined
              }
            />
          ))
        )}
      </div>

      {showForm && (
        <CreateListingModal token={token} onClose={() => setShowForm(false)} />
      )}
    </div>
  );
}
