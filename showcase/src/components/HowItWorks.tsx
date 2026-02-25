import { motion } from "framer-motion";

const steps = [
  {
    number: "01",
    title: "Клонируйте репозиторий",
    description: "Скачайте проект с GitHub одной командой.",
    code: "git clone https://github.com/ngixsystem/icafedash.git",
  },
  {
    number: "02",
    title: "Настройте credentials",
    description: "Укажите ваш API Key и Cafe ID от iCafeCloud в docker-compose.yml.",
    code: "ICAFE_API_KEY=your_key\nICAFE_CAFE_ID=your_id",
  },
  {
    number: "03",
    title: "Запустите",
    description: "Одна команда — и панель управления готова.",
    code: "docker-compose up -d --build",
  },
];

const HowItWorks = () => {
  return (
    <section className="py-24 md:py-32 relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_hsl(170_80%_50%_/_0.05)_0%,_transparent_60%)]" />
      <div className="container px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold gradient-text inline-block mb-4">
            Быстрый старт
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Три простых шага для запуска вашей панели управления
          </p>
        </motion.div>

        <div className="max-w-3xl mx-auto space-y-8">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="flex gap-6 items-start gaming-card rounded-xl p-6"
            >
              <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center relative">
                <div className="absolute inset-0 rounded-xl bg-primary/5 animate-pulse-glow" />
                <span className="font-display font-bold text-primary text-lg relative z-10">{step.number}</span>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-display font-semibold text-foreground mb-1">{step.title}</h3>
                <p className="text-sm text-muted-foreground mb-3">{step.description}</p>
                <div className="bg-background/80 rounded-lg p-3 font-mono text-sm text-primary/80 overflow-x-auto border border-border/50">
                  <pre>{step.code}</pre>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
