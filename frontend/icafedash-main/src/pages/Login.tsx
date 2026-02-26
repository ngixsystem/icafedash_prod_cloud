import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { AlertCircle, Lock, User } from "lucide-react";

const Login = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (response.ok) {
                login(data.access_token, data.user);
                toast.success("Добро пожаловать в игру, " + data.user.username);
                navigate("/");
            } else {
                toast.error(data.message || "Доступ запрещен");
            }
        } catch (error) {
            toast.error("Связь с сервером потеряна");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0a0a0c] p-4 relative overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none" />

            <div className="w-full max-w-md space-y-8 relative z-10">
                <div className="text-center space-y-4 animate-in fade-in slide-in-from-top-4 duration-700">
                    <div className="relative inline-block">
                        <div className="absolute inset-0 bg-primary/40 blur-2xl rounded-full" />
                        <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-black border-2 border-primary/50 shadow-[0_0_30px_rgba(var(--primary),0.3)] mb-2">
                            <Lock className="w-10 h-10 text-primary drop-shadow-[0_0_8px_rgba(var(--primary),0.8)]" />
                        </div>
                    </div>
                    <div>
                        <h1 className="text-4xl font-black tracking-tighter bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent uppercase italic">
                            iCafe<span className="text-primary">Dash</span>
                        </h1>
                        <div className="h-1 w-12 bg-primary mx-auto mt-1 rounded-full shadow-[0_0_10px_#00ffa3]" />
                        <p className="text-gray-500 text-sm font-medium mt-4 tracking-widest uppercase">Система управления кибер-ареной</p>
                    </div>
                </div>

                <Card className="border-white/5 bg-black/40 backdrop-blur-xl shadow-2xl overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
                    <CardHeader className="space-y-1 pt-8">
                        <CardTitle className="text-2xl font-bold text-white text-center">АВТОРИЗАЦИЯ</CardTitle>
                        <CardDescription className="text-center text-gray-500">Введите данные для входа в панель</CardDescription>
                    </CardHeader>
                    <form onSubmit={handleSubmit} className="relative z-10">
                        <CardContent className="space-y-6 pt-2">
                            <div className="space-y-2 group/field">
                                <Label htmlFor="username" className="text-gray-400 text-xs font-bold uppercase tracking-wider group-focus-within/field:text-primary transition-colors">Логин оператора</Label>
                                <div className="relative">
                                    <div className="absolute left-3 top-3.5 h-4 w-4 text-gray-500 group-focus-within/field:text-primary transition-colors">
                                        <User className="h-4 w-4" />
                                    </div>
                                    <Input
                                        id="username"
                                        placeholder="Username"
                                        className="pl-10 h-12 bg-white/5 border-white/10 hover:border-white/20 focus:border-primary/50 focus:ring-primary/20 text-white placeholder:text-gray-600 rounded-xl transition-all"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2 group/field">
                                <Label htmlFor="password" className="text-gray-400 text-xs font-bold uppercase tracking-wider group-focus-within/field:text-primary transition-colors">Код доступа</Label>
                                <div className="relative">
                                    <div className="absolute left-3 top-3.5 h-4 w-4 text-gray-500 group-focus-within/field:text-primary transition-colors">
                                        <Lock className="h-4 w-4" />
                                    </div>
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="••••••••"
                                        className="pl-10 h-12 bg-white/5 border-white/10 hover:border-white/20 focus:border-primary/50 focus:ring-primary/20 text-white placeholder:text-gray-600 rounded-xl transition-all"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="pb-8">
                            <Button
                                className="w-full h-12 bg-primary hover:bg-primary/80 text-black font-bold uppercase tracking-widest shadow-[0_0_20px_rgba(var(--primary),0.2)] hover:shadow-[0_0_30px_rgba(var(--primary),0.4)] transition-all rounded-xl disabled:opacity-50"
                                type="submit"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <div className="flex items-center gap-2">
                                        <div className="h-4 w-4 border-2 border-black/30 border-t-black animate-spin rounded-full" />
                                        <span>Загрузка</span>
                                    </div>
                                ) : "ПОДКЛЮЧИТЬСЯ"}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>

                <div className="flex items-center justify-between text-gray-600 text-[10px] font-bold uppercase tracking-[0.2em]">
                    <span>ver 2.0.0</span>
                    <span className="flex items-center gap-1 italic">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_5px_#00ffa3]" />
                        System Online
                    </span>
                    <span>&copy; iCafeDash 2026</span>
                </div>
            </div>
        </div>
    );
};

export default Login;
