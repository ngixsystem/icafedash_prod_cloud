import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pencil, Search, Trash2, UserPlus, Users, X } from "lucide-react";
import { api, RegisteredUser } from "@/lib/api";

const ROLES = ["member", "client", "manager", "captain", "admin"] as const;

export default function UsersPanel() {
  const qc = useQueryClient();
  const { data: users = [], isLoading } = useQuery({ queryKey: ["admin_users"], queryFn: api.adminUsers });
  const [search, setSearch] = useState("");
  const [editUser, setEditUser] = useState<RegisteredUser | null>(null);
  const [editRole, setEditRole] = useState("");
  const [editVerified, setEditVerified] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newClubId, setNewClubId] = useState("");

  const refresh = () => qc.invalidateQueries({ queryKey: ["admin_users"] });

  const deleteMut = useMutation({
    mutationFn: (id: number) => api.deleteUser(id),
    onSuccess: () => { toast.success("Пользователь удалён"); refresh(); },
    onError: (e: any) => toast.error(e?.message || "Ошибка удаления"),
  });

  const updateMut = useMutation({
    mutationFn: () => api.updateUser(editUser!.id, { role: editRole, is_verified: editVerified }),
    onSuccess: () => { toast.success("Пользователь обновлён"); setEditUser(null); refresh(); },
    onError: (e: any) => toast.error(e?.message || "Ошибка обновления"),
  });

  const createMut = useMutation({
    mutationFn: () => api.assignUser({ username: newUsername, password: newPassword, club_id: newClubId }),
    onSuccess: () => {
      toast.success("Пользователь создан");
      setShowCreate(false);
      setNewUsername("");
      setNewPassword("");
      setNewClubId("");
      refresh();
    },
    onError: (e: any) => toast.error(e?.message || "Ошибка создания"),
  });

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return !q || u.username.toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q) || (u.phone || "").toLowerCase().includes(q);
  });

  const openEdit = (u: RegisteredUser) => {
    setEditUser(u);
    setEditRole(u.role);
    setEditVerified(u.is_verified);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h2 className="font-display text-2xl flex items-center gap-2">
          <Users className="w-6 h-6 text-[#58d68d]" /> Пользователи
          <span className="text-sm text-slate-400 font-normal ml-2">({users.length})</span>
        </h2>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              className="w-full h-10 rounded-xl bg-white/5 border border-white/10 pl-9 pr-3 text-sm placeholder:text-slate-500"
              placeholder="Поиск по имени, email, телефону..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="h-10 px-4 rounded-xl border border-[#00E5FF]/40 bg-[#00E5FF]/10 text-[#00E5FF] text-sm font-medium flex items-center gap-2 shrink-0 hover:bg-[#00E5FF]/20 transition-colors"
          >
            <UserPlus className="w-4 h-4" /> Создать
          </button>
        </div>
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowCreate(false)}>
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0e1427] p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg">Создать пользователя</h3>
              <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <input className="w-full h-10 rounded-xl bg-white/5 border border-white/10 px-3 text-sm" placeholder="Логин" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} />
            <input className="w-full h-10 rounded-xl bg-white/5 border border-white/10 px-3 text-sm" placeholder="Пароль" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            <input className="w-full h-10 rounded-xl bg-white/5 border border-white/10 px-3 text-sm" placeholder="Club ID (необязательно)" value={newClubId} onChange={(e) => setNewClubId(e.target.value)} />
            <button
              onClick={() => createMut.mutate()}
              disabled={!newUsername.trim() || !newPassword.trim() || createMut.isPending}
              className="w-full h-10 rounded-xl border border-[#00E5FF]/40 bg-[#00E5FF]/10 text-[#00E5FF] font-medium disabled:opacity-40"
            >
              {createMut.isPending ? "Создание..." : "Создать"}
            </button>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setEditUser(null)}>
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0e1427] p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg">Редактировать: {editUser.username}</h3>
              <button onClick={() => setEditUser(null)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Роль</label>
              <select className="w-full h-10 rounded-xl bg-white/5 border border-white/10 px-3 text-sm" value={editRole} onChange={(e) => setEditRole(e.target.value)}>
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={editVerified} onChange={(e) => setEditVerified(e.target.checked)} className="accent-[#00E5FF]" />
              Верифицирован
            </label>
            <button
              onClick={() => updateMut.mutate()}
              disabled={updateMut.isPending}
              className="w-full h-10 rounded-xl border border-[#FF9A2F]/40 bg-[#FF9A2F]/10 text-[#FF9A2F] font-medium disabled:opacity-40"
            >
              {updateMut.isPending ? "Сохранение..." : "Сохранить"}
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-2xl border border-white/10 bg-black/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-xs text-slate-400 uppercase tracking-wider">
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Логин</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Телефон</th>
                <th className="px-4 py-3">Роль</th>
                <th className="px-4 py-3">Клуб</th>
                <th className="px-4 py-3">Статус</th>
                <th className="px-4 py-3">Дата</th>
                <th className="px-4 py-3 text-right">Действия</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-slate-500">Загрузка...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-slate-500">Пользователи не найдены</td></tr>
              ) : (
                filtered.map((u) => (
                  <tr key={u.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 text-slate-500 font-mono text-xs">{u.id}</td>
                    <td className="px-4 py-3 text-white font-medium">{u.username}</td>
                    <td className="px-4 py-3 text-slate-300">{u.email || "—"}</td>
                    <td className="px-4 py-3 text-slate-300">{u.phone || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide ${
                        u.role === "admin" ? "bg-red-500/15 text-red-400" :
                        u.role === "manager" ? "bg-[#6C5CE7]/15 text-[#6C5CE7]" :
                        u.role === "captain" ? "bg-[#FF9A2F]/15 text-[#FF9A2F]" :
                        "bg-[#58d68d]/15 text-[#58d68d]"
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{u.club_name || "—"}</td>
                    <td className="px-4 py-3">
                      {u.is_verified ? (
                        <span className="inline-block w-2 h-2 rounded-full bg-[#58d68d] shadow-[0_0_6px_#58d68d]" title="Верифицирован" />
                      ) : (
                        <span className="inline-block w-2 h-2 rounded-full bg-slate-600" title="Не верифицирован" />
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString("ru-RU") : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(u)}
                          className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-[#FF9A2F] transition-colors"
                          title="Редактировать"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Удалить пользователя ${u.username}?`)) deleteMut.mutate(u.id);
                          }}
                          className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-red-400 transition-colors"
                          title="Удалить"
                          disabled={deleteMut.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
