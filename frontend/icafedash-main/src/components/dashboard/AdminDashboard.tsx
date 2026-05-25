import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Users, Building, PenLine } from "lucide-react";
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
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl tracking-tight text-slate-950">Админ-панель</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building className="h-5 w-5 text-blue-500" />
              Добавить клуб
            </CardTitle>
            <CardDescription>Зарегистрируйте новый клуб в системе</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Название клуба</Label>
              <Input
                value={newClub.name}
                onChange={(e) => setNewClub({ ...newClub, name: e.target.value })}
                placeholder="CyberZone"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cafe ID / License ID</Label>
                <Input
                  value={newClub.cafe_id}
                  onChange={(e) => setNewClub({ ...newClub, cafe_id: e.target.value })}
                  placeholder="12345"
                />
              </div>
              <div className="space-y-2">
                <Label>API Key</Label>
                <Input
                  value={newClub.api_key}
                  onChange={(e) => setNewClub({ ...newClub, api_key: e.target.value })}
                  type="password"
                  placeholder="eyJ..."
                />
              </div>
            </div>
            <Button
              className="w-full"
              onClick={() => addClub.mutate(newClub)}
              disabled={addClub.isPending || !newClub.name}
            >
              <Plus className="h-4 w-4 mr-2" /> Добавить клуб
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5 text-blue-500" />
              Привязать менеджера
            </CardTitle>
            <CardDescription>Создайте аккаунт и свяжите его с клубом</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Логин</Label>
                <Input
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  placeholder="manager1"
                />
              </div>
              <div className="space-y-2">
                <Label>Пароль</Label>
                <Input
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  type="password"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Клуб</Label>
              <select
                className="w-full h-11 rounded-xl border border-input bg-white/60 px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
              className="w-full"
              onClick={() => assignUser.mutate(newUser)}
              disabled={assignUser.isPending || !newUser.username || !newUser.club_id}
            >
              Привязать к клубу
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-lg">Активные клубы</CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={() => qc.invalidateQueries({ queryKey: ["admin", "clubs"] })}
            disabled={isLoading}
          >
            Обновить
          </Button>
        </CardHeader>
        <CardContent>
          <div className="relative overflow-x-auto rounded-2xl border border-white/70 bg-white/45 backdrop-blur-xl">
            <table className="w-full text-sm text-left">
              <thead className="bg-white/55 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 w-[60px]">ID</th>
                  <th className="px-4 py-3">Название</th>
                  <th className="px-4 py-3">License ID</th>
                  <th className="px-4 py-3 text-right">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {clubs?.map((c: any) => (
                  <tr key={c.id} className="hover:bg-white/60 transition-colors odd:bg-white/20">
                    <td className="px-4 py-3 font-mono text-xs text-slate-400">{c.id}</td>
                    <td className="px-4 py-3 font-medium flex items-center gap-3 text-slate-900">
                      {c.logo_url && <img src={c.logo_url} alt="logo" className="w-6 h-6 rounded-full object-cover" />}
                      {c.name}
                    </td>
                    <td className="px-4 py-3 text-slate-400">{c.cafe_id}</td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="icon" onClick={() => setEditingClub(c)}>
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
