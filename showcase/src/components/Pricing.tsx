import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Link } from "react-router-dom";

const plans = [
    {
        name: "Пробный",
        price: "$0",
        period: "1 месяц",
        description: "Попробуйте все функции бесплатно",
        features: [
            "Полный доступ к функционалу",
            "До 50 ПК",
            "Базовая поддержка",
        ],
        highlight: false,
        color: "200 80% 60%",
    },
    {
        name: "1 Месяц",
        price: "$10",
        period: "/ мес",
        description: "Идеально для небольших клубов",
        features: [
            "Неограниченное кол-во ПК",
            "Полная аналитика",
            "Приоритетная поддержка",
            "Кастомизация бренда",
        ],
        highlight: false,
        color: "170 80% 50%",
    },
    {
        name: "6 Месяцев",
        price: "$30",
        period: "/ 6 мес",
        description: "Экономия 50% от ежемесячной оплаты",
        features: [
            "Всё из тарифа на 1 месяц",
            "Расширенная аналитика",
            "VIP поддержка 24/7",
            "Персональный менеджер",
        ],
        highlight: true,
        color: "170 80% 50%",
    },
    {
        name: "12 Месяцев",
        price: "$60",
        period: "/ год",
        description: "Максимальная выгода для крупных арен",
        features: [
            "Всё из тарифа на 6 месяцев",
            "Бесплатная настройка",
            "Резервное копирование",
            "Ранний доступ к новым функциям",
        ],
        highlight: false,
        color: "200 80% 60%",
    },
];

const Pricing = () => {
    return (
        <section id="pricing" className="py-24 md:py-32 relative">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_hsl(170_80%_50%_/_0.05)_0%,_transparent_60%)]" />
            <div className="container px-4 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 30, scale: 0.95 }}
                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.8, type: "spring", stiffness: 80 }}
                    className="text-center mb-16"
                >
                    <h2 className="text-3xl md:text-4xl font-bold gradient-text inline-block mb-4">
                        Тарифы
                    </h2>
                    <p className="text-muted-foreground max-w-xl mx-auto">
                        1 месяц предоставляется бесплатно для пробной версии
                    </p>
                </motion.div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
                    {plans.map((plan, i) => (
                        <motion.div
                            key={plan.name}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: i * 0.15 }}
                            className={`group relative gaming-card rounded-2xl p-6 md:p-8 flex flex-col ${plan.highlight
                                ? "border-primary/50 shadow-[0_0_30px_hsl(170_80%_50%_/_0.15)] bg-card border"
                                : "border-border/50 border bg-card/50"
                                }`}
                            whileHover={{ y: -5 }}
                        >
                            {plan.highlight && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-full uppercase tracking-wider">
                                    Популярный
                                </div>
                            )}
                            <h3 className="text-xl font-display font-semibold mb-2">{plan.name}</h3>
                            <p className="text-sm text-muted-foreground mb-6 h-10">{plan.description}</p>
                            <div className="mb-6">
                                <span className="text-4xl font-bold font-display text-foreground">{plan.price}</span>
                                <span className="text-muted-foreground ml-1">{plan.period}</span>
                            </div>

                            <ul className="space-y-4 mb-8 flex-1">
                                {plan.features.map((feature, j) => (
                                    <motion.li
                                        key={j}
                                        initial={{ opacity: 0, x: -20 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.4, delay: i * 0.15 + j * 0.1 }}
                                        className="flex items-start gap-3"
                                    >
                                        <div className="mt-1 bg-primary/20 rounded-full p-1 border border-primary/30">
                                            <Check className="w-3 h-3 text-primary" />
                                        </div>
                                        <span className="text-sm text-foreground/80">{feature}</span>
                                    </motion.li>
                                ))}
                            </ul>

                            <Link
                                to="/register"
                                className={`w-full py-3 rounded-xl font-medium transition-all duration-300 text-center block ${plan.highlight
                                    ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_15px_hsl(170_80%_50%_/_0.3)] hover:shadow-[0_0_25px_hsl(170_80%_50%_/_0.5)]"
                                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-white/5"
                                    }`}
                            >
                                Выбрать
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Pricing;
