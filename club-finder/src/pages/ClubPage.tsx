import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Star, Monitor, Clock, MapPin, Wifi, ChevronDown, ChevronUp, Navigation } from "lucide-react";
import { useEffect, useState } from "react";
import type { TouchEvent } from "react";
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
  const [expandedReviews, setExpandedReviews] = useState<Record<number, boolean>>({});
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [heroFullScreen, setHeroFullScreen] = useState(false);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);

  const heroPhotos = club?.photos?.length ? club.photos : [club?.main_photo_url || club?.logo || (club as any)?.image].filter(Boolean);

  useEffect(() => {
    setActivePhotoIndex(0);
    setHeroFullScreen(false);
  }, [id, club?.id]);

  const goPrevPhoto = () => {
    if (heroPhotos.length < 2) return;
    setActivePhotoIndex((prev) => (prev === 0 ? heroPhotos.length - 1 : prev - 1));
  };

  const goNextPhoto = () => {
    if (heroPhotos.length < 2) return;
    setActivePhotoIndex((prev) => (prev === heroPhotos.length - 1 ? 0 : prev + 1));
  };

  const onHeroTouchStart = (e: TouchEvent) => {
    const touch = e.changedTouches[0];
    setTouchStart({ x: touch.clientX, y: touch.clientY });
  };

  const onHeroTouchEnd = (e: TouchEvent, fromFullScreen: boolean) => {
    if (!touchStart) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStart.x;
    const dy = touch.clientY - touchStart.y;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (absDx > absDy && absDx > 35) {
      if (dx < 0) goNextPhoto();
      else goPrevPhoto();
    } else if (absDy > absDx && absDy > 45) {
      if (dy > 0 && !fromFullScreen) setHeroFullScreen(true);
      if (dy < 0 && fromFullScreen) setHeroFullScreen(false);
    }
    setTouchStart(null);
  };

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
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text: reviewText.trim(), rating: reviewRating }),
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
      toast({ title: "Спасибо!", description: "Ваш отзыв отправлен" });
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
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground animate-pulse">Загрузка...</div>;
  }

  if (!club) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Клуб не найден</div>;
  }

  const hasValidClubCoords =
    Number.isFinite(club.lat) &&
    Number.isFinite(club.lng) &&
    Math.abs(Number(club.lat)) <= 90 &&
    Math.abs(Number(club.lng)) <= 180 &&
    !(Number(club.lat) === 0 && Number(club.lng) === 0);

  const openYandexRoute = () => {
    if (!hasValidClubCoords) return;
    const lat = Number(club.lat);
    const lng = Number(club.lng);
    const url = `https://yandex.uz/maps/?rtext=~${encodeURIComponent(`${lat},${lng}`)}&rtt=auto`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="min-h-screen pb-24 bg-[#0f1115]">
      <div
        className="relative h-64 overflow-hidden rounded-b-[2rem]"
        onTouchStart={onHeroTouchStart}
        onTouchEnd={(e) => onHeroTouchEnd(e, false)}
      >
        <img src={heroPhotos[activePhotoIndex] || club.logo || (club as any).image} alt={club.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#090b10] via-[#090b10]/45 to-transparent" />

        <button
          onClick={() => navigate(-1)}
          className="absolute top-10 left-6 w-10 h-10 rounded-full bg-black/45 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {heroPhotos.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
            {heroPhotos.map((_, idx) => (
              <button
                key={`hero-dot-${idx}`}
                type="button"
                onClick={() => setActivePhotoIndex(idx)}
                className={`h-1.5 rounded-full transition-all ${idx === activePhotoIndex ? "w-6 bg-[#FF7800]" : "w-2 bg-white/40"}`}
              />
            ))}
          </div>
        )}

        <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
          <h1
            className="text-[42px] font-display font-bold uppercase tracking-wide text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)] leading-none"
            style={{ fontFamily: "Oswald, sans-serif" }}
          >
            {club.name}
          </h1>
          <div className="flex items-center gap-1.5 text-[#FEE75C] font-black drop-shadow-md">
            <Star className="w-5 h-5 fill-current" />
            <span className="text-2xl font-display leading-none">{club.rating}</span>
          </div>
        </div>
      </div>

      {heroFullScreen && (
        <div className="fixed inset-0 z-[80] bg-black/95" onTouchStart={onHeroTouchStart} onTouchEnd={(e) => onHeroTouchEnd(e, true)}>
          <img src={heroPhotos[activePhotoIndex] || club.logo || (club as any).image} alt={club.name} className="w-full h-full object-contain" />
        </div>
      )}

      <div className="px-6 py-5 space-y-7">
        <div className="flex items-center gap-2 text-[13px] text-white/60 -mt-2">
          <MapPin className="w-3.5 h-3.5 text-[#FF7800]" /> {club.address}
        </div>

        <div className="flex gap-2.5 flex-wrap">
          <span className="px-4 py-1.5 rounded-full text-xs font-bold text-black bg-white">{club.isOpen ? "Открыто" : "Закрыто"}</span>
          <span className="px-4 py-1.5 rounded-full text-xs font-bold bg-[#1b1b1b] text-[#FF9A2F] border border-[#2f2f2f]">
            <Monitor className="w-3.5 h-3.5 inline mr-1.5" />
            {club.pcsFree} свободно
          </span>
          <span className="px-4 py-1.5 rounded-full text-xs font-bold bg-white/5 text-white/60">
            <Wifi className="w-3.5 h-3.5 inline mr-1.5" />1 Гбит/с
          </span>
          <button
            type="button"
            onClick={openYandexRoute}
            disabled={!hasValidClubCoords}
            className="px-4 py-1.5 rounded-full text-xs font-bold bg-[#1a1a1a] text-white/85 border border-[#2f2f2f] hover:bg-[#202020] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Navigation className="w-3.5 h-3.5 inline mr-1.5" />
            Маршрут
          </button>
        </div>

        <h2 className="text-[34px] font-display font-bold tracking-wide mt-2 leading-none">Зоны</h2>
        <div className="space-y-4 mb-8">
          {!club.zones || club.zones.length === 0 ? (
            <div className="text-sm text-white/45">Нет информации о залах</div>
          ) : (
            club.zones.map((zone: any, i: number) => {
              const zTotal = parseInt(zone.capacity) || 0;
              const zFree = parseInt(zone.pcsFree) || 0;
              const busyPercent = zTotal > 0 ? ((zTotal - zFree) / zTotal) * 100 : 0;

              return (
                <div
                  key={i}
                  onClick={() => navigate(`/booking?club=${club.id}&zone=${encodeURIComponent(zone.name)}`)}
                  className="rounded-2xl bg-[linear-gradient(180deg,#151515_0%,#101010_100%)] border border-[#2f2f2f] p-5 cursor-pointer transition-all hover:border-[#FF7800]/45 hover:shadow-[0_10px_30px_rgba(255,120,0,0.1)]"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-display uppercase tracking-wide text-[30px] text-[#FF9A2F] leading-none mb-2">{zone.name}</h3>
                      <div className="text-white font-display text-[30px] leading-none">{zone.price || 0} СУМ/ЧАС</div>
                    </div>
                    <span className="text-[22px] text-white/50 whitespace-nowrap leading-none pt-1">
                      <span className={zFree > 0 ? "text-[#57F287] font-display" : "text-white/60 font-display"}>{zFree} свободно</span> из {zTotal} ПК
                    </span>
                  </div>

                  <p className="text-[20px] text-white/60 mb-5 leading-snug">{zone.specs || "Характеристики не указаны"}</p>

                  <div className="w-full h-2 rounded-full bg-[#272727] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000 ease-out"
                      style={{
                        width: `${busyPercent}%`,
                        background: "linear-gradient(90deg, #22c55e 0%, #f0b429 52%, #ef4444 100%)",
                      }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>

        <h2 className="text-[34px] font-display font-bold tracking-wide mb-4 leading-none">Тарифы</h2>
        <div className="grid grid-cols-2 gap-3 mb-8">
          {!club.tariffs || club.tariffs.length === 0 ? (
            <div className="col-span-3 text-sm text-muted-foreground">Нет информации о тарифах</div>
          ) : (
            club.tariffs.map((t: any, i: number) => (
              <div
                key={i}
                className="rounded-2xl bg-[linear-gradient(180deg,#151923_0%,#11151e_100%)] border border-[#2F3136] px-3.5 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
              >
                <div className="flex items-center justify-center gap-1.5 text-[#9aa1ab] text-[10px] uppercase tracking-wider font-semibold mb-2">
                  <Clock className="w-3 h-3" /> {t.duration}
                </div>
                <p className="text-center text-[#FF7800] font-display text-[26px] leading-none drop-shadow-[0_0_10px_rgba(255,120,0,0.28)]">
                  {t.price || 0} <span className="text-[18px]">СУМ</span>
                </p>
              </div>
            ))
          )}
        </div>

        <div className="flex items-center justify-between gap-3 mb-2">
          <h2 className="text-[34px] font-display font-bold tracking-wide leading-none">Отзывы</h2>
          <Dialog open={openReviewDialog} onOpenChange={setOpenReviewDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 text-xs">
                Оставить отзыв
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Отзыв о клубе</DialogTitle>
                <DialogDescription>Оценка от 0 до 5 звезд и короткий комментарий</DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <div className="text-sm mb-2 text-muted-foreground">Оценка</div>
                  <div className="flex items-center gap-1.5">
                    {Array.from({ length: 5 }).map((_, idx) => {
                      const current = idx + 1;
                      const active = current <= reviewRating;
                      return (
                        <button key={`rate-${current}`} type="button" onClick={() => setReviewRating(current)} className="rounded-md p-1 hover:bg-accent">
                          <Star className={`h-6 w-6 ${active ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} />
                        </button>
                      );
                    })}
                    <Button type="button" variant="ghost" size="sm" onClick={() => setReviewRating(0)} className="ml-1 h-8 px-2 text-xs">
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
                <Button type="button" variant="outline" onClick={() => setOpenReviewDialog(false)} disabled={sendingReview}>
                  Отмена
                </Button>
                <Button type="button" onClick={handleSubmitReview} disabled={sendingReview}>
                  {sendingReview ? "Отправка..." : "Отправить"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-3 mb-8">
          {(reviewsData?.reviews || []).length === 0 ? (
            <div className="rounded-xl border border-[#2f2f2f] bg-[#121212] p-4 text-sm text-white/50">Пока нет отзывов</div>
          ) : (
            reviewsData?.reviews.map((review) => (
              <div key={review.id} className="rounded-xl border border-[#2f2f2f] bg-[linear-gradient(180deg,#151515_0%,#101010_100%)] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-semibold text-white">{review.username}</div>
                  <div className="text-xs text-[#8f8f8f]">{formatDate(review.created_at)}</div>
                </div>
                <div className="mt-2 flex items-center gap-1 text-amber-400">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <Star key={`${review.id}-star-${idx}`} className={`h-4 w-4 ${idx < review.rating ? "fill-current" : "text-white/20"}`} />
                  ))}
                  <span className="ml-1 text-xs text-white/70">{review.rating}/5</span>
                </div>
                <p className="mt-3 text-sm text-white/90 whitespace-pre-wrap">
                  {expandedReviews[review.id] ? review.text : review.text.length > 90 ? `${review.text.slice(0, 90)}...` : review.text}
                </p>
                <div className="mt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedReviews((prev) => ({
                        ...prev,
                        [review.id]: !prev[review.id],
                      }))
                    }
                    className="inline-flex items-center gap-1 text-xs text-[#FF7800] hover:text-[#ffa145] transition-colors"
                  >
                    {expandedReviews[review.id] ? "Свернуть" : "Развернуть"}
                    {expandedReviews[review.id] ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <Button onClick={() => navigate(`/booking?club=${club.id}`)} className="w-full h-12 rounded-xl font-display text-xl" disabled={!club.isOpen}>
          {club.isOpen ? "Забронировать место" : "Клуб закрыт"}
        </Button>
      </div>
    </div>
  );
}
