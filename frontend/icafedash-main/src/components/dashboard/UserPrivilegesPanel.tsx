import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Camera, ChevronDown, ChevronUp, Crown, Pencil, Plus, Trash2, Upload, UserPlus, Users, X,
} from "lucide-react";
import { api, type Team, type TeamMember } from "@/lib/api";

/* ── Team detail panel (members + logo) ──────────────────────── */

function TeamDetail({ team, onClose }: { team: Team; onClose: () => void }) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [addUsername, setAddUsername] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin_team_members", team.id],
    queryFn: () => api.adminTeamMembers(team.id),
  });
  const members = data?.members || [];

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["admin_team_members", team.id] });
    qc.invalidateQueries({ queryKey: ["admin_teams"] });
  };

  const addMut = useMutation({
    mutationFn: () => api.adminAddTeamMember(team.id, addUsername),
    onSuccess: () => { toast.success("Участник добавлен"); setAddUsername(""); refresh(); },
    onError: (e: any) => toast.error(e?.message || "Ошибка"),
  });

  const removeMut = useMutation({
    mutationFn: (userId: number) => api.adminRemoveTeamMember(team.id, userId),
    onSuccess: () => { toast.success("Участник удалён"); refresh(); },
    onError: (e: any) => toast.error(e?.message || "Ошибка"),
  });

  const logoMut = useMutation({
    mutationFn: (file: File) => api.adminUploadTeamLogo(team.id, file),
    onSuccess: () => { toast.success("Логотип загружен"); refresh(); },
    onError: (e: any) => toast.error(e?.message || "Ошибка загрузки"),
  });

  const logoUrl = data?.team?.logo_url || team.logo_url;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl border border-white/10 bg-[#0e1427] p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => fileRef.current?.click()}
              className="w-12 h-12 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center overflow-hidden hover:border-[#00E5FF]/40 transition-colors group relative shrink-0"
            >
              {logoUrl ? (
                <img src={logoUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <Camera className="w-5 h-5 text-slate-500 group-hover:text-[#00E5FF]" />
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <Upload className="w-4 h-4 text-white" />
              </div>
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) logoMut.mutate(f);
                e.currentTarget.value = "";
              }}
            />
            <div>
              <h3 className="font-display text-lg text-white">{team.name}</h3>
              <p className="text-xs text-slate-400">
                {team.tag && <span className="text-[#FF9A2F]">[{team.tag}]</span>}
                {" "}капитан: {team.captain_username || "не назначен"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        {/* Add member */}
        <div className="flex gap-2">
          <input
            className="flex-1 h-10 rounded-xl bg-white/5 border border-white/10 px-3 text-sm placeholder:text-slate-500"
            placeholder="Имя пользователя для добавления"
            value={addUsername}
            onChange={(e) => setAddUsername(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addUsername.trim() && addMut.mutate()}
          />
          <button
            onClick={() => addMut.mutate()}
            disabled={!addUsername.trim() || addMut.isPending}
            className="h-10 px-4 rounded-xl border border-[#00E5FF]/40 bg-[#00E5FF]/10 text-[#00E5FF] text-sm flex items-center gap-1.5 disabled:opacity-40"
          >
            <UserPlus className="w-4 h-4" /> Добавить
          </button>
        </div>

        {/* Members list */}
        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Состав ({members.length})</p>
          {isLoading ? (
            <p className="text-sm text-slate-500 py-4 text-center">Загрузка...</p>
          ) : members.length === 0 ? (
            <p className="text-sm text-slate-500 py-4 text-center">Нет участников</p>
          ) : (
            members.map((m) => (
              <div key={m.user_id} className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2.5">
                <div className="w-8 h-8 rounded-full bg-white/5 overflow-hidden flex items-center justify-center shrink-0">
                  {m.avatar_url ? (
                    <img src={m.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs font-bold uppercase text-white/40">{m.username[0]}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm text-white truncate">{m.username}</span>
                    {m.role_in_team === "captain" && <Crown className="w-3.5 h-3.5 text-[#FF9A2F] shrink-0" />}
                  </div>
                  <p className="text-[11px] text-slate-500">{m.email || "—"}</p>
                </div>
                {m.faceit_elo != null && (
                  <span className="text-[11px] font-bold text-[#FF9A2F] shrink-0">{m.faceit_elo} ELO</span>
                )}
                <button
                  onClick={() => {
                    if (confirm(`Удалить ${m.username} из команды?`)) removeMut.mutate(m.user_id);
                  }}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-slate-500 hover:text-red-400 transition-colors shrink-0"
                  disabled={removeMut.isPending}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Edit team modal ─────────────────────────────────────────── */

function EditTeamModal({ team, onClose, onSaved }: { team: Team; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(team.name);
  const [tag, setTag] = useState(team.tag || "");

  const mut = useMutation({
    mutationFn: () => api.updateTeam(team.id, { name, tag }),
    onSuccess: () => { toast.success("Команда обновлена"); onSaved(); onClose(); },
    onError: (e: any) => toast.error(e?.message || "Ошибка"),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#0e1427] p-5 space-y-3" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg">Редактировать</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <input className="w-full h-10 rounded-xl bg-white/5 border border-white/10 px-3 text-sm" placeholder="Название" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="w-full h-10 rounded-xl bg-white/5 border border-white/10 px-3 text-sm" placeholder="Тег" value={tag} onChange={(e) => setTag(e.target.value)} />
        <button
          onClick={() => mut.mutate()}
          disabled={!name.trim() || mut.isPending}
          className="w-full h-10 rounded-xl border border-[#FF9A2F]/40 bg-[#FF9A2F]/10 text-[#FF9A2F] font-medium disabled:opacity-40"
        >
          {mut.isPending ? "Сохранение..." : "Сохранить"}
        </button>
      </div>
    </div>
  );
}

/* ── Main panel ──────────────────────────────────────────────── */

export default function UserPrivilegesPanel() {
  const queryClient = useQueryClient();
  const [teamName, setTeamName] = useState("");
  const [teamTag, setTeamTag] = useState("");
  const [selectedTeamId, setSelectedTeamId] = useState<number | "">("");
  const [selectedUserId, setSelectedUserId] = useState<number | "">("");
  const [detailTeam, setDetailTeam] = useState<Team | null>(null);
  const [editTeam, setEditTeam] = useState<Team | null>(null);

  const usersQuery = useQuery({ queryKey: ["admin_users"], queryFn: api.adminUsers });
  const teamsQuery = useQuery({ queryKey: ["admin_teams"], queryFn: api.adminTeams });

  const membersOnly = useMemo(() => (usersQuery.data || []).filter((u) => u.role !== "admin"), [usersQuery.data]);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["admin_users"] });
    queryClient.invalidateQueries({ queryKey: ["admin_teams"] });
  };

  const createTeamMutation = useMutation({
    mutationFn: () => api.createTeam({ name: teamName, tag: teamTag || undefined }),
    onSuccess: () => {
      toast.success("Команда создана");
      setTeamName("");
      setTeamTag("");
      refresh();
    },
    onError: (e: any) => toast.error(e?.message || "Не удалось создать команду"),
  });

  const assignCaptainMutation = useMutation({
    mutationFn: () => api.assignCaptain(Number(selectedTeamId), Number(selectedUserId)),
    onSuccess: () => {
      toast.success("Капитан назначен");
      refresh();
    },
    onError: (e: any) => toast.error(e?.message || "Не удалось назначить капитана"),
  });

  const deleteTeamMut = useMutation({
    mutationFn: (id: number) => api.deleteTeam(id),
    onSuccess: () => { toast.success("Команда удалена"); refresh(); },
    onError: (e: any) => toast.error(e?.message || "Ошибка удаления"),
  });

  return (
    <div className="space-y-4">
      {/* Create team */}
      <section className="rounded-2xl border border-white/10 bg-black/20 p-4">
        <h2 className="font-display text-2xl mb-3">Управление командами</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <input className="h-10 rounded-xl bg-white/5 border border-white/10 px-3" placeholder="Название команды" value={teamName} onChange={(e) => setTeamName(e.target.value)} />
          <input className="h-10 rounded-xl bg-white/5 border border-white/10 px-3" placeholder="Тег (необязательно)" value={teamTag} onChange={(e) => setTeamTag(e.target.value)} />
          <button className="h-10 rounded-xl border border-[#00E5FF]/40 bg-[#00E5FF]/10 text-[#00E5FF]" onClick={() => createTeamMutation.mutate()} disabled={!teamName.trim() || createTeamMutation.isPending}>
            Создать команду
          </button>
        </div>
      </section>

      {/* Assign captain */}
      <section className="rounded-2xl border border-white/10 bg-black/20 p-4">
        <h3 className="font-semibold flex items-center gap-2 mb-3">
          <Crown className="w-4 h-4 text-[#FF9A2F]" /> Назначить капитана
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <select className="h-10 rounded-xl bg-white/5 border border-white/10 px-3" value={selectedTeamId} onChange={(e) => setSelectedTeamId(e.target.value ? Number(e.target.value) : "")}>
            <option value="">Выберите команду</option>
            {(teamsQuery.data || []).map((team) => (
              <option value={team.id} key={team.id}>{team.name}</option>
            ))}
          </select>
          <select className="h-10 rounded-xl bg-white/5 border border-white/10 px-3" value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value ? Number(e.target.value) : "")}>
            <option value="">Выберите пользователя</option>
            {membersOnly.map((user) => (
              <option value={user.id} key={user.id}>{user.username} ({user.role})</option>
            ))}
          </select>
          <button className="h-10 rounded-xl border border-[#FF9A2F]/40 bg-[#FF9A2F]/10 text-[#FF9A2F]" onClick={() => assignCaptainMutation.mutate()} disabled={!selectedTeamId || !selectedUserId || assignCaptainMutation.isPending}>
            Назначить
          </button>
        </div>
      </section>

      {/* Teams list */}
      <section className="rounded-2xl border border-white/10 bg-black/20 p-4">
        <h3 className="font-semibold flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-[#58d68d]" /> Команды ({(teamsQuery.data || []).length})
        </h3>
        <div className="space-y-2">
          {(teamsQuery.data || []).map((team) => (
            <div key={team.id} className="rounded-xl border border-white/10 bg-black/25 p-3 flex items-center gap-3">
              {/* Logo */}
              <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
                {team.logo_url ? (
                  <img src={team.logo_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[11px] font-bold text-[#FF9A2F]">{team.tag?.slice(0, 2) || team.name.slice(0, 2).toUpperCase()}</span>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {team.name} {team.tag && <span className="text-slate-500 font-normal">[{team.tag}]</span>}
                </p>
                <p className="text-[11px] text-slate-400">
                  капитан: {team.captain_username || "не назначен"} • участников: {team.members_count}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => setDetailTeam(team)}
                  className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-[#00E5FF] transition-colors"
                  title="Состав"
                >
                  <Users className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setEditTeam(team)}
                  className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-[#FF9A2F] transition-colors"
                  title="Редактировать"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => { if (confirm(`Удалить команду ${team.name}?`)) deleteTeamMut.mutate(team.id); }}
                  className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-red-400 transition-colors"
                  title="Удалить"
                  disabled={deleteTeamMut.isPending}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Modals */}
      {detailTeam && <TeamDetail team={detailTeam} onClose={() => setDetailTeam(null)} />}
      {editTeam && <EditTeamModal team={editTeam} onClose={() => setEditTeam(null)} onSaved={refresh} />}
    </div>
  );
}
