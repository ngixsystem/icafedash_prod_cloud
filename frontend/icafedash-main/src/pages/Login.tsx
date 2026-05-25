import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Lock, User } from "lucide-react";
import fragLogo from "@/assets/frag.png";

async function wait(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function loginRequestWithRetry(body: { username: string; password: string }, retries = 1) {
  let lastError: unknown = null;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      return response;
    } catch (e) {
      lastError = e;
      if (attempt < retries) {
        await wait(600);
      }
    } finally {
      window.clearTimeout(timeoutId);
    }
  }

  throw lastError;
}

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
      const response = await loginRequestWithRetry({ username, password }, 1);

      const data = await response.json();

      if (response.ok) {
        login(data.access_token, data.user);
        toast.success("Добро пожаловать");
        navigate("/");
      } else {
        toast.error(data.message || "Доступ запрещен");
      }
    } catch {
      toast.error("Связь с сервером потеряна");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#070604] p-4 relative overflow-hidden text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,149,0,0.16),transparent_34%),radial-gradient(circle_at_8%_100%,rgba(255,106,0,0.08),transparent_30%)] pointer-events-none" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#ff9500]/35 to-transparent" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,149,0,0.018)_1px,transparent_1px)] bg-[length:92px_100%] opacity-40 pointer-events-none" />

      <div className="w-full max-w-[448px] space-y-8 relative z-10">
        <div className="text-center space-y-5 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="relative inline-flex">
            <div className="absolute inset-0 rounded-full bg-[#ff9500]/35 blur-3xl" />
            <img src={fragLogo} alt="FRAG Dashboard" className="relative h-28 w-28 object-contain drop-shadow-[0_0_28px_rgba(255,149,0,0.42)]" />
          </div>
          <div>
            <h1
              className="text-[48px] uppercase leading-none text-white drop-shadow-[0_0_22px_rgba(255,149,0,0.22)]"
              style={{ fontFamily: '"Bebas Neue", sans-serif', letterSpacing: "0.03em" }}
            >
              <span>FRAG Dashboard</span>
            </h1>
            <div className="h-1 w-14 bg-gradient-to-r from-[#ff6a00] to-[#ffb347] mx-auto mt-2 rounded-full shadow-[0_0_16px_rgba(255,149,0,0.75)]" />
            <p className="text-[#9b8a76] text-sm font-semibold mt-5 tracking-[0.22em] uppercase">Система управления кибер-ареной</p>
          </div>
        </div>

        <Card className="relative overflow-hidden rounded-[16px] border border-[#3a2a18] bg-[#11100e]/95 shadow-[0_24px_80px_rgba(0,0,0,0.46),inset_0_1px_0_rgba(255,255,255,0.045)] backdrop-blur-xl">
          <div className="absolute top-0 left-10 right-10 h-px bg-gradient-to-r from-transparent via-[#ff9500]/65 to-transparent" />
          <CardHeader className="space-y-2 pt-9 pb-4">
            <CardTitle className="text-[26px] font-black text-white text-center tracking-[-0.03em]">АВТОРИЗАЦИЯ</CardTitle>
            <CardDescription className="text-center text-[#8b93a4]">Введите данные для входа в панель</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit} className="relative z-10">
            <CardContent className="space-y-6 px-6 pt-1 sm:px-8">
              <div className="space-y-2 group/field">
                <Label htmlFor="username" className="text-[#ff9500] text-xs font-black uppercase tracking-[0.12em] group-focus-within/field:text-[#ffb347] transition-colors">
                  Логин оператора
                </Label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8f8273] group-focus-within/field:text-[#ff9500] transition-colors">
                    <User className="h-4 w-4" />
                  </div>
                  <Input
                    id="username"
                    placeholder="Username"
                    className="pl-11 h-[52px] rounded-[13px] border-[#322719] bg-[#1a1713] text-white placeholder:text-[#756b60] shadow-[inset_0_1px_0_rgba(255,255,255,0.035)] transition-all hover:border-[#4b3822] focus:border-[#ff9500] focus:ring-2 focus:ring-[#ff9500]/20"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2 group/field">
                <Label htmlFor="password" className="text-[#a89784] text-xs font-black uppercase tracking-[0.12em] group-focus-within/field:text-[#ffb347] transition-colors">
                  Код доступа
                </Label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8f8273] group-focus-within/field:text-[#ff9500] transition-colors">
                    <Lock className="h-4 w-4" />
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-11 h-[52px] rounded-[13px] border-[#322719] bg-[#1a1713] text-white placeholder:text-[#756b60] shadow-[inset_0_1px_0_rgba(255,255,255,0.035)] transition-all hover:border-[#4b3822] focus:border-[#ff9500] focus:ring-2 focus:ring-[#ff9500]/20"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="px-6 pb-8 pt-0 sm:px-8">
              <Button
                className="w-full h-[50px] rounded-[12px] border-0 bg-gradient-to-r from-[#ff6a00] to-[#ffb347] text-black font-black uppercase tracking-[0.18em] shadow-[0_16px_34px_rgba(255,149,0,0.22)] transition-all hover:brightness-110 hover:shadow-[0_18px_42px_rgba(255,149,0,0.34)] disabled:opacity-50"
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-black/30 border-t-black animate-spin rounded-full" />
                    <span>Загрузка</span>
                  </div>
                ) : (
                  "ПОДКЛЮЧИТЬСЯ"
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>

        <div className="flex items-center justify-between text-[#6f6253] text-[10px] font-black uppercase tracking-[0.22em]">
          <span>ver 2.0.0</span>
          <span className="flex items-center gap-1 italic">
            <div className="h-1.5 w-1.5 rounded-full bg-[#ff9500] animate-pulse shadow-[0_0_8px_#ff9500]" />
            System Online
          </span>
          <span>&copy; FRAG 2026</span>
        </div>
      </div>
    </div>
  );
};

export default Login;
