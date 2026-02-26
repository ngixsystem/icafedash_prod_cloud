import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Navigate, useLocation } from "react-router-dom";

export default function AuthPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const { login, isAuthenticated } = useAuth();
    const { toast } = useToast();
    const location = useLocation();

    if (isAuthenticated) {
        const from = (location.state as any)?.from?.pathname || "/";
        return <Navigate to={from} replace />;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
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

            if (!res.ok) throw new Error(data.message || "Ошибка авторизации");

            if (isLogin) {
                login(data.access_token, data.user);
                toast({ title: "Успешный вход!" });
            } else {
                toast({ title: "Регистрация успешна! Теперь вы можете войти." });
                setIsLogin(true);
            }
        } catch (err: any) {
            toast({ title: "Ошибка", description: err.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-sm glass p-6 rounded-xl space-y-6">
                <div className="text-center">
                    <h1 className="text-2xl font-bold neon-text">iCafeDash</h1>
                    <p className="text-muted-foreground">{isLogin ? "Вход для клиентов" : "Регистрация"}</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        placeholder="Логин"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        required
                    />
                    {!isLogin && (
                        <Input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                        />
                    )}
                    <Input
                        type="password"
                        placeholder="Пароль"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                    />
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? "Загрузка..." : (isLogin ? "Войти" : "Зарегистрироваться")}
                    </Button>
                </form>

                <div className="text-center text-sm">
                    <button
                        type="button"
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-primary hover:underline"
                    >
                        {isLogin ? "Нет аккаунта? Зарегистрироваться" : "Уже есть аккаунт? Войти"}
                    </button>
                </div>
            </div>
        </div>
    );
}
