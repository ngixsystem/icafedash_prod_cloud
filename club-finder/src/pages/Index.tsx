import { Search, TrendingUp } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel";
import ClubCard from "@/components/ClubCard";
import slideOne from "@/assets/club1.jpg";
import slideTwo from "@/assets/club2.jpg";
import slideThree from "@/assets/club3.jpg";
import brandLogo from "@/assets/frag.png";
import { useClubs } from "@/hooks/use-clubs";
import { useUserLocation } from "@/hooks/use-user-location";
import { distanceKm, hasValidCoords } from "@/lib/distance";

type ClubWithDistance = {
  id: number;
  distanceKm: number | null;
};

type BannerSlide = {
  id: number;
  title: string;
  subtitle: string;
  image: string;
};

const bannerSlides: BannerSlide[] = [
  { id: 1, title: "\u0422\u0443\u0440\u043d\u0438\u0440\u043d\u044b\u0439 \u0441\u0435\u0437\u043e\u043d", subtitle: "CS2 / Dota 2 / Valorant", image: slideOne },
  { id: 2, title: "\u041d\u043e\u0447\u043d\u044b\u0435 \u0441\u043a\u0438\u0434\u043a\u0438", subtitle: "\u041f\u0430\u043a\u0435\u0442\u044b \u0434\u043e -25% \u043f\u043e\u0441\u043b\u0435 23:00", image: slideTwo },
  { id: 3, title: "VIP-\u0437\u043e\u043d\u044b", subtitle: "\u041a\u043e\u043c\u0444\u043e\u0440\u0442\u043d\u044b\u0435 \u043a\u0430\u0431\u0438\u043d\u044b \u0434\u043b\u044f \u0441\u043a\u0432\u0430\u0434\u043e\u0432", image: slideThree },
];

