import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, formatMoney } from "@/lib/api";
import { Search, ChevronLeft, ChevronRight, User, Wallet, History, Star } from "lucide-react";

const MembersList = () => {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    // Handle search debouncing
    useState(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 500);
        return () => clearTimeout(timer);
    });

    const { data, isLoading } = useQuery({
        queryKey: ["members", page, debouncedSearch],
        queryFn: () => api.getMembers({ page, search: debouncedSearch }),
        refetchInterval: 30_000,
    });

    const members = data?.members ?? [];
    const paging = data?.paging ?? { total_pages: 1 };

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-foreground text-center sm:text-left">Участники клуба</h2>
                    <p className="text-muted-foreground text-center sm:text-left">Управление базой данных пользователей</p>
                </div>
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Поиск по аккаунту..."
                        className="w-full bg-secondary/50 border border-border rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPage(1);
                        }}
                    />
                </div>
            </div>

            <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs uppercase bg-secondary/30 text-muted-foreground border-b border-border">
                            <tr>
                                <th className="px-6 py-4 font-medium">Аккаунт / Имя</th>
                                <th className="px-6 py-4 font-medium">Баланс</th>
                                <th className="px-6 py-4 font-medium">Группа</th>
                                <th className="px-6 py-4 font-medium">Зарегистрирован</th>
                                <th className="px-6 py-4 font-medium text-right">Статус</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-6 py-4"><div className="h-4 w-32 bg-secondary rounded" /></td>
                                        <td className="px-6 py-4"><div className="h-4 w-20 bg-secondary rounded" /></td>
                                        <td className="px-6 py-4"><div className="h-4 w-24 bg-secondary rounded" /></td>
                                        <td className="px-6 py-4"><div className="h-4 w-28 bg-secondary rounded" /></td>
                                        <td className="px-6 py-4 text-right"><div className="h-4 w-16 bg-secondary rounded ml-auto" /></td>
                                    </tr>
                                ))
                            ) : members.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-10 text-center text-muted-foreground">
                                        Пользователи не найдены
                                    </td>
                                </tr>
                            ) : (
                                members.map((member) => (
                                    <tr key={member.id} className="hover:bg-secondary/20 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                                    <User className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-foreground">{member.account}</p>
                                                    <p className="text-xs text-muted-foreground">{member.name}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                <p className="font-medium text-success flex items-center gap-1.5">
                                                    <Wallet className="h-3.5 w-3.5" />
                                                    {formatMoney(member.balance)} сум
                                                </p>
                                                {member.points > 0 && (
                                                    <p className="text-xs text-primary flex items-center gap-1.5">
                                                        <Star className="h-3.5 w-3.5" />
                                                        {member.points} баллов
                                                    </p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20">
                                                {member.group || "Стандарт"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5 text-muted-foreground">
                                                <History className="h-4 w-4" />
                                                {new Date(member.created).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${member.is_active ? "bg-success/20 text-success" : "bg-destructive/10 text-destructive"
                                                }`}>
                                                {member.is_active ? "Активен" : "Заблокирован"}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between px-6 py-4 bg-secondary/10 border-t border-border">
                    <p className="text-xs text-muted-foreground">
                        Страница {page} из {paging.total_pages || 1}
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1 || isLoading}
                            className="p-1.5 rounded-lg border border-border bg-card text-muted-foreground hover:bg-secondary disabled:opacity-50"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => setPage(p => Math.min(paging.total_pages || 1, p + 1))}
                            disabled={page >= (paging.total_pages || 1) || isLoading}
                            className="p-1.5 rounded-lg border border-border bg-card text-muted-foreground hover:bg-secondary disabled:opacity-50"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MembersList;
