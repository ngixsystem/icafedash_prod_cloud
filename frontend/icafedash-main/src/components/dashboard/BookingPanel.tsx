import { CalendarClock, Clock3, Info } from "lucide-react";

const BookingPanel = () => {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                    <CalendarClock className="h-6 w-6 text-primary" />
                    Бронирование
                </h2>
                <p className="text-muted-foreground mt-1">
                    Управление входящими бронями клиентов
                </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-6">
                <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                        <Clock3 className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                        <div className="text-sm font-semibold text-foreground">Модуль почти готов</div>
                        <p className="text-sm text-muted-foreground mt-1">
                            Вкладка добавлена. На следующем шаге можно подключить реальный список броней с действиями:
                            подтверждение, отмена и отметка о прибытии.
                        </p>
                    </div>
                </div>
            </div>

            <div className="rounded-xl border border-dashed border-border p-5">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Info className="h-4 w-4" />
                    Данные бронирований появятся здесь после подключения backend endpoint.
                </div>
            </div>
        </div>
    );
};

export default BookingPanel;
