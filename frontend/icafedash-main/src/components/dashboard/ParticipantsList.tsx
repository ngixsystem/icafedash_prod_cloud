import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, RegisteredUser } from "@/lib/api";
import { Users, Trash2, CheckCircle, XCircle, Search, RefreshCw, Mail } from "lucide-react";

const ParticipantsList = () => {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState("");

    const { data: users = [], isLoading, refetch } = useQuery({
        queryKey: ["admin-users"],
        queryFn: api.adminUsers,
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

    const handleDelete = (user: RegisteredUser) => {
        if (confirm(`Удалить участника "${user.username}"?`)) {
            deleteMutation.mutate(user.id);
        }
    };

    // Filter by role="member" (those from club-finder)
    const participants = users.filter(u => u.role === "member");

    const filteredUsers = participants.filter(
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
                        Участники
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Пользователи, зарегистрированные через cloud.icafedash.com
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
                    placeholder="Поиск по логину или email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                />
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
                                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Статус</th>
                                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Зарегистрирован</th>
                                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Действия</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr><td colSpan={6} className="text-center py-8">Загрузка...</td></tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">Участники не найдены</td></tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr key={user.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                                        <td className="px-4 py-3 text-muted-foreground font-mono text-xs">#{user.id}</td>
                                        <td className="px-4 py-3 font-medium text-foreground">{user.username}</td>
                                        <td className="px-4 py-3 text-muted-foreground flex items-center gap-2">
                                            <Mail className="h-3.5 w-3.5" />
                                            {user.email}
                                        </td>
                                        <td className="px-4 py-3">
                                            {user.is_verified ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium">
                                                    <CheckCircle className="h-3 w-3" /> Подтверждён
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-xs font-medium">
                                                    <XCircle className="h-3 w-3" /> Ожидает
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground text-xs">{formatDate(user.created_at)}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleToggleVerified(user)}
                                                    className={`p-1.5 rounded-md transition-colors ${user.is_verified ? "text-emerald-400 hover:bg-emerald-500/10" : "text-amber-400 hover:bg-amber-500/10"}`}
                                                >
                                                    <CheckCircle className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(user)}
                                                    className="p-1.5 rounded-md text-red-400 hover:bg-red-500/10 transition-colors"
                                                >
                                                    <Trash2 className="h-4 w-4" />
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
};

export default ParticipantsList;
