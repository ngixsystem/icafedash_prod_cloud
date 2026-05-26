import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building, KeyRound, PenLine, Plus, RefreshCw, ShieldCheck, Users } from "lucide-react";
import { toast } from "sonner";
import { ClubEditModal } from "./ClubEditModal";

const AdminDashboard = () => {
  const qc = useQueryClient();
  const { data: clubs, isLoading } = useQuery({
    queryKey: ["admin", "clubs"],
    queryFn: api.adminClubs,
  });

  const [newClub, setNewClub] = useState({ name: "", api_key: "", cafe_id: "" });
  const [newUser, setNewUser] = useState({ username: "", password: "", club_id: "" });
  const [editingClub, setEditingClub] = useState<any>(null);
  const totalClubs = clubs?.length ?? 0;
  const configuredClubs = clubs?.filter((club: any) => club.api_key && club.cafe_id).length ?? 0;
  const clubsWithBranding = clubs?.filter((club: any) => club.logo_url).length ?? 0;

  const addClub = useMutation({
    mutationFn: (data: typeof newClub) => api.addClub(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "clubs"] });
      setNewClub({ name: "", api_key: "", cafe_id: "" });
      toast.success("Клуб успешно добавлен");
    },
    onError: (err: any) => {
      console.error("Add club error:", err);
      toast.error("Ошибка при добавлении клуба: " + (err.message || "Неизвестная ошибка"));
    },
  });

  const assignUser = useMutation({
    mutationFn: (data: typeof newUser) => api.assignUser(data),
    onSuccess: () => {
      setNewUser({ username: "", password: "", club_id: "" });
      toast.success("Пользователь привязан");
    },
    onError: (err: any) => {
      console.error("Assign user error:", err);
      toast.error("Ошибка при привязке пользователя: " + (err.message || "Неизвестная ошибка"));
    },
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-blue-300">
            <ShieldCheck className="h-3.5 w-3.5" />
            Control Panel
          </div>
          <h2 className="font-display text-3xl font-black tracking-tight text-white">Админ-панель</h2>
          <p className="mt-1 text-sm font-medium text-slate-500">Управление клубами, API-доступами и менеджерами платформы</p>
        </div>

        <Button
          size="sm"
          variant="outline"
          className="w-full rounded-2xl border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/[0.07] lg:w-auto"
          onClick={() => qc.invalidateQueries({ queryKey: ["admin", "clubs"] })}
          disabled={isLoading}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          Обновить
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="overflow-hidden rounded-3xl p-0">
          <CardContent className="p-5">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-300">
              <Building className="h-5 w-5" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">Клубы</p>
            <div className="mt-2 flex items-end gap-2">
              <span className="text-4xl font-black leading-none text-white">{totalClubs}</span>
              <span className="pb-1 text-sm font-bold text-slate-500">в системе</span>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-3xl p-0">
          <CardContent className="p-5">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-300/20 bg-emerald-300/10 text-emerald-300">
              <KeyRound className="h-5 w-5" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">API готовность</p>
            <div className="mt-2 flex items-end gap-2">
              <span className="text-4xl font-black leading-none text-white">{configuredClubs}</span>
              <span className="pb-1 text-sm font-bold text-slate-500">подключено</span>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-3xl p-0">
          <CardContent className="p-5">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-violet-300/20 bg-violet-300/10 text-violet-300">
              <Users className="h-5 w-5" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">Брендинг</p>
            <div className="mt-2 flex items-end gap-2">
              <span className="text-4xl font-black leading-none text-white">{clubsWithBranding}</span>
              <span className="pb-1 text-sm font-bold text-slate-500">с логотипом</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-300">
                <Building className="h-4 w-4" />
              </span>
              Добавить клуб
            </CardTitle>
            <CardDescription>Зарегистрируйте новый клуб в системе</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Название клуба</Label>
              <Input
                className="h-12 rounded-2xl"
                value={newClub.name}
                onChange={(e) => setNewClub({ ...newClub, name: e.target.value })}
                placeholder="CyberZone"
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Cafe ID / License ID</Label>
                <Input
                  className="h-12 rounded-2xl"
                  value={newClub.cafe_id}
                  onChange={(e) => setNewClub({ ...newClub, cafe_id: e.target.value })}
                  placeholder="12345"
                />
              </div>
              <div className="space-y-2">
                <Label>API Key</Label>
                <Input
                  className="h-12 rounded-2xl"
                  value={newClub.api_key}
                  onChange={(e) => setNewClub({ ...newClub, api_key: e.target.value })}
                  type="password"
                  placeholder="eyJ..."
                />
              </div>
            </div>
            <Button
              className="neon-button h-12 w-full rounded-2xl font-bold"
              onClick={() => addClub.mutate(newClub)}
              disabled={addClub.isPending || !newClub.name}
            >
              <Plus className="h-4 w-4 mr-2" /> Добавить клуб
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-violet-300/20 bg-violet-300/10 text-violet-300">
                <Users className="h-4 w-4" />
              </span>
              Привязать менеджера
            </CardTitle>
            <CardDescription>Создайте аккаунт и свяжите его с клубом</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Логин</Label>
                <Input
                  className="h-12 rounded-2xl"
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  placeholder="manager1"
                />
              </div>
              <div className="space-y-2">
                <Label>Пароль</Label>
                <Input
                  className="h-12 rounded-2xl"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  type="password"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Клуб</Label>
              <select
                className="h-12 w-full rounded-2xl border border-input bg-white/60 px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={newUser.club_id}
                onChange={(e) => setNewUser({ ...newUser, club_id: e.target.value })}
              >
                <option value="">Выберите клуб...</option>
                {clubs?.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <Button
              variant="secondary"
              className="h-12 w-full rounded-2xl border border-violet-300/20 bg-violet-300/10 font-bold text-violet-100 hover:bg-violet-300/15"
              onClick={() => assignUser.mutate(newUser)}
              disabled={assignUser.isPending || !newUser.username || !newUser.club_id}
            >
              Привязать к клубу
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-3xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-lg">Активные клубы</CardTitle>
            <CardDescription>Список клубов, подключенных к iCafeCloud</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative overflow-x-auto rounded-3xl border border-white/10 bg-white/[0.02]">
            <table className="w-full text-sm text-left">
              <thead className="bg-white/[0.015] text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 w-[60px]">ID</th>
                  <th className="px-4 py-3">Название</th>
                  <th className="px-4 py-3">License ID</th>
                  <th className="px-4 py-3 text-right">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {isLoading &&
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={`club-skeleton-${i}`}>
                      <td className="px-4 py-4">
                        <div className="h-3 w-8 rounded-full bg-white/10" />
                      </td>
                      <td className="px-4 py-4">
                        <div className="h-3 w-40 rounded-full bg-white/10" />
                      </td>
                      <td className="px-4 py-4">
                        <div className="h-3 w-24 rounded-full bg-white/10" />
                      </td>
                      <td className="px-4 py-4">
                        <div className="ml-auto h-8 w-8 rounded-xl bg-white/10" />
                      </td>
                    </tr>
                  ))}
                {clubs?.map((c: any) => (
                  <tr key={c.id} className="hover:bg-white/[0.035] transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-slate-400">{c.id}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3 font-medium text-white">
                        {c.logo_url ? (
                          <img src={c.logo_url} alt="logo" className="h-8 w-8 rounded-2xl border border-white/10 object-cover" />
                        ) : (
                          <span className="flex h-8 w-8 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-[11px] font-black text-slate-400">
                            {String(c.name || "?").slice(0, 1).toUpperCase()}
                          </span>
                        )}
                        <span>{c.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-400">{c.cafe_id}</td>
                    <td className="px-4 py-3 text-right">
                      <Button className="rounded-xl" variant="ghost" size="icon" onClick={() => setEditingClub(c)}>
                        <PenLine className="w-4 h-4 text-muted-foreground" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {!clubs?.length && !isLoading && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground italic">
                      Клубы еще не добавлены
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <ClubEditModal club={editingClub} isOpen={!!editingClub} onClose={() => setEditingClub(null)} />
    </div>
  );
};

export default AdminDashboard;
