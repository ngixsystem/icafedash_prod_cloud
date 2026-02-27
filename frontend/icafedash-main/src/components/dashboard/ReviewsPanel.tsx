import { useQuery } from "@tanstack/react-query";
import { MessageSquare, Star } from "lucide-react";
import { api } from "@/lib/api";

function formatDate(value: string | null): string {
    if (!value) return "—";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "—";
    return parsed.toLocaleString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

const ReviewsPanel = () => {
    const { data, isLoading } = useQuery({
        queryKey: ["reviews-dashboard"],
        queryFn: api.managerReviews,
    });

    const reviews = data?.reviews ?? [];
    const summary = data?.summary ?? { count: 0, average_rating: 0 };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <MessageSquare className="h-6 w-6 text-primary" />
                        Отзывы
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Отзывы клиентов по вашему клубу
                    </p>
                </div>
                <div className="rounded-xl border border-border bg-card px-4 py-2 text-sm">
                    <span className="text-muted-foreground mr-2">Средняя оценка:</span>
                    <span className="font-semibold text-foreground">{summary.average_rating.toFixed(1)}</span>
                    <span className="text-muted-foreground ml-2">({summary.count})</span>
                </div>
            </div>

            <div className="space-y-3">
                {isLoading && (
                    <div className="rounded-xl border border-border bg-card p-6 text-muted-foreground">
                        Загрузка отзывов...
                    </div>
                )}

                {!isLoading && reviews.length === 0 && (
                    <div className="rounded-xl border border-border bg-card p-6 text-muted-foreground">
                        Пока нет отзывов
                    </div>
                )}

                {!isLoading && reviews.map((review) => (
                    <div key={review.id} className="rounded-xl border border-border bg-card p-4">
                        <div className="flex items-center justify-between gap-3">
                            <div className="font-medium text-foreground">{review.username}</div>
                            <div className="text-xs text-muted-foreground">{formatDate(review.created_at)}</div>
                        </div>

                        <div className="mt-2 flex items-center gap-1 text-amber-400">
                            {Array.from({ length: 5 }).map((_, idx) => (
                                <Star
                                    key={`${review.id}-star-${idx}`}
                                    className={`h-4 w-4 ${idx < review.rating ? "fill-current" : "text-muted-foreground/40"}`}
                                />
                            ))}
                            <span className="ml-1 text-sm text-foreground">{review.rating}/5</span>
                        </div>

                        <p className="mt-3 whitespace-pre-wrap text-sm text-foreground/90">{review.text}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ReviewsPanel;
