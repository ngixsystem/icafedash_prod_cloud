import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Star, Monitor, Clock, MapPin, Wifi } from "lucide-react";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useClub, useClubReviews } from "@/hooks/use-clubs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/hooks/use-toast";

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

export default function ClubPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: club, isLoading } = useClub(id);
  const { data: reviewsData } = useClubReviews(id);
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [openReviewDialog, setOpenReviewDialog] = useState(false);
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(0);
  const [sendingReview, setSendingReview] = useState(false);

  const handleSubmitReview = async () => {
    if (!id) return;
    if (!isAuthenticated) {
      navigate("/auth", { state: { from: { pathname: `/club/${id}` } } });
      return;
    }

    if (reviewText.trim().length < 3) {
      toast({
        title: "Ошибка",
        description: "Отзыв должен быть не короче 3 символов",
        variant: "destructive",
      });
      return;
    }

    const token = localStorage.getItem("icafe_client_token");
    if (!token) {
      navigate("/auth", { state: { from: { pathname: `/club/${id}` } } });
      return;
    }

    setSendingReview(true);
    try {
      const res = await fetch(`/api/public/clubs/${id}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          text: reviewText.trim(),
          rating: reviewRating,
        }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.message || "Не удалось отправить отзыв");

      setReviewText("");
      setReviewRating(0);
      setOpenReviewDialog(false);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["public_club_reviews", id] }),
        queryClient.invalidateQueries({ queryKey: ["public_club", id] }),
        queryClient.invalidateQueries({ queryKey: ["public_clubs"] }),
      ]);
      toast({
        title: "Спасибо!",
        description: "Ваш отзыв отправлен",
      });
    } catch (err: any) {
      toast({
        title: "Ошибка",
        description: err?.message || "Не удалось отправить отзыв",
        variant: "destructive",
      });
    } finally {
      setSendingReview(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground animate-pulse">
        Загрузка...
      </div>
    );
  }

  if (!club) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Клуб не найден
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Hero */}
      <div className="relative h-64 overflow-hidden rounded-b-[2rem]">
        <img src={club.logo || club.image} alt={club.name} className="w-full h-full object-cover" />
        {/* Dark gradient for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0b] via-[#0a0a0b]/40 to-transparent" />

        <button
          onClick={() => navigate(-1)}
          className="absolute top-10 left-6 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center cursor-pointer hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Title Overlaid on Hero Bottom */}
        <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
          <h1 className="text-4xl font-sans font-extrabold tracking-tight text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]">{club.name}</h1>
          <div className="flex items-center gap-1.5 text-warning font-black drop-shadow-md lg:mb-1">
            <Star className="w-5 h-5 fill-current" />
            <span className="text-xl">{club.rating}</span>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="px-6 py-5 relative z-10 space-y-7">
        <div className="flex items-center gap-2 text-[13px] text-white/50 -mt-2">
          <MapPin className="w-3.5 h-3.5" /> {club.address}
        </div>

        {/* Status chips */}
        <div className="flex gap-2.5 flex-wrap">
          <span className="px-4 py-1.5 rounded-full text-xs font-bold text-black bg-white">
            {club.isOpen ? "Открыто" : "Закрыто"}
          </span>
          <span className="px-4 py-1.5 rounded-full text-xs font-bold bg-[#04283b] text-[#00bfff]">
            <Monitor className="w-3.5 h-3.5 inline mr-1.5" />
            {club.pcsFree} свободно
          </span>
          <span className="px-4 py-1.5 rounded-full text-xs font-bold bg-white/5 text-white/60">
            <Wifi className="w-3.5 h-3.5 inline mr-1.5" />1 Гбит/с
          </span>
        </div>

        {/* Zones */}
        <h2 className="text-xl font-display font-black tracking-wide mb-4 mt-2">Зоны</h2>
        <div className="space-y-4 mb-8">
          {(!club.zones || club.zones.length === 0) ? (
            <div className="text-sm text-white/40">Нет информации о залах</div>
          ) : club.zones.map((zone: any, i: number) => {
            const zTotal = parseInt(zone.capacity) || 0;
            const zFree = parseInt(zone.pcsFree) || 0;
            // Progress bar shows "Busy" or simply how much is available. Based on styling, it looks like it's a fill. Let's make it the occupied percentage.
            const progressPercent = zTotal > 0 ? ((zTotal - zFree) / zTotal) * 100 : 0;

            return (
              <div
                key={i}
                onClick={() => navigate(`/booking?club=${club.id}&zone=${encodeURIComponent(zone.name)}`)}
                className="rounded-[18px] bg-[#11131a] border border-white/5 p-5 cursor-pointer hover:bg-white/5 active:scale-[0.98] transition-all group shadow-lg"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-sans font-black uppercase tracking-wide text-lg text-[#00bfff] group-hover:brightness-125 transition-all leading-none mb-1.5">
                      {zone.name}
                    </h3>
                    <div className="text-white font-sans font-bold text-sm tracking-wide">{zone.price || 0} СУМ/ЧАС</div>
                  </div>
                  <span className="text-[13px] font-semibold text-white/40 whitespace-nowrap leading-none mt-0.5">
                    <span className={zFree > 0 ? "text-emerald-400 font-bold" : ""}>{zFree} свободно</span> из {zTotal} ПК
                  </span>
                </div>
                <p className="text-[13px] text-white/50 mb-5 font-medium tracking-wide">{zone.specs}</p>
                <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000 ease-out bg-[#10b981] shadow-[0_0_12px_rgba(16,185,129,0.5)]"
                    style={{
                      width: `${progressPercent}%`
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Tariffs */}
        <h2 className="text-xl font-display font-black tracking-wide mb-4">Тарифы</h2>
        <div className="grid grid-cols-3 gap-3 mb-8">
          {(!club.tariffs || club.tariffs.length === 0) ? (
            <div className="col-span-3 text-sm text-muted-foreground">Нет информации о тарифах</div>
          ) : club.tariffs.map((t: any, i: number) => (
            <div key={i} className="rounded-lg glass p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-muted-foreground text-xs mb-1">
                <Clock className="w-3 h-3" /> {t.duration}
              </div>
              <p className="text-primary font-display font-bold text-lg">{t.price || 0} СУМ</p>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between gap-3 mb-2">
          <h2 className="text-xl font-display font-black tracking-wide">Отзывы</h2>
          <Dialog open={openReviewDialog} onOpenChange={setOpenReviewDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 text-xs">
                Оставить отзыв
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Отзыв о клубе</DialogTitle>
                <DialogDescription>
                  Оценка от 0 до 5 звезд и короткий комментарий
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <div className="text-sm mb-2 text-muted-foreground">Оценка</div>
                  <div className="flex items-center gap-1.5">
                    {Array.from({ length: 5 }).map((_, idx) => {
                      const current = idx + 1;
                      const active = current <= reviewRating;
                      return (
                        <button
                          key={`rate-${current}`}
                          type="button"
                          onClick={() => setReviewRating(current)}
                          className="rounded-md p-1 hover:bg-accent"
                        >
                          <Star className={`h-6 w-6 ${active ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} />
                        </button>
                      );
                    })}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setReviewRating(0)}
                      className="ml-1 h-8 px-2 text-xs"
                    >
                      0/5
                    </Button>
                  </div>
                </div>

                <div>
                  <div className="text-sm mb-2 text-muted-foreground">Комментарий</div>
                  <Textarea
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="Поделитесь впечатлением о клубе"
                    className="min-h-[110px]"
                    maxLength={1000}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpenReviewDialog(false)}
                  disabled={sendingReview}
                >
                  Отмена
                </Button>
                <Button
                  type="button"
                  onClick={handleSubmitReview}
                  disabled={sendingReview}
                >
                  {sendingReview ? "Отправка..." : "Отправить"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-3 mb-8">
          {(reviewsData?.reviews || []).length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/50">
              Пока нет отзывов
            </div>
          ) : (
            reviewsData?.reviews.map((review) => (
              <div key={review.id} className="rounded-xl border border-white/10 bg-[#11131a] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-semibold text-white">{review.username}</div>
                  <div className="text-xs text-white/50">{formatDate(review.created_at)}</div>
                </div>
                <div className="mt-2 flex items-center gap-1 text-amber-400">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <Star
                      key={`${review.id}-star-${idx}`}
                      className={`h-4 w-4 ${idx < review.rating ? "fill-current" : "text-white/20"}`}
                    />
                  ))}
                  <span className="ml-1 text-xs text-white/70">{review.rating}/5</span>
                </div>
                <p className="mt-3 text-sm text-white/90 whitespace-pre-wrap">{review.text}</p>
              </div>
            ))
          )}
        </div>

        {/* Book button */}
        <Button
          onClick={() => navigate(`/booking?club=${club.id}`)}
          className="w-full h-12 rounded-lg gradient-primary text-primary-foreground font-display font-bold text-base neon-glow"
          disabled={!club.isOpen}
        >
          {club.isOpen ? "Забронировать место" : "Клуб закрыт"}
        </Button>
      </div>
    </div>
  );
}
