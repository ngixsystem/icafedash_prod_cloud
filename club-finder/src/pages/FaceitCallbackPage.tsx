import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/hooks/use-toast";

const FACEIT_REDIRECT_URI = "https://cloud.icafedash.com/auth/faceit/callback";

export default function FaceitCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const { toast } = useToast();
  const called = useRef(false);

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error || !code) {
      toast({ title: "Ошибка авторизации", description: "Код авторизации отсутствует", variant: "destructive" });
      navigate("/auth", { replace: true });
      return;
    }

    const codeVerifier = sessionStorage.getItem("faceit_code_verifier") || undefined;
    sessionStorage.removeItem("faceit_code_verifier");

    fetch("/api/auth/faceit/callback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, redirect_uri: FACEIT_REDIRECT_URI, code_verifier: codeVerifier }),
    })
      .then(async (res) => { const d = await res.json(); if (!res.ok) throw new Error(d.message); return d; })
      .then((d) => { login(d.access_token, d.user); toast({ title: `Добро пожаловать, ${d.user.username}!` }); navigate("/", { replace: true }); })
      .catch((e) => { toast({ title: "Ошибка", description: e.message, variant: "destructive" }); navigate("/auth", { replace: true }); });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#121315]">
      <div className="text-center space-y-4">
        <div className="w-10 h-10 border-2 border-[#FF7800] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-white/50 text-sm tracking-wide">Авторизация через FACEIT...</p>
      </div>
    </div>
  );
}
