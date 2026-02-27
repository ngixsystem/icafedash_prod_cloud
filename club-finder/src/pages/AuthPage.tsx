import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Navigate, useLocation } from "react-router-dom";

export default function AuthPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [showVerify, setShowVerify] = useState(false);
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [verifyCode, setVerifyCode] = useState("");
    const [loading, setLoading] = useState(false);

    const { login, isAuthenticated } = useAuth();
    const { toast } = useToast();
    const location = useLocation();

    if (isAuthenticated) {
        const fromPath = (location.state as any)?.from?.pathname || "/";
        const fromSearch = (location.state as any)?.from?.search || "";
        return <Navigate to={`${fromPath}${fromSearch}`} replace />;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (showVerify) {
                const res = await fetch("/api/auth/verify-email", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, code: verifyCode })
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.message || "Неверный код");

                login(data.access_token, data.user);
                toast({ title: "Email подтвержден!", description: "Добро пожаловать!" });
                return;
            }

            const endpoint = isLogin ? "/api/clients/login" : "/api/clients/register";
            const payload = isLogin
                ? { username, password }
                : { username, email, password };

            const res = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.message || "Ошибка");

            if (isLogin) {
                login(data.access_token, data.user);
                toast({ title: "С возвращением!" });
            } else {
                toast({ title: "Код отправлен!", description: "Проверьте вашу почту." });
                setShowVerify(true);
            }
        } catch (err: any) {
            toast({ title: "Ошибка", description: err.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-[#020617]">
            {/* Dynamic Background */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]" />
            </div>

            <div className="w-full max-w-[400px] relative z-10">
                <div className="text-center mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <img src="/logo.png" alt="ICAFE DASH" className="h-14 mx-auto mb-6 object-contain" />
                    <h1 className="text-2xl font-display font-black tracking-tight text-white mb-2 uppercase">
                        {showVerify ? "Подтверждение" : (isLogin ? "Авторизация" : "Регистрация")}
                    </h1>
                    <p className="text-white/40 text-sm font-medium">
                        {showVerify ? `Мы отправили код на ${email}` : (isLogin ? "Управляйте своим игровым опытом" : "Станьте частью нашего сообщества")}
                    </p>
                </div>

                <div className="glass-dark p-8 rounded-[2.5rem] border border-white/10 shadow-2xl backdrop-blur-2xl">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {showVerify ? (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase font-bold tracking-widest text-white/40 ml-1">Код из письма</label>
                                    <Input
                                        placeholder="000000"
                                        value={verifyCode}
                                        onChange={e => setVerifyCode(e.target.value)}
                                        className="h-14 bg-white/5 border-white/10 rounded-2xl text-center text-xl tracking-[0.5em] font-bold focus:ring-primary/50"
                                        required
                                    />
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase font-bold tracking-widest text-white/40 ml-1">Логин</label>
                                    <Input
                                        placeholder="Ваш никнейм"
                                        value={username}
                                        onChange={e => setUsername(e.target.value)}
                                        className="h-12 bg-white/5 border-white/10 rounded-xl focus:ring-primary/50"
                                        required
                                    />
                                </div>
                                {!isLogin && (
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase font-bold tracking-widest text-white/40 ml-1">Email-адрес</label>
                                        <Input
                                            type="email"
                                            placeholder="example@mail.com"
                                            value={email}
                                            onChange={e => setEmail(e.target.value)}
                                            className="h-12 bg-white/5 border-white/10 rounded-xl focus:ring-primary/50"
                                            required
                                        />
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase font-bold tracking-widest text-white/40 ml-1">Пароль</label>
                                    <Input
                                        type="password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        className="h-12 bg-white/5 border-white/10 rounded-xl focus:ring-primary/50"
                                        required
                                    />
                                </div>
                            </>
                        )}

                        <Button
                            type="submit"
                            className="w-full h-14 rounded-2xl gradient-primary text-white font-bold text-lg shadow-[0_0_20px_rgba(var(--primary),0.3)] hover:scale-[1.02] transition-all active:scale-[0.98]"
                            disabled={loading}
                        >
                            {loading ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Загрузка...
                                </div>
                            ) : (
                                showVerify ? "Подтвердить" : (isLogin ? "Войти в аккаунт" : "Создать аккаунт")
                            )}
                        </Button>
                    </form>

                    {!showVerify && (
                        <div className="mt-8 text-center">
                            <button
                                type="button"
                                onClick={() => setIsLogin(!isLogin)}
                                className="text-xs font-bold uppercase tracking-widest text-white/30 hover:text-primary transition-colors"
                            >
                                {isLogin ? (
                                    <>Нет аккаунта? <span className="text-primary underline underline-offset-4">Зарегистрироваться</span></>
                                ) : (
                                    <>Уже есть аккаунт? <span className="text-primary underline underline-offset-4">Войти</span></>
                                )}
                            </button>
                        </div>
                    )}

                    {showVerify && (
                        <div className="mt-6 text-center">
                            <button
                                type="button"
                                onClick={() => setShowVerify(false)}
                                className="text-xs font-bold uppercase tracking-widest text-white/30 hover:text-white transition-colors"
                            >
                                ← Назад к регистрации
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
