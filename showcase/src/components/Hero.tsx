import { motion } from "framer-motion";
import logo from "@/assets/logo.png";
import { Link } from "react-router-dom";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Multiple radial glows */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_hsl(170_80%_50%_/_0.1)_0%,_transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_hsl(200_80%_60%_/_0.06)_0%,_transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_hsl(170_80%_50%_/_0.04)_0%,_transparent_50%)]" />

      <div className="container relative z-10 flex flex-col items-center text-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="mb-8 relative"
        >
          <div className="absolute inset-0 blur-3xl bg-primary/10 rounded-full scale-150 animate-pulse-glow" />
          <img src={logo} alt="ICAFEDASH Logo" className="w-64 md:w-80 mx-auto animate-float relative z-10" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.3 }}
          className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-10 leading-relaxed overflow-hidden"
        >
          {`Полный контроль вашей кибер-арены: мониторинг ПК в реальном времени, управление сессиями, финансовая аналитика и интеграция с iCafeCloud — всё в одной панели.`.split(' ').map((word, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 + i * 0.05 }}
              className="inline-block mr-1.5"
            >
              {word}
            </motion.span>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <Link
            to="/register"
            className="group relative px-8 py-3.5 rounded-lg bg-primary text-primary-foreground font-display text-sm font-semibold tracking-wider uppercase glow-box hover:brightness-110 transition-all duration-300 overflow-hidden"
          >
            <span className="relative z-10">Начать бесплатно</span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          </Link>
          <a
            href="#features"
            className="px-8 py-3.5 rounded-lg border border-primary/30 text-foreground font-display text-sm font-semibold tracking-wider uppercase hover:bg-primary/10 hover:border-primary/50 transition-all duration-300"
          >
            Узнать больше
          </a>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="mt-20 grid grid-cols-3 gap-8 md:gap-16"
        >
          {[
            { value: "100+", label: "Клубов" },
            { value: "24/7", label: "Мониторинг" },
            { value: "1 Месяц", label: "Бесплатно" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              className="text-center gaming-card rounded-xl px-6 py-4 relative overflow-hidden"
              whileHover={{ scale: 1.1, y: -10 }}
            >
              <div className="absolute inset-0 bg-primary/5 opacity-0 hover:opacity-100 transition-opacity" />
              <div className="text-2xl md:text-3xl font-display font-bold gradient-text">{stat.value}</div>
              <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};

export default Hero;
