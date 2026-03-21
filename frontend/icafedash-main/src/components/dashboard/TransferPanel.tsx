import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pencil, Search, Trash2, Plus, X, ArrowLeftRight, User } from "lucide-react";
import { api, type AdminTransferListing } from "@/lib/api";

const GAMES = ["CS2", "Dota 2"];
const LISTING_TYPES = [
  { value: "", label: "Все" },
  { value: "lft", label: "Ищут команду" },
  { value: "lfs", label: "Ищут игрока" },
];

function Badge({ type }: { type: "lft" | "lfs" }) {
  return (
    <span
      className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
        type === "lft"
          ? "bg-orange-500/15 text-orange-400"
          : "bg-blue-500/15 text-blue-400"
      }`}
    >
      {type === "lft" ? "Ищу команду" : "Ищу игрока"}
    </span>
  );
}

// ─── Модал редактирования ─────────────────────────

interface EditModalProps {
  listing: AdminTransferListing;
  onClose: () => void;
  onSave: (data: Partial<AdminTransferListing>) => void;
  isPending: boolean;
}

function EditModal({ listing, onClose, onSave, isPending }: EditModalProps) {
  const [form, setForm] = useState({
    listing_type: listing.listing_type,
    game: listing.game,
    roles: listing.roles ?? "",
    description: listing.description ?? "",
    region: listing.region ?? "",
    contact: listing.contact ?? "",
    min_elo: listing.min_elo ?? "",
    max_elo: listing.max_elo ?? "",
    is_active: listing.is_active,
  });

  const set = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-[#0e1427] border border-white/10 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-white">
            Редактировать — {listing.player.username}
          </h3>
          <button onClick={onClose}>
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* Тип */}
        <div className="flex rounded-xl overflow-hidden border border-white/10 text-sm">
          {(["lft", "lfs"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => set("listing_type", t)}
              className={`flex-1 py-2 font-medium transition-colors ${
                form.listing_type === t
                  ? "bg-[#FF7800] text-white"
                  : "bg-transparent text-slate-400"
              }`}
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
          {GAMES.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>

        <input
          placeholder="Роли (Rifler, AWPer...)"
          value={form.roles}
          onChange={(e) => set("roles", e.target.value)}
          className="w-full bg-[#0b0d12] border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-slate-500"
        />

        <input
          placeholder="Регион (СНГ, EU...)"
          value={form.region}
          onChange={(e) => set("region", e.target.value)}
          className="w-full bg-[#0b0d12] border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-slate-500"
        />

        <textarea
          placeholder="Описание..."
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          rows={3}
          className="w-full bg-[#0b0d12] border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-slate-500 resize-none"
        />

        <input
          placeholder="Telegram / Discord"
          value={form.contact}
          onChange={(e) => set("contact", e.target.value)}
          className="w-full bg-[#0b0d12] border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-slate-500"
        />

        <div className="grid grid-cols-2 gap-3">
          <input
            type="number"
            placeholder="Мин. ELO"
            value={form.min_elo}
            onChange={(e) => set("min_elo", e.target.value ? Number(e.target.value) : "")}
            className="w-full bg-[#0b0d12] border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-slate-500"
          />
          <input
            type="number"
            placeholder="Макс. ELO"
            value={form.max_elo}
            onChange={(e) => set("max_elo", e.target.value ? Number(e.target.value) : "")}
            className="w-full bg-[#0b0d12] border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-slate-500"
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => set("is_active", e.target.checked)}
            className="w-4 h-4 accent-orange-500"
          />
          Активное объявление
        </label>

        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-xl border border-white/10 text-sm text-slate-300 hover:bg-white/5"
          >
            Отмена
          </button>
          <button
            onClick={() =>
              onSave({
                ...form,
                min_elo: form.min_elo !== "" ? Number(form.min_elo) : null,
                max_elo: form.max_elo !== "" ? Number(form.max_elo) : null,
              } as any)
            }
            disabled={isPending}
            className="flex-1 py-2 rounded-xl bg-[#FF7800] text-white text-sm font-semibold disabled:opacity-60"
          >
            {isPending ? "Сохраняю..." : "Сохранить"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Модал создания объявления ─────────────────────

interface CreateModalProps {
  onClose: () => void;
}

function CreateModal({ onClose }: CreateModalProps) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    user_id: "",
    listing_type: "lft" as "lft" | "lfs",
    game: "CS2",
    roles: "",
    description: "",
    region: "",
    contact: "",
  });

  const set = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }));

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      api.adminTransferCreate({
        ...form,
        user_id: Number(form.user_id),
      }),
    onSuccess: () => {
      toast.success("Объявление создано");
      qc.invalidateQueries({ queryKey: ["admin_transfer"] });
      onClose();
    },
    onError: (e: any) => toast.error(e?.message || "Ошибка"),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-[#0e1427] border border-white/10 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-white">Создать объявление</h3>
          <button onClick={onClose}><X className="w-4 h-4 text-slate-400" /></button>
        </div>

        <input
          type="number"
          placeholder="ID пользователя"
          value={form.user_id}
          onChange={(e) => set("user_id", e.target.value)}
          className="w-full bg-[#0b0d12] border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-slate-500"
        />

        <div className="flex rounded-xl overflow-hidden border border-white/10 text-sm">
          {(["lft", "lfs"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => set("listing_type", t)}
              className={`flex-1 py-2 font-medium transition-colors ${
                form.listing_type === t ? "bg-[#FF7800] text-white" : "bg-transparent text-slate-400"
              }`}
            >
              {t === "lft" ? "Ищу команду" : "Ищу игрока"}
            </button>
          ))}
        </div>

        <select
          value={form.game}
          onChange={(e) => set("game", e.target.value)}
          className="w-full bg-[#0b0d12] border border-white/10 rounded-xl px-3 py-2 text-sm text-white"
        >
          {GAMES.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>

        <input
          placeholder="Роли"
          value={form.roles}
          onChange={(e) => set("roles", e.target.value)}
          className="w-full bg-[#0b0d12] border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-slate-500"
        />

        <input
          placeholder="Регион"
          value={form.region}
          onChange={(e) => set("region", e.target.value)}
          className="w-full bg-[#0b0d12] border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-slate-500"
        />

        <textarea
          placeholder="Описание..."
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          rows={2}
          className="w-full bg-[#0b0d12] border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-slate-500 resize-none"
        />

        <input
          placeholder="Telegram / Discord"
          value={form.contact}
          onChange={(e) => set("contact", e.target.value)}
          className="w-full bg-[#0b0d12] border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-slate-500"
        />

        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-2 rounded-xl border border-white/10 text-sm text-slate-300 hover:bg-white/5">
            Отмена
          </button>
          <button
            onClick={() => mutate()}
            disabled={isPending || !form.user_id}
            className="flex-1 py-2 rounded-xl bg-[#FF7800] text-white text-sm font-semibold disabled:opacity-60"
          >
            {isPending ? "Создаю..." : "Создать"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Главный компонент ─────────────────────────────

export default function TransferPanel() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterGame, setFilterGame] = useState("");
  const [filterActive, setFilterActive] = useState("");
  const [editing, setEditing] = useState<AdminTransferListing | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin_transfer", { search, filterType, filterGame, filterActive }],
    queryFn: () =>
      api.adminTransferList({
        search,
        type: filterType,
        game: filterGame,
        is_active: filterActive,
        limit: 100,
      }),
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["admin_transfer"] });

  const deleteMut = useMutation({
    mutationFn: (id: number) => api.adminTransferDelete(id),
    onSuccess: () => { toast.success("Удалено"); refresh(); },
    onError: (e: any) => toast.error(e?.message || "Ошибка удаления"),
  });

  const updateMut = useMutation({
    mutationFn: (data: Partial<AdminTransferListing>) =>
      api.adminTransferUpdate(editing!.id, data as any),
    onSuccess: () => {
      toast.success("Сохранено");
      setEditing(null);
      refresh();
    },
    onError: (e: any) => toast.error(e?.message || "Ошибка"),
  });

  const items = data?.items ?? [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display text-2xl tracking-tight text-white flex items-center gap-2">
            <ArrowLeftRight className="w-6 h-6 text-orange-400" />
            Трансфер-маркет
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">Всего объявлений: {data?.total ?? 0}</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 text-sm font-semibold hover:bg-orange-500/20 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Создать объявление
        </button>
      </div>

      {/* Фильтры */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по нику..."
            className="pl-9 pr-4 py-2 bg-[#0e1427] border border-white/10 rounded-xl text-sm text-white placeholder:text-slate-500 w-48"
          />
        </div>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="bg-[#0e1427] border border-white/10 rounded-xl px-3 py-2 text-sm text-white"
        >
          {LISTING_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>

        <select
          value={filterGame}
          onChange={(e) => setFilterGame(e.target.value)}
          className="bg-[#0e1427] border border-white/10 rounded-xl px-3 py-2 text-sm text-white"
        >
          <option value="">Все игры</option>
          {GAMES.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>

        <select
          value={filterActive}
          onChange={(e) => setFilterActive(e.target.value)}
          className="bg-[#0e1427] border border-white/10 rounded-xl px-3 py-2 text-sm text-white"
        >
          <option value="">Все статусы</option>
          <option value="1">Активные</option>
          <option value="0">Неактивные</option>
        </select>
      </div>

      {/* Таблица */}
      <div className="rounded-2xl border border-white/8 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/8 bg-white/2">
              <th className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-widest">Игрок</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-widest">Тип</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-widest">Игра</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-widest">Регион</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-widest">Роли</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-widest">Статус</th>
              <th className="text-right px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-widest">Действия</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-slate-500">Загрузка...</td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-slate-500">Нет объявлений</td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {item.player.avatar_url ? (
                        <img src={item.player.avatar_url} className="w-7 h-7 rounded-full object-cover" alt="" />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-white">{item.player.username}</p>
                        {item.player.faceit_elo != null && (
                          <p className="text-[11px] text-orange-400">{item.player.faceit_elo} ELO</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge type={item.listing_type} />
                  </td>
                  <td className="px-4 py-3 text-slate-300">{item.game}</td>
                  <td className="px-4 py-3 text-slate-400">{item.region || "—"}</td>
                  <td className="px-4 py-3 text-slate-400 max-w-[150px] truncate">{item.roles || "—"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        item.is_active
                          ? "bg-green-500/15 text-green-400"
                          : "bg-slate-500/15 text-slate-400"
                      }`}
                    >
                      {item.is_active ? "Активно" : "Скрыто"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setEditing(item)}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                        title="Редактировать"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Удалить объявление ${item.player.username}?`)) {
                            deleteMut.mutate(item.id);
                          }
                        }}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors"
                        title="Удалить"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <EditModal
          listing={editing}
          onClose={() => setEditing(null)}
          onSave={(data) => updateMut.mutate(data)}
          isPending={updateMut.isPending}
        />
      )}

      {showCreate && <CreateModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}
