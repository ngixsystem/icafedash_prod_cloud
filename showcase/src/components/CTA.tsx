import { motion } from "framer-motion";
import { UserPlus } from "lucide-react";
import { Link } from "react-router-dom";

const getDashboardUrl = (path: string) => {
  const host = window.location.hostname;
  return `http://${host}:8080${path}`;
};
const CTA = () => {
  return (
    <section className="py-24 md:py-32 relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_hsl(170_80%_50%_/_0.08)_0%,_transparent_50%)]" />
      <div className="container px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
          className="text-center max-w-2xl mx-auto gaming-card rounded-2xl p-10 md:p-14 neon-border"
        >
          <h2 className="text-3xl md:text-4xl font-bold gradient-text inline-block mb-6">
            Начните управлять эффективнее
          </h2>
          <p className="text-muted-foreground mb-10 text-lg">
            Оптимизируйте работу вашей кибер-арены, получайте точную аналитику и увеличьте прибыль. Зарегистрируйтесь сейчас и получите целый месяц абсолютно бесплатно!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="group relative inline-flex items-center gap-2 px-8 py-3.5 rounded-lg bg-primary text-primary-foreground font-display text-sm font-semibold tracking-wider uppercase glow-box hover:brightness-110 transition-all duration-300 overflow-hidden"
            >
              <UserPlus className="w-5 h-5 relative z-10" />
              <span className="relative z-10">Регистрация</span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            </Link>
            <a
              href={getDashboardUrl("/login")}
              className="px-8 py-3.5 rounded-lg border border-primary/30 text-foreground font-display text-sm font-semibold tracking-wider uppercase hover:bg-primary/10 hover:border-primary/50 transition-all duration-300 flex items-center justify-center"
            >
              Войти в панель
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTA;
