import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/components/auth/AuthProvider";

const FACEIT_REDIRECT_URI = "https://cloud.icafedash.com/auth/faceit/callback";

export default function FaceitCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const called = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    const code = searchParams.get("code");
    const errorParam = searchParams.get("error");

    if (errorParam || !code) {
      setError(errorParam || "Код авторизации отсутствует");
      return;
    }

    const codeVerifier = sessionStorage.getItem("faceit_code_verifier") || undefined;
    sessionStorage.removeItem("faceit_code_verifier");
    sessionStorage.removeItem("faceit_state");

    fetch("/api/auth/faceit/callback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, redirect_uri: FACEIT_REDIRECT_URI, code_verifier: codeVerifier }),
    })
      .then(async (res) => { const d = await res.json(); if (!res.ok) throw new Error(d.message); return d; })
      .then((d) => { login(d.access_token, d.user); navigate("/", { replace: true }); })
      .catch((e) => setError(e.message));
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#121315] p-6">
        <div className="text-center space-y-4 max-w-sm">
          <p className="text-red-400 font-semibold">Ошибка авторизации</p>
          <p className="text-white/50 text-sm break-all">{error}</p>
          <button
            onClick={() => navigate("/auth", { replace: true })}
            className="mt-4 px-6 py-2 rounded-xl bg-white/10 text-white text-sm hover:bg-white/20 transition-colors"
          >
            Назад
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#121315]">
      <div className="text-center space-y-4">
        <div className="w-10 h-10 border-2 border-[#FF7800] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-white/50 text-sm tracking-wide">Авторизация через FACEIT...</p>
      </div>
    </div>
  );
}
