import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import screenshot1 from "@/assets/screenshot-1.jpg";
import screenshot2 from "@/assets/screenshot-2.jpg";
import screenshot3 from "@/assets/screenshot-3.jpg";

const slides = [
  { src: screenshot1, alt: "Обзор — финансовая аналитика и статистика клуба" },
  { src: screenshot2, alt: "Авторизация — безопасный вход в систему" },
  { src: screenshot3, alt: "Мониторинг — интерактивная карта ПК в реальном времени" },
];

const Showcase = () => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const go = (dir: number) =>
    setCurrent((prev) => (prev + dir + slides.length) % slides.length);

  return (
    <section className="py-16 md:py-24 relative">
      <div className="container px-4" style={{ perspective: "1200px" }}>
        <motion.div
          initial={{ opacity: 0, y: 50, rotateX: 25, scale: 0.9 }}
          whileInView={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, type: "spring", bounce: 0.3 }}
          className="relative rounded-2xl overflow-hidden glow-box neon-border shadow-[0_20px_60px_-15px_hsl(170_80%_50%_/_0.3)]"
          style={{ transformOrigin: "bottom center" }}
        >
          {/* Slides */}
          <div className="relative aspect-[16/9] bg-background">
            <AnimatePresence mode="wait">
              <motion.img
                key={current}
                src={slides[current].src}
                alt={slides[current].alt}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.6 }}
                className="absolute inset-0 w-full h-full object-cover"
              />
            </AnimatePresence>

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-background/30 via-transparent to-background/30" />

            {/* Nav arrows */}
            <button
              onClick={() => go(-1)}
              className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background/60 backdrop-blur-sm border border-primary/20 text-foreground hover:bg-primary/20 hover:border-primary/40 transition-all duration-300"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => go(1)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background/60 backdrop-blur-sm border border-primary/20 text-foreground hover:bg-primary/20 hover:border-primary/40 transition-all duration-300"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Dots */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`h-2.5 rounded-full transition-all duration-300 ${i === current ? "bg-primary w-8 glow-box" : "bg-muted-foreground/40 w-2.5"
                    }`}
                />
              ))}
            </div>
          </div>

          {/* Caption */}
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 pointer-events-none">
            <h3 className="font-display text-xl md:text-2xl font-bold text-foreground mb-2">
              Управляйте как профессионал
            </h3>
            <p className="text-muted-foreground text-sm md:text-base max-w-lg">
              Современный интерфейс для контроля каждого аспекта вашей кибер-арены
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Showcase;
