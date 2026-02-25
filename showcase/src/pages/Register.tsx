import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import DynamicBackground from "@/components/DynamicBackground";
import logo from "@/assets/logo.png";
import Navbar from "@/components/Navbar";
import { Mail, Phone, User, Lock, ArrowRight, ShieldCheck, RotateCw, CheckCircle2, AlertCircle } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "/api";

const getDashboardUrl = (path: string) => {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
        return `http://${host}:8080${path}`;
    }
    const cleanHost = host.replace(/^www\./, '');
    return `https://cp.${cleanHost}${path}`;
};

const Register = () => {
    const [step, setStep] = useState<"form" | "verify" | "success">("form");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [email, setEmail] = useState("");
    const [cooldown, setCooldown] = useState(0);

    // Form fields
    const [username, setUsername] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [code, setCode] = useState("");

    // Step 1: Register
    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await fetch(`${API_URL}/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, email, phone, password }),
            });
            const data = await res.json();

            if (res.ok) {
                setEmail(data.email || email);
                setStep("verify");
                startCooldown();
            } else {
                setError(data.message || "Ошибка регистрации");
            }
        } catch {
            setError("Не удалось подключиться к серверу");
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Verify email
    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await fetch(`${API_URL}/auth/verify-email`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, code }),
            });
            const data = await res.json();

            if (res.ok) {
                setStep("success");
            } else {
                setError(data.message || "Неверный код");
            }
        } catch {
            setError("Не удалось подключиться к серверу");
        } finally {
            setLoading(false);
        }
    };

    // Resend code
    const handleResend = async () => {
        if (cooldown > 0) return;
        setError("");

        try {
            const res = await fetch(`${API_URL}/auth/resend-code`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();

            if (res.ok) {
                startCooldown();
            } else {
                setError(data.message || "Ошибка отправки");
            }
        } catch {
            setError("Не удалось подключиться к серверу");
        }
    };

    const startCooldown = () => {
        setCooldown(60);
        const interval = setInterval(() => {
            setCooldown((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    return (
        <div className="min-h-screen bg-background relative flex flex-col pt-24 pb-12">
            <DynamicBackground />
            <Navbar />

            <div className="flex-1 flex items-center justify-center p-4 relative z-10">
                <AnimatePresence mode="wait">
                    {/* ─── STEP 1: Registration Form ─── */}
                    {step === "form" && (
                        <motion.div
                            key="form"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.4 }}
                            className="w-full max-w-md gaming-card rounded-2xl p-8 border border-primary/20 shadow-[0_0_40px_hsl(170_80%_50%_/_0.1)] relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-32 bg-[radial-gradient(circle,_hsl(170_80%_50%_/_0.15)_0%,_transparent_70%)] -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                            <div className="text-center mb-8">
                                <Link to="/" className="inline-block mb-6">
                                    <img src={logo} alt="Logo" className="h-12 mx-auto" />
                                </Link>
                                <h1 className="text-2xl font-bold font-display gradient-text mb-2">Создать аккаунт</h1>
                                <p className="text-muted-foreground text-sm">Присоединяйтесь к платформе управления клубами</p>
                            </div>

                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
                                >
                                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                    {error}
                                </motion.div>
                            )}

                            <form className="space-y-5 relative z-10" onSubmit={handleRegister}>
                                <div className="space-y-4">
                                    <div className="relative group">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                        <input
                                            type="text"
                                            placeholder="Логин"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm text-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/50"
                                            required
                                            minLength={3}
                                        />
                                    </div>

                                    <div className="relative group">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                        <input
                                            type="email"
                                            placeholder="Email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm text-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/50"
                                            required
                                        />
                                    </div>

                                    <div className="relative group">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                        <input
                                            type="tel"
                                            placeholder="Номер телефона"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm text-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/50"
                                        />
                                    </div>

                                    <div className="relative group">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                        <input
                                            type="password"
                                            placeholder="Пароль (мин. 6 символов)"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm text-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/50"
                                            required
                                            minLength={6}
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full group py-3.5 px-4 bg-primary text-primary-foreground font-semibold rounded-xl flex items-center justify-center gap-2 mt-6 hover:bg-primary/90 shadow-[0_0_15px_hsl(170_80%_50%_/_0.3)] hover:shadow-[0_0_25px_hsl(170_80%_50%_/_0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? (
                                        <RotateCw className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>
                                            Зарегистрироваться
                                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </button>
                            </form>

                            <p className="text-center text-sm text-muted-foreground mt-8">
                                Уже есть аккаунт?{" "}
                                <a href={getDashboardUrl("/login")} className="text-primary hover:underline hover:text-primary-foreground transition-colors">
                                    Войти
                                </a>
                            </p>
                        </motion.div>
                    )}

                    {/* ─── STEP 2: Email Verification ─── */}
                    {step === "verify" && (
                        <motion.div
                            key="verify"
                            initial={{ opacity: 0, scale: 0.95, x: 50 }}
                            animate={{ opacity: 1, scale: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.95, x: -50 }}
                            transition={{ duration: 0.4 }}
                            className="w-full max-w-md gaming-card rounded-2xl p-8 border border-primary/20 shadow-[0_0_40px_hsl(170_80%_50%_/_0.1)] relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-32 bg-[radial-gradient(circle,_hsl(170_80%_50%_/_0.15)_0%,_transparent_70%)] -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                            <div className="text-center mb-8">
                                <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
                                    <ShieldCheck className="w-8 h-8 text-primary" />
                                </div>
                                <h1 className="text-2xl font-bold font-display gradient-text mb-2">Подтвердите email</h1>
                                <p className="text-muted-foreground text-sm">
                                    Мы отправили 6-значный код на <br />
                                    <span className="text-primary font-medium">{email}</span>
                                </p>
                            </div>

                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
                                >
                                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                    {error}
                                </motion.div>
                            )}

                            <form className="space-y-5 relative z-10" onSubmit={handleVerify}>
                                <div className="relative group">
                                    <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                    <input
                                        type="text"
                                        placeholder="Введите 6-значный код"
                                        value={code}
                                        onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl py-4 pl-11 pr-4 text-center text-2xl font-mono tracking-[0.5em] text-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/50 placeholder:text-sm placeholder:tracking-normal"
                                        required
                                        maxLength={6}
                                        autoFocus
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading || code.length !== 6}
                                    className="w-full group py-3.5 px-4 bg-primary text-primary-foreground font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 shadow-[0_0_15px_hsl(170_80%_50%_/_0.3)] hover:shadow-[0_0_25px_hsl(170_80%_50%_/_0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? (
                                        <RotateCw className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>
                                            Подтвердить
                                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </button>
                            </form>

                            <div className="text-center mt-6">
                                <button
                                    onClick={handleResend}
                                    disabled={cooldown > 0}
                                    className="text-sm text-muted-foreground hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {cooldown > 0
                                        ? `Отправить повторно через ${cooldown}с`
                                        : "Отправить код повторно"}
                                </button>
                            </div>

                            <button
                                onClick={() => { setStep("form"); setError(""); }}
                                className="block mx-auto mt-4 text-sm text-muted-foreground/60 hover:text-muted-foreground transition-colors"
                            >
                                ← Назад к форме
                            </button>
                        </motion.div>
                    )}

                    {/* ─── STEP 3: Success ─── */}
                    {step === "success" && (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5, type: "spring", bounce: 0.4 }}
                            className="w-full max-w-md gaming-card rounded-2xl p-8 border border-primary/20 shadow-[0_0_40px_hsl(170_80%_50%_/_0.1)] relative overflow-hidden text-center"
                        >
                            <div className="absolute top-0 right-0 p-32 bg-[radial-gradient(circle,_hsl(170_80%_50%_/_0.15)_0%,_transparent_70%)] -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.2, type: "spring", bounce: 0.5 }}
                                className="w-20 h-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-6"
                            >
                                <CheckCircle2 className="w-10 h-10 text-primary" />
                            </motion.div>

                            <h1 className="text-2xl font-bold font-display gradient-text mb-3">Регистрация завершена!</h1>
                            <p className="text-muted-foreground text-sm mb-8">
                                Ваш аккаунт успешно создан и подтверждён.<br />
                                Теперь вы можете войти в панель управления.
                            </p>

                            <a
                                href={getDashboardUrl("/login")}
                                className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-4 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 shadow-[0_0_15px_hsl(170_80%_50%_/_0.3)] hover:shadow-[0_0_25px_hsl(170_80%_50%_/_0.5)] transition-all"
                            >
                                Войти в панель
                                <ArrowRight className="w-4 h-4" />
                            </a>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default Register;
