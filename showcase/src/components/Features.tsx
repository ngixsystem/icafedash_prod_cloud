import { motion } from "framer-motion";
import { Monitor, BarChart3, Users, Shield, Settings, Zap } from "lucide-react";

const features = [
  {
    icon: Monitor,
    title: "Мониторинг ПК",
    description: "Отслеживайте состояние каждого компьютера в реальном времени: статус, пользователь, оставшееся время.",
    color: "170 80% 50%",
  },
  {
    icon: Users,
    title: "Управление сессиями",
    description: "Запуск, остановка и продление сессий одним кликом. Полный контроль над каждым рабочим местом.",
    color: "200 80% 60%",
  },
  {
    icon: BarChart3,
    title: "Финансовая аналитика",
    description: "Детальные отчёты по доходам, посещаемости и загруженности. Графики и статистика за любой период.",
    color: "170 80% 50%",
  },
  {
    icon: Shield,
    title: "Безопасность",
    description: "Защищённые API-ключи, контроль доступа и безопасное хранение конфигурации через Docker volumes.",
    color: "200 80% 60%",
  },
  {
    icon: Settings,
    title: "Гибкая настройка",
    description: "Кастомизация бренда, логотипа и названия клуба. Настройка через веб-интерфейс или конфигурационные файлы.",
    color: "170 80% 50%",
  },
  {
    icon: Zap,
    title: "Быстрый деплой",
    description: "Запуск за минуты с Docker Compose. Один файл конфигурации — и ваша панель готова к работе.",
    color: "200 80% 60%",
  },
];

const Features = () => {
  return (
    <section id="features" className="py-24 md:py-32 relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_hsl(170_80%_50%_/_0.04)_0%,_transparent_60%)]" />
      <div className="container px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, type: "spring", stiffness: 80 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold gradient-text inline-block mb-4">
            Возможности
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Всё необходимое для эффективного управления кибер-ареной
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: i * 0.1, type: "spring", stiffness: 100 }}
              className="group gaming-card rounded-xl p-6 neon-border relative overflow-hidden"
              whileHover={{ scale: 1.05, translateY: -10 }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center mb-6 transition-all duration-500 relative z-10"
                style={{
                  background: `linear-gradient(135deg, hsl(${feature.color} / 0.15), hsl(${feature.color} / 0.05))`,
                }}
              >
                <feature.icon className="w-6 h-6 text-primary group-hover:drop-shadow-[0_0_8px_hsl(170_80%_50%_/_0.6)] transition-all duration-300" />
              </div>
              <h3 className="text-lg font-display font-semibold mb-2 text-foreground">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
