import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Navigate, useLocation } from "react-router-dom";
import brandLogo from "@/assets/frag.png";

const FACEIT_CLIENT_ID = "0da47f41-e39b-4719-bebc-1d35f8065a26";
const FACEIT_REDIRECT_URI = "https://cloud.icafedash.com/api/auth/faceit/oauth-callback";

async function parseApiPayload(res: Response): Promise<any> {
  const contentType = (res.headers.get("content-type") || "").toLowerCase();
  const raw = await res.text();

  if (contentType.includes("application/json")) {
    try {
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }
  if (raw && raw.trim().startsWith("<")) {
    throw new Error(`Server returned HTML (HTTP ${res.status}). Check backend/proxy.`);
  }
  try {
    return raw ? JSON.parse(raw) : {};
  } catch {
    return raw ? { message: raw.slice(0, 200) } : {};
  }
}

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
          body: JSON.stringify({ email, code: verifyCode }),
        });
        const data = await parseApiPayload(res);
        if (!res.ok) throw new Error(data.message || `Verify failed (HTTP ${res.status})`);

        login(data.access_token, data.user);
        toast({ title: "Email подтвержден", description: "Добро пожаловать" });
        return;
      }

      const endpoint = isLogin ? "/api/clients/login" : "/api/clients/register";
      const payload = isLogin ? { username, password } : { username, email, password };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await parseApiPayload(res);

      if (!res.ok) throw new Error(data.message || `Auth failed (HTTP ${res.status})`);

      if (isLogin) {
        login(data.access_token, data.user);
        toast({ title: "С возвращением" });
      } else {
        toast({ title: "Код отправлен", description: "Проверьте вашу почту" });
        setShowVerify(true);
      }
    } catch (err: any) {
      toast({ title: "Ошибка", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleFaceitLogin = async () => {
    // Generate PKCE code_verifier and code_challenge
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    const verifier = btoa(String.fromCharCode(...array))
      .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");

    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
    const challenge = btoa(String.fromCharCode(...new Uint8Array(digest)))
      .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");

    // Encode verifier in state so backend can retrieve it from FACEIT's callback
    const state = btoa(JSON.stringify({ v: verifier }))
      .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");

    const url =
      `https://accounts.faceit.com/accounts` +
      `?client_id=${FACEIT_CLIENT_ID}` +
      `&redirect_uri=${encodeURIComponent(FACEIT_REDIRECT_URI)}` +
      `&response_type=code` +
      `&scope=openid%20profile%20email` +
      `&code_challenge=${challenge}` +
      `&code_challenge_method=S256` +
      `&state=${state}`;
    window.location.href = url;
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-12%] left-[-12%] w-[48%] h-[48%] bg-[#FF7800]/18 rounded-full blur-[130px]" />
        <div className="absolute bottom-[-15%] right-[-15%] w-[52%] h-[52%] bg-[#FF7800]/14 rounded-full blur-[150px]" />
      </div>

      <div className="w-full max-w-[420px] relative z-10">
        <div className="text-center mb-8">
          <img src={brandLogo} alt="FRAG.GG" className="mx-auto mb-5 h-32 w-32 object-contain drop-shadow-[0_0_28px_rgba(255,120,0,0.38)]" />
          <h1 className="text-3xl font-display tracking-tight text-white mb-2">FRAG.GG</h1>
          <p className="text-white/45 text-sm">
            {showVerify ? `Введите код, отправленный на ${email}` : isLogin ? "Вход в игровой аккаунт" : "Создание аккаунта"}
          </p>
        </div>

        <div className="glass-dark p-7 rounded-[2rem] border border-white/10 shadow-2xl backdrop-blur-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            {showVerify ? (
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold tracking-widest text-white/40 ml-1">Код подтверждения</label>
                <Input
                  placeholder="000000"
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value)}
                  className="h-14 bg-white/5 border-white/10 rounded-2xl text-center text-xl tracking-[0.45em] font-bold"
                  required
                />
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-white/40 ml-1">Логин</label>
                  <Input
                    placeholder="Ваш никнейм"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="h-12 bg-white/5 border-white/10 rounded-xl"
                    required
                  />
                </div>

                {!isLogin && (
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-white/40 ml-1">Email</label>
                    <Input
                      type="email"
                      placeholder="example@mail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-12 bg-white/5 border-white/10 rounded-xl"
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
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 bg-white/5 border-white/10 rounded-xl"
                    required
                  />
                </div>
              </>
            )}

            <Button type="submit" className="w-full h-13 rounded-2xl text-white font-semibold text-base" disabled={loading}>
              {loading ? "Загрузка..." : showVerify ? "Подтвердить" : isLogin ? "Войти" : "Создать аккаунт"}
            </Button>
          </form>

          {!showVerify && (
            <>
              <div className="relative my-5 flex items-center gap-3">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-[10px] uppercase tracking-widest text-white/25 font-bold">или</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              <button
                type="button"
                onClick={handleFaceitLogin}
                className="w-full h-12 rounded-xl flex items-center justify-center gap-3 bg-[#FF5500] hover:bg-[#FF6620] transition-colors font-bold text-white text-sm"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3.234 15.93L0 12.696l8.055-8.055 3.234 3.234L3.234 15.93zm9.512-9.512l3.234-3.234L24 11.304l-3.234 3.234-8.02-8.12zM3.234 8.07L11.29 0l3.234 3.234-8.055 8.055L3.234 8.07zM12.746 24l-3.234-3.234 8.055-8.055L20.8 15.93 12.746 24z"/>
                </svg>
                Войти через FACEIT
              </button>

              <div className="mt-5 text-center">
                <button type="button" onClick={() => setIsLogin(!isLogin)} className="text-xs font-bold uppercase tracking-widest text-white/35 hover:text-[#FF7800] transition-colors">
                  {isLogin ? "Нет аккаунта? Зарегистрироваться" : "Уже есть аккаунт? Войти"}
                </button>
              </div>
            </>
          )}

          {showVerify && (
            <div className="mt-6 text-center">
              <button type="button" onClick={() => setShowVerify(false)} className="text-xs font-bold uppercase tracking-widest text-white/35 hover:text-white transition-colors">
                Назад к регистрации
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
