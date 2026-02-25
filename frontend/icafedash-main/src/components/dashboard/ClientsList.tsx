import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, RegisteredUser } from "@/lib/api";
import { Users, Shield, ShieldCheck, Trash2, CheckCircle, XCircle, UserCog, Search, RefreshCw } from "lucide-react";

const ClientsList = () => {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState("");

    const { data: users = [], isLoading, refetch } = useQuery({
        queryKey: ["admin-users"],
        queryFn: api.adminUsers,
    });

    const { data: clubs = [] } = useQuery({
        queryKey: ["admin-clubs"],
        queryFn: api.adminClubs,
    });

    const updateMutation = useMutation({
        mutationFn: ({ userId, data }: { userId: number; data: any }) => api.updateUser(userId, data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
    });

    const deleteMutation = useMutation({
        mutationFn: (userId: number) => api.deleteUser(userId),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
    });

    const handleToggleVerified = (user: RegisteredUser) => {
        updateMutation.mutate({ userId: user.id, data: { is_verified: !user.is_verified } });
    };

    const handleChangeRole = (user: RegisteredUser, role: string) => {
        updateMutation.mutate({ userId: user.id, data: { role } });
    };

    const handleAssignClub = (user: RegisteredUser, clubId: number | null) => {
        updateMutation.mutate({ userId: user.id, data: { club_id: clubId } });
    };

    const handleDelete = (user: RegisteredUser) => {
        if (confirm(`Удалить пользователя "${user.username}"?`)) {
            deleteMutation.mutate(user.id);
        }
    };

    const filteredUsers = users.filter(
        (u) =>
            u.username.toLowerCase().includes(search.toLowerCase()) ||
            (u.email && u.email.toLowerCase().includes(search.toLowerCase())) ||
            (u.phone && u.phone.includes(search))
    );

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return "—";
        const d = new Date(dateStr);
        return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <Users className="h-6 w-6 text-primary" />
                        Клиенты
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Зарегистрированные пользователи через лендинг
                    </p>
                </div>
                <button
                    onClick={() => refetch()}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm font-medium"
                >
                    <RefreshCw className="h-4 w-4" />
                    Обновить
                </button>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                    type="text"
                    placeholder="Поиск по логину, email или телефону..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-card rounded-xl border border-border p-4">
                    <p className="text-xs text-muted-foreground">Всего</p>
                    <p className="text-2xl font-bold text-foreground">{users.length}</p>
                </div>
                <div className="bg-card rounded-xl border border-border p-4">
                    <p className="text-xs text-muted-foreground">Подтверждённые</p>
                    <p className="text-2xl font-bold text-emerald-400">{users.filter(u => u.is_verified).length}</p>
                </div>
                <div className="bg-card rounded-xl border border-border p-4">
                    <p className="text-xs text-muted-foreground">Ожидают</p>
                    <p className="text-2xl font-bold text-amber-400">{users.filter(u => !u.is_verified).length}</p>
                </div>
                <div className="bg-card rounded-xl border border-border p-4">
                    <p className="text-xs text-muted-foreground">С клубом</p>
                    <p className="text-2xl font-bold text-primary">{users.filter(u => u.club_id).length}</p>
                </div>
            </div>

            {/* Table */}
            <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border bg-muted/30">
                                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">ID</th>
                                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Логин</th>
                                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</th>
                                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Телефон</th>
                                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Статус</th>
                                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Роль</th>
                                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Клуб</th>
                                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Дата</th>
                                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Действия</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={9} className="text-center py-8 text-muted-foreground">
                                        Загрузка...
                                    </td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="text-center py-8 text-muted-foreground">
                                        {search ? "Ничего не найдено" : "Нет зарегистрированных пользователей"}
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr
                                        key={user.id}
                                        className="border-b border-border/50 hover:bg-muted/20 transition-colors"
                                    >
                                        <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                                            #{user.id}
                                        </td>
                                        <td className="px-4 py-3 font-medium text-foreground flex items-center gap-2">
                                            {user.role === "admin" ? (
                                                <Shield className="h-4 w-4 text-amber-400" />
                                            ) : (
                                                <UserCog className="h-4 w-4 text-muted-foreground" />
                                            )}
                                            {user.username}
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {user.email || "—"}
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {user.phone || "—"}
                                        </td>
                                        <td className="px-4 py-3">
                                            {user.is_verified ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium">
                                                    <CheckCircle className="h-3 w-3" />
                                                    Активен
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-xs font-medium">
                                                    <XCircle className="h-3 w-3" />
                                                    Ожидает
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <select
                                                value={user.role}
                                                onChange={(e) => handleChangeRole(user, e.target.value)}
                                                className="bg-background border border-border rounded-md px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                                                disabled={user.role === "admin"}
                                            >
                                                <option value="manager">Менеджер</option>
                                                <option value="admin">Админ</option>
                                            </select>
                                        </td>
                                        <td className="px-4 py-3">
                                            <select
                                                value={user.club_id || ""}
                                                onChange={(e) => handleAssignClub(user, e.target.value ? Number(e.target.value) : null)}
                                                className="bg-background border border-border rounded-md px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                                            >
                                                <option value="">Без клуба</option>
                                                {clubs.map((club) => (
                                                    <option key={club.id} value={club.id}>
                                                        {club.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground text-xs">
                                            {formatDate(user.created_at)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleToggleVerified(user)}
                                                    title={user.is_verified ? "Деактивировать" : "Активировать"}
                                                    className={`p-1.5 rounded-md transition-colors ${user.is_verified
                                                            ? "text-emerald-400 hover:bg-emerald-500/10"
                                                            : "text-amber-400 hover:bg-amber-500/10"
                                                        }`}
                                                >
                                                    <ShieldCheck className="h-4 w-4" />
                                                </button>
                                                {user.role !== "admin" && (
                                                    <button
                                                        onClick={() => handleDelete(user)}
                                                        title="Удалить"
                                                        className="p-1.5 rounded-md text-red-400 hover:bg-red-500/10 transition-colors"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                )}
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
};

export default ClientsList;
