import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Medal, Plus, ShieldCheck, Swords, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/auth/AuthProvider";
import { api } from "@/lib/api";

function fmtDate(value: string | null) {
  if (!value) return "-";
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return "-";
  return dt.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatTournamentStatus(status: string | null | undefined) {
  switch ((status || "").toLowerCase()) {
    case "draft":
      return "черновик";
    case "open":
      return "открыт";
    case "closed":
      return "закрыт";
    case "live":
      return "идет";
    case "finished":
      return "завершен";
    case "cancelled":
      return "отменен";
    default:
      return status || "-";
  }
}

function formatRegistrationStatus(status: string | null | undefined) {
  switch ((status || "").toLowerCase()) {
    case "pending":
      return "ожидает";
    case "approved":
      return "подтверждена";
    case "rejected":
      return "отклонена";
    case "cancelled":
      return "отменена";
    default:
      return status || "-";
  }
}

function toInputDatetime(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function TournamentPanel() {
  const { isAdmin, isCaptain } = useAuth();
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showAddTeam, setShowAddTeam] = useState(false);
  const [addTeamId, setAddTeamId] = useState<number | "">("");
  const [createData, setCreateData] = useState({
    title: "",
    game: "CS2",
    team_format: "",
    location: "",
    starts_at: "",
    check_in_at: "",
    entry_fee: "",
    format: "",
    prize_pool: "",
    max_teams: 16,
    stream_url: "",
  });
  const [editData, setEditData] = useState({
    title: "",
    game: "",
    team_format: "",
    location: "",
    starts_at: "",
    check_in_at: "",
    entry_fee: "",
    format: "",
    prize_pool: "",
    max_teams: 16,
    status: "draft",
    stream_url: "",
  });

  const tournamentsQuery = useQuery({ queryKey: ["public_tournaments"], queryFn: api.publicTournaments });

  const selectedFromList = useMemo(() => {
    if (!tournamentsQuery.data || tournamentsQuery.data.length === 0) return null;
    if (selectedId) return tournamentsQuery.data.find((x) => x.id === selectedId) || tournamentsQuery.data[0];
    return tournamentsQuery.data[0];
  }, [selectedId, tournamentsQuery.data]);

  useEffect(() => {
    if (!selectedFromList) return;
    setEditData({
      title: selectedFromList.title || "",
      game: selectedFromList.game || "",
      team_format: selectedFromList.team_format || "",
      location: selectedFromList.location || "",
      starts_at: toInputDatetime(selectedFromList.starts_at),
      check_in_at: toInputDatetime(selectedFromList.check_in_at),
      entry_fee: selectedFromList.entry_fee || "",
      format: selectedFromList.format || "",
      prize_pool: selectedFromList.prize_pool || "",
      max_teams: selectedFromList.max_teams || 16,
      status: selectedFromList.status || "draft",
      stream_url: selectedFromList.stream_url || "",
    });
  }, [selectedFromList?.id]);

  const detailsQuery = useQuery({
    queryKey: ["tournament_details", selectedFromList?.id],
    queryFn: () => api.publicTournamentDetails(selectedFromList!.id),
    enabled: !!selectedFromList?.id,
  });

  const bracketQuery = useQuery({
    queryKey: ["tournament_bracket", selectedFromList?.id],
    queryFn: () => api.publicTournamentBracket(selectedFromList!.id),
    enabled: !!selectedFromList?.id,
  });

  const refreshAll = () => {
    queryClient.invalidateQueries({ queryKey: ["public_tournaments"] });
    if (selectedFromList?.id) {
      queryClient.invalidateQueries({ queryKey: ["tournament_details", selectedFromList.id] });
      queryClient.invalidateQueries({ queryKey: ["tournament_bracket", selectedFromList.id] });
    }
  };

  const createMutation = useMutation({
    mutationFn: () =>
      api.createTournament({
        title: createData.title,
        game: createData.game,
        team_format: createData.team_format,
        location: createData.location,
        starts_at: createData.starts_at,
        check_in_at: createData.check_in_at,
        entry_fee: createData.entry_fee,
        format: createData.format,
        prize_pool: createData.prize_pool,
        max_teams: Number(createData.max_teams),
        stream_url: createData.stream_url,
        status: "open",
      }),
    onSuccess: () => {
      toast.success("Турнир создан");
      setCreateData({
        title: "",
        game: "CS2",
        team_format: "",
        location: "",
        starts_at: "",
        check_in_at: "",
        entry_fee: "",
        format: "",
        prize_pool: "",
        max_teams: 16,
        stream_url: "",
      });
      refreshAll();
    },
    onError: (e: any) => toast.error(e?.message || "Не удалось создать турнир"),
  });

  const registerMutation = useMutation({
    mutationFn: (id: number) => api.captainRegisterTournament(id),
    onSuccess: () => {
      toast.success("Заявка на регистрацию команды отправлена");
      refreshAll();
    },
    onError: (e: any) => toast.error(e?.message || "Не удалось зарегистрировать команду"),
  });

  const approveMutation = useMutation({
    mutationFn: ({ tournamentId, registrationId }: { tournamentId: number; registrationId: number }) =>
      api.approveTournamentRegistration(tournamentId, registrationId),
    onSuccess: () => {
      toast.success("Регистрация подтверждена");
      refreshAll();
    },
    onError: (e: any) => toast.error(e?.message || "Не удалось подтвердить регистрацию"),
  });

  const generateBracketMutation = useMutation({
    mutationFn: (tournamentId: number) => api.generateTournamentBracket(tournamentId),
    onSuccess: () => {
      toast.success("Сетка сгенерирована");
      refreshAll();
    },
    onError: (e: any) => toast.error(e?.message || "Не удалось сгенерировать сетку"),
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      api.updateTournament(selectedFromList!.id, {
        title: editData.title,
        game: editData.game,
        team_format: editData.team_format,
        location: editData.location,
        starts_at: editData.starts_at || null,
        check_in_at: editData.check_in_at || null,
        entry_fee: editData.entry_fee,
        format: editData.format,
        prize_pool: editData.prize_pool,
        max_teams: Number(editData.max_teams),
        status: editData.status,
        stream_url: editData.stream_url,
      }),
    onSuccess: () => {
      toast.success("Турнир обновлен");
      refreshAll();
    },
    onError: (e: any) => toast.error(e?.message || "Не удалось обновить турнир"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.deleteTournament(id),
    onSuccess: () => {
      toast.success("Турнир удален");
      setSelectedId(null);
      refreshAll();
    },
    onError: (e: any) => toast.error(e?.message || "Не удалось удалить турнир"),
  });

  const registrationStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => api.updateTournament(id, { status }),
    onSuccess: () => {
      toast.success("Статус регистрации обновлен");
      refreshAll();
    },
    onError: (e: any) => toast.error(e?.message || "Не удалось обновить статус регистрации"),
  });

  const teamsQuery = useQuery({ queryKey: ["admin_teams"], queryFn: api.adminTeams, enabled: isAdmin });

  const addTeamMutation = useMutation({
    mutationFn: (teamId: number) => api.addTournamentTeam(selectedFromList!.id, teamId),
    onSuccess: () => {
      toast.success("Команда добавлена в турнир");
      setShowAddTeam(false);
      setAddTeamId("");
      refreshAll();
    },
    onError: (e: any) => toast.error(e?.message || "Не удалось добавить команду"),
  });

  const removeRegMutation = useMutation({
    mutationFn: (regId: number) => api.removeTournamentTeam(selectedFromList!.id, regId),
    onSuccess: () => {
      toast.success("Команда удалена из турнира");
      refreshAll();
    },
    onError: (e: any) => toast.error(e?.message || "Не удалось удалить команду"),
  });

  const isCreateDisabled =
    createMutation.isPending ||
    !createData.title.trim() ||
    !createData.game.trim() ||
    !createData.team_format.trim() ||
    !createData.location.trim() ||
    !createData.starts_at.trim() ||
    !createData.check_in_at.trim() ||
    !createData.entry_fee.trim() ||
    !createData.format.trim();

  return (
    <div className="space-y-6">
      {isAdmin ? (
        <section className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <h2 className="font-display text-2xl mb-4 text-white">Управление турнирами</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            <input className="h-11 rounded-xl bg-white/5 border border-white/10 px-3" placeholder="Название" value={createData.title} onChange={(e) => setCreateData((p) => ({ ...p, title: e.target.value }))} />
            <input className="h-11 rounded-xl bg-white/5 border border-white/10 px-3" placeholder="Дисциплина" value={createData.game} onChange={(e) => setCreateData((p) => ({ ...p, game: e.target.value }))} />
            <input className="h-11 rounded-xl bg-white/5 border border-white/10 px-3" placeholder="Формат (2v2 • 24 команд)" value={createData.team_format} onChange={(e) => setCreateData((p) => ({ ...p, team_format: e.target.value }))} />
            <input className="h-11 rounded-xl bg-white/5 border border-white/10 px-3" placeholder="Локация" value={createData.location} onChange={(e) => setCreateData((p) => ({ ...p, location: e.target.value }))} />
            <input className="h-11 rounded-xl bg-white/5 border border-white/10 px-3" type="datetime-local" placeholder="Дата старта" value={createData.starts_at} onChange={(e) => setCreateData((p) => ({ ...p, starts_at: e.target.value }))} />
            <input className="h-11 rounded-xl bg-white/5 border border-white/10 px-3" type="datetime-local" placeholder="Дата чек-ина" value={createData.check_in_at} onChange={(e) => setCreateData((p) => ({ ...p, check_in_at: e.target.value }))} />
            <input className="h-11 rounded-xl bg-white/5 border border-white/10 px-3" placeholder="Взнос" value={createData.entry_fee} onChange={(e) => setCreateData((p) => ({ ...p, entry_fee: e.target.value }))} />
            <input className="h-11 rounded-xl bg-white/5 border border-white/10 px-3" placeholder="Сетка (Группы + плей-офф, BO3)" value={createData.format} onChange={(e) => setCreateData((p) => ({ ...p, format: e.target.value }))} />
            <input className="h-11 rounded-xl bg-white/5 border border-white/10 px-3" placeholder="Призовой фонд" value={createData.prize_pool} onChange={(e) => setCreateData((p) => ({ ...p, prize_pool: e.target.value }))} />
            <input className="h-11 rounded-xl bg-white/5 border border-white/10 px-3" type="number" min={2} placeholder="Команд" value={createData.max_teams} onChange={(e) => setCreateData((p) => ({ ...p, max_teams: Number(e.target.value || 2) }))} />
            <input className="h-11 rounded-xl bg-white/5 border border-white/10 px-3" placeholder="Ссылка на стрим (Twitch/YouTube)" value={createData.stream_url} onChange={(e) => setCreateData((p) => ({ ...p, stream_url: e.target.value }))} />
          </div>
          <button className="mt-3 h-10 px-4 rounded-xl bg-[#00E5FF]/15 border border-[#00E5FF]/40 text-[#00E5FF]" onClick={() => createMutation.mutate()} disabled={isCreateDisabled}>
            Создать турнир
          </button>
        </section>
      ) : null}

      <div className="grid grid-cols-1 xl:grid-cols-[320px,1fr] gap-4">
        <section className="rounded-2xl border border-white/10 bg-black/20 p-3">
          <h3 className="font-display text-xl mb-3">Турниры</h3>
          <div className="space-y-2 max-h-[520px] overflow-auto pr-1">
            {(tournamentsQuery.data || []).map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedId(item.id)}
                className={`w-full text-left rounded-xl border px-3 py-2 transition ${selectedFromList?.id === item.id ? "border-[#00E5FF]/50 bg-[#00E5FF]/10" : "border-white/10 bg-white/5 hover:bg-white/10"}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-white truncate">{item.title}</p>
                  <span className="text-[10px] uppercase text-slate-400">{formatTournamentStatus(item.status)}</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">{item.game} • {item.registered_teams}/{item.max_teams}</p>
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-black/20 p-4">
          {!selectedFromList ? (
            <p className="text-slate-400">Турниров пока нет</p>
          ) : (
            <>
              <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                <div>
                  <h3 className="font-display text-3xl leading-none text-white">{selectedFromList.title}</h3>
                  <p className="text-sm text-slate-400 mt-2">{selectedFromList.game} • {selectedFromList.location || "Локация не указана"}</p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-[#2f2f2f] bg-black/40 px-3 py-1.5 text-xs text-[#FF9A2F]">
                  <Medal className="w-3.5 h-3.5" /> {selectedFromList.prize_pool || "Призовой фонд не указан"}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <p className="text-xs text-slate-400">Старт</p>
                  <p className="text-sm font-semibold">{fmtDate(selectedFromList.starts_at)}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <p className="text-xs text-slate-400">Формат команд</p>
                  <p className="text-sm font-semibold">{selectedFromList.team_format || "-"}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <p className="text-xs text-slate-400">Чек-ин</p>
                  <p className="text-sm font-semibold">{fmtDate(selectedFromList.check_in_at)}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <p className="text-xs text-slate-400">Сетка</p>
                  <p className="text-sm font-semibold">{selectedFromList.format}</p>
                </div>
              </div>
              <div className="mb-4 rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-xs text-slate-400">Взнос</p>
                <p className="text-sm font-semibold">{selectedFromList.entry_fee || "-"}</p>
              </div>

              {isCaptain ? (
                <button className="h-10 px-4 rounded-xl bg-[#6C5CE7]/20 border border-[#6C5CE7]/40 text-[#c7bbff] mb-4" onClick={() => registerMutation.mutate(selectedFromList.id)} disabled={registerMutation.isPending}>
                  Зарегистрировать мою команду
                </button>
              ) : null}

              {isAdmin && selectedFromList ? (
                <button className="h-10 px-4 rounded-xl bg-[#00E5FF]/12 border border-[#00E5FF]/40 text-[#00E5FF] mb-4 ml-2" onClick={() => generateBracketMutation.mutate(selectedFromList.id)} disabled={generateBracketMutation.isPending}>
                  Сгенерировать сетку
                </button>
              ) : null}

              {isAdmin && selectedFromList ? (
                <div className="mb-4 rounded-xl border border-white/10 bg-white/5 p-3">
                  <p className="text-xs text-slate-400 mb-3">Панель администратора</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-2 mb-2">
                    <input className="h-10 rounded-lg bg-black/30 border border-white/10 px-3" placeholder="Название" value={editData.title} onChange={(e) => setEditData((p) => ({ ...p, title: e.target.value }))} />
                    <input className="h-10 rounded-lg bg-black/30 border border-white/10 px-3" placeholder="Дисциплина" value={editData.game} onChange={(e) => setEditData((p) => ({ ...p, game: e.target.value }))} />
                    <input className="h-10 rounded-lg bg-black/30 border border-white/10 px-3" placeholder="Формат команд" value={editData.team_format} onChange={(e) => setEditData((p) => ({ ...p, team_format: e.target.value }))} />
                    <input className="h-10 rounded-lg bg-black/30 border border-white/10 px-3" placeholder="Локация" value={editData.location} onChange={(e) => setEditData((p) => ({ ...p, location: e.target.value }))} />
                    <input className="h-10 rounded-lg bg-black/30 border border-white/10 px-3" type="datetime-local" value={editData.starts_at} onChange={(e) => setEditData((p) => ({ ...p, starts_at: e.target.value }))} />
                    <input className="h-10 rounded-lg bg-black/30 border border-white/10 px-3" type="datetime-local" value={editData.check_in_at} onChange={(e) => setEditData((p) => ({ ...p, check_in_at: e.target.value }))} />
                    <input className="h-10 rounded-lg bg-black/30 border border-white/10 px-3" placeholder="Взнос" value={editData.entry_fee} onChange={(e) => setEditData((p) => ({ ...p, entry_fee: e.target.value }))} />
                    <input className="h-10 rounded-lg bg-black/30 border border-white/10 px-3" placeholder="Сетка" value={editData.format} onChange={(e) => setEditData((p) => ({ ...p, format: e.target.value }))} />
                    <input className="h-10 rounded-lg bg-black/30 border border-white/10 px-3" placeholder="Призовой фонд" value={editData.prize_pool} onChange={(e) => setEditData((p) => ({ ...p, prize_pool: e.target.value }))} />
                    <input className="h-10 rounded-lg bg-black/30 border border-white/10 px-3" type="number" min={2} value={editData.max_teams} onChange={(e) => setEditData((p) => ({ ...p, max_teams: Number(e.target.value || 2) }))} />
                    <input className="h-10 rounded-lg bg-black/30 border border-white/10 px-3" placeholder="Ссылка на стрим" value={editData.stream_url} onChange={(e) => setEditData((p) => ({ ...p, stream_url: e.target.value }))} />
                    <select className="h-10 rounded-lg bg-black/30 border border-white/10 px-3" value={editData.status} onChange={(e) => setEditData((p) => ({ ...p, status: e.target.value }))}>
                      <option value="draft">Черновик</option>
                      <option value="open">Открыт</option>
                      <option value="closed">Закрыт</option>
                      <option value="live">Идет</option>
                      <option value="finished">Завершен</option>
                      <option value="cancelled">Отменен</option>
                    </select>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button className="h-9 px-3 rounded-lg border border-[#00E5FF]/40 bg-[#00E5FF]/10 text-[#00E5FF]" onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
                      Сохранить изменения
                    </button>
                    <button className="h-9 px-3 rounded-lg border border-[#58d68d]/40 bg-[#58d68d]/10 text-[#58d68d]" onClick={() => registrationStatusMutation.mutate({ id: selectedFromList.id, status: "open" })} disabled={registrationStatusMutation.isPending}>
                      Открыть регистрацию
                    </button>
                    <button className="h-9 px-3 rounded-lg border border-[#f39c12]/40 bg-[#f39c12]/10 text-[#f39c12]" onClick={() => registrationStatusMutation.mutate({ id: selectedFromList.id, status: "closed" })} disabled={registrationStatusMutation.isPending}>
                      Закрыть регистрацию
                    </button>
                    <button className="h-9 px-3 rounded-lg border border-rose-500/40 bg-rose-500/10 text-rose-400" onClick={() => deleteMutation.mutate(selectedFromList.id)} disabled={deleteMutation.isPending}>
                      Удалить турнир
                    </button>
                  </div>
                </div>
              ) : null}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="rounded-xl border border-white/10 bg-[#0c1020]/55 p-3">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-[#00E5FF]" /> Регистрации</h4>
                    {isAdmin && (
                      <button className="text-xs rounded-md border border-[#00E5FF]/40 bg-[#00E5FF]/10 px-2 py-1 text-[#00E5FF] flex items-center gap-1" onClick={() => setShowAddTeam(!showAddTeam)}>
                        {showAddTeam ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                        {showAddTeam ? "Отмена" : "Добавить"}
                      </button>
                    )}
                  </div>
                  {showAddTeam && isAdmin && (
                    <div className="flex gap-2 mb-3">
                      <select
                        className="flex-1 h-9 rounded-lg bg-black/30 border border-white/10 px-2 text-sm"
                        value={addTeamId}
                        onChange={(e) => setAddTeamId(e.target.value ? Number(e.target.value) : "")}
                      >
                        <option value="">Выберите команду</option>
                        {(teamsQuery.data || []).map((t) => (
                          <option key={t.id} value={t.id}>{t.name} {t.tag ? `[${t.tag}]` : ""}</option>
                        ))}
                      </select>
                      <button
                        className="h-9 px-3 rounded-lg border border-[#58d68d]/40 bg-[#58d68d]/10 text-[#58d68d] text-xs"
                        disabled={!addTeamId || addTeamMutation.isPending}
                        onClick={() => addTeamId && addTeamMutation.mutate(Number(addTeamId))}
                      >
                        Добавить
                      </button>
                    </div>
                  )}
                  <div className="space-y-2 max-h-64 overflow-auto pr-1">
                    {(detailsQuery.data?.registrations || []).map((reg) => (
                      <div key={reg.id} className="rounded-lg border border-white/10 bg-black/25 p-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-white">{reg.team_name}</p>
                            <p className="text-[11px] text-slate-400">{formatRegistrationStatus(reg.status)} • {fmtDate(reg.created_at)}</p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {isAdmin && reg.status === "pending" && (
                              <button className="text-xs rounded-md border border-[#58d68d]/40 bg-[#58d68d]/10 px-2 py-1 text-[#58d68d]" onClick={() => approveMutation.mutate({ tournamentId: selectedFromList.id, registrationId: reg.id })}>
                                Подтвердить
                              </button>
                            )}
                            {isAdmin && (
                              <button className="rounded-md border border-rose-500/40 bg-rose-500/10 p-1.5 text-rose-400 hover:bg-rose-500/20" onClick={() => removeRegMutation.mutate(reg.id)} disabled={removeRegMutation.isPending}>
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-[#0c1020]/55 p-3">
                  <h4 className="font-semibold flex items-center gap-2 mb-3"><Swords className="w-4 h-4 text-[#6C5CE7]" /> Сетка</h4>
                  <div className="space-y-2 max-h-64 overflow-auto pr-1">
                    {(bracketQuery.data?.matches || []).length === 0 ? (
                      <p className="text-sm text-slate-400">Сетка еще не сгенерирована</p>
                    ) : (
                      (bracketQuery.data?.matches || []).map((match) => (
                        <div key={match.id} className="rounded-lg border border-white/10 bg-black/25 p-2.5">
                          <p className="text-[11px] text-slate-400 mb-1">Раунд {match.round_number} • Матч {match.match_order}</p>
                          <p className="text-sm text-white">{match.team1_name || "Ожидается"} vs {match.team2_name || "Ожидается"}</p>
                          <p className="text-[11px] text-[#58d68d]">Победитель: {match.winner_team_name || "-"}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