export default function Index() {
  const [query, setQuery] = useState("");
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [selectedSlide, setSelectedSlide] = useState(0);
  const { data: clubs = [], isLoading } = useClubs();
  const userLocation = useUserLocation();

  const filtered = clubs.filter(
    (c) => c.name.toLowerCase().includes(query.toLowerCase()) || c.address.toLowerCase().includes(query.toLowerCase()),
  );

  const clubsWithDistance = useMemo<ClubWithDistance[]>(() => {
    return filtered.map((club) => {
      if (userLocation && hasValidCoords(club.lat, club.lng)) {
        return {
          id: club.id,
          distanceKm: distanceKm(userLocation, { lat: Number(club.lat), lng: Number(club.lng) }),
        };
      }

      return { id: club.id, distanceKm: null };
    });
  }, [filtered, userLocation]);

  const nearestClubId = useMemo(() => {
    const nearest = clubsWithDistance.filter((x) => x.distanceKm != null).sort((a, b) => (a.distanceKm as number) - (b.distanceKm as number))[0];
    return nearest?.id ?? null;
  }, [clubsWithDistance]);

  const sorted = useMemo(() => {
    const distanceMap = new Map<number, number | null>(clubsWithDistance.map((item) => [item.id, item.distanceKm]));

    return [...filtered].sort((a, b) => {
      const da = distanceMap.get(a.id);
      const db = distanceMap.get(b.id);
      if (da == null && db == null) return 0;
      if (da == null) return 1;
      if (db == null) return -1;
      return da - db;
    });
  }, [clubsWithDistance, filtered]);

  const distanceByClubId = useMemo(
    () => new Map<number, number | null>(clubsWithDistance.map((item) => [item.id, item.distanceKm])),
    [clubsWithDistance],
  );

  useEffect(() => {
    if (!carouselApi) return;

    const syncSelectedSlide = () => {
      setSelectedSlide(carouselApi.selectedScrollSnap());
    };

    syncSelectedSlide();
    carouselApi.on("select", syncSelectedSlide);
    carouselApi.on("reInit", syncSelectedSlide);

    const autoplay = setInterval(() => {
      if (carouselApi.canScrollNext()) {
        carouselApi.scrollNext();
      } else {
        carouselApi.scrollTo(0);
      }
    }, 4500);

    return () => {
      carouselApi.off("select", syncSelectedSlide);
      carouselApi.off("reInit", syncSelectedSlide);
      clearInterval(autoplay);
    };
  }, [carouselApi]);

  return (
    <div className="h-screen w-full overflow-hidden flex flex-col antialiased">
      <header className="flex items-center justify-between px-5 pt-8 pb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative w-14 h-14 bg-transparent rounded-xl flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#1E1F22] to-[#121315] opacity-50" />
            <div className="absolute -left-2 -top-2 w-6 h-6 bg-[#F5A623]/20 rotate-45" />
            <img src={brandLogo} alt="FRAG.GG" className="relative z-10 w-11 h-11 object-contain" />
          </div>
          <div className="flex flex-col">
            <h1 className="font-display text-[30px] font-bold uppercase tracking-wide leading-tight">FRAG.GG</h1>
            <span className="text-[#F5A623] text-[10px] font-bold tracking-widest uppercase">\u041a\u0438\u0431\u0435\u0440\u0441\u043f\u043e\u0440\u0442\u0438\u0432\u043d\u044b\u0439 \u043f\u043e\u0438\u0441\u043a</span>
          </div>
        </div>
        <button className="w-10 h-10 bg-[#1E1F22] rounded-xl flex items-center justify-center border border-[#2F3136] text-[#949BA4] hover:text-[#F5A623] transition-colors">
          <TrendingUp className="w-[18px] h-[18px]" />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar pb-24">
        <div className="px-5 mb-6">
          <div className="flex items-center bg-[#18191C] border border-[#2F3136] rounded-xl px-4 py-3.5 focus-within:border-[#F5A623] transition-colors shadow-inner">
            <Search className="w-[18px] h-[18px] text-[#949BA4] mr-3 shrink-0" />
            <input
              type="text"
              placeholder="\u041f\u043e\u0438\u0441\u043a \u043f\u043e \u043d\u0430\u0437\u0432\u0430\u043d\u0438\u044e \u0438\u043b\u0438 \u0430\u0434\u0440\u0435\u0441\u0443..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="bg-transparent text-sm w-full outline-none text-white placeholder-[#949BA4] font-medium"
            />
          </div>
        </div>

        <div className="px-5 mb-8">
          <Carousel setApi={setCarouselApi} opts={{ loop: true }} className="w-full">
            <CarouselContent className="ml-0">
              {bannerSlides.map((slide) => (
                <CarouselItem key={slide.id} className="pl-0">
                  <div className="relative w-full overflow-hidden rounded-2xl border border-[#2F3136] bg-[#121315] shadow-lg h-[150px] sm:h-[172px]">
                    <img src={slide.image} alt={slide.title} className="absolute inset-0 h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#121315]/90 via-[#121315]/55 to-[#121315]/20" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#121315]/85 via-transparent to-transparent" />
                    <div className="relative z-10 flex h-full flex-col justify-end p-4">
                      <span className="mb-1 inline-flex w-fit rounded-full border border-[#F5A623]/40 bg-[#121315]/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-[#F5A623]">
                        \u0411\u0430\u043d\u043d\u0435\u0440 {slide.id}
                      </span>
                      <h3 className="font-display text-[26px] leading-none font-bold uppercase tracking-wide text-white">{slide.title}</h3>
                      <p className="mt-1 text-xs font-medium text-[#D3D7DE]">{slide.subtitle}</p>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
          <div className="mt-3 flex items-center justify-center gap-2">
            {bannerSlides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                aria-label={`\u041f\u0435\u0440\u0435\u0439\u0442\u0438 \u043a \u0431\u0430\u043d\u043d\u0435\u0440\u0443 ${slide.id}`}
                onClick={() => carouselApi?.scrollTo(index)}
                className={`h-1.5 rounded-full transition-all duration-300 ${selectedSlide === index ? "w-8 bg-[#F5A623]" : "w-2 bg-[#454A52]"}`}
              />
            ))}
          </div>
        </div>

        <div className="px-5 mb-5 flex items-center">
          <div className="w-1.5 h-4 bg-[#F5A623] rounded-sm mr-3" />
          <h2 className="font-display text-lg font-bold text-[#949BA4] uppercase tracking-widest leading-none pt-1">\u041f\u043e\u043f\u0443\u043b\u044f\u0440\u043d\u044b\u0435 \u043b\u043e\u043a\u0430\u0446\u0438\u0438</h2>
          <div className="flex-1 h-[1px] bg-[#2F3136] ml-4" />
        </div>

        <div className="px-5 flex flex-col gap-5">
          {isLoading ? (
            Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-72 rounded-2xl bg-[#1E1F22] border border-[#2F3136] animate-pulse" />)
          ) : sorted.length > 0 ? (
            sorted.map((club) => (
              <ClubCard key={club.id} club={club} distanceKm={distanceByClubId.get(club.id) ?? null} isNearest={club.id === nearestClubId} />
            ))
          ) : (
            <div className="rounded-2xl border border-[#2F3136] bg-[#1E1F22] p-8 text-center text-[#949BA4]">\u041d\u0438\u0447\u0435\u0433\u043e \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d\u043e</div>
          )}
        </div>
      </main>
    </div>
  );
}
