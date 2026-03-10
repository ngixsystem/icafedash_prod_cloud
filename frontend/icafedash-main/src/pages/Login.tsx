import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Lock, Radar, User } from "lucide-react";
const brandLogo = "/logo.png";

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
    <div className="esports-shell min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="gradient-orb top-[-14%] left-[-14%] w-[34rem] h-[34rem] bg-[#6C5CE7]/45" />
      <div className="gradient-orb bottom-[-15%] right-[-15%] w-[38rem] h-[38rem] bg-[#00E5FF]/30" />
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.1)_0%,transparent_50%)] opacity-40" />

      <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-8 items-stretch relative z-10">
        <div className="hidden lg:flex glass-card rounded-3xl p-10 flex-col justify-between overflow-hidden">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.28em] text-slate-300">
              <Radar className="h-4 w-4 text-accent" />
              Cloud Finder
            </div>
            <div>
              <h1 className="font-display text-5xl leading-tight text-white">Gaming Cloud Control</h1>
              <p className="mt-4 max-w-md text-slate-300/80">
                Unified control panel for esports clubs, bookings and live monitoring.
              </p>
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/25 p-5">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl border border-white/10 bg-white/5 p-2">
                <img src={brandLogo} alt="Cloud Finder Logo" className="h-full w-full object-contain" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Brand</p>
                <p className="font-display text-lg text-white">Cloud Finder</p>
              </div>
            </div>
          </div>
        </div>

        <Card className="rounded-3xl border-white/10 bg-[linear-gradient(170deg,rgba(14,20,38,0.86),rgba(10,14,27,0.86))] shadow-[0_20px_80px_rgba(0,0,0,0.4)]">
          <CardHeader className="space-y-1 pt-8">
            <div className="mx-auto mb-4 h-16 w-16 rounded-2xl border border-white/10 bg-black/25 p-2.5 shadow-[0_0_26px_rgba(108,92,231,0.35)]">
              <img src={brandLogo} alt="Cloud Finder Logo" className="h-full w-full object-contain" />
            </div>
            <CardTitle className="text-center font-display text-3xl text-white">Cloud Finder</CardTitle>
            <CardDescription className="text-center text-slate-400">Login to the esports control panel</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit} className="relative z-10">
            <CardContent className="space-y-6 pt-2">
              <div className="space-y-2 group/field">
                <Label htmlFor="username" className="text-slate-300 text-xs font-bold uppercase tracking-wider group-focus-within/field:text-primary transition-colors">
                  Логин
                </Label>
                <div className="relative">
                  <div className="absolute left-3 top-3.5 h-4 w-4 text-slate-500 group-focus-within/field:text-primary transition-colors">
                    <User className="h-4 w-4" />
                  </div>
                  <Input
                    id="username"
                    placeholder="Username"
                    className="pl-10 h-12 bg-white/5 border-white/10 hover:border-white/20 focus:border-primary/50 text-white placeholder:text-slate-500 rounded-xl transition-all"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2 group/field">
                <Label htmlFor="password" className="text-slate-300 text-xs font-bold uppercase tracking-wider group-focus-within/field:text-primary transition-colors">
                  Пароль
                </Label>
                <div className="relative">
                  <div className="absolute left-3 top-3.5 h-4 w-4 text-slate-500 group-focus-within/field:text-primary transition-colors">
                    <Lock className="h-4 w-4" />
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10 h-12 bg-white/5 border-white/10 hover:border-white/20 focus:border-primary/50 text-white placeholder:text-slate-500 rounded-xl transition-all"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
            </CardContent>

            <CardFooter className="pb-8">
              <Button className="w-full h-12 neon-button font-bold uppercase tracking-[0.16em] rounded-xl disabled:opacity-50" type="submit" disabled={isLoading}>
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white animate-spin rounded-full" />
                    <span>Загрузка</span>
                  </div>
                ) : (
                  "Войти"
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Login;
