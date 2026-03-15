import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";

const FACEIT_REDIRECT_URI = "https://cloud.icafedash.com/auth/faceit/callback";

export default function FaceitCallbackPage() {
  const [searchParams] = useSearchParams();
  const called = useRef(false);

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error || !code) {
      localStorage.setItem("faceit_auth_error", error === "access_denied" ? "Вы отменили вход через FACEIT" : "Код авторизации отсутствует");
      window.close();
      return;
    }

    const codeVerifier = localStorage.getItem("faceit_code_verifier") || "";
    localStorage.removeItem("faceit_code_verifier");

    fetch("/api/auth/faceit/callback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, redirect_uri: FACEIT_REDIRECT_URI, code_verifier: codeVerifier }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Ошибка авторизации");
        return data;
      })
      .then((data) => {
        // Write auth to localStorage — parent window picks it up via storage event
        localStorage.setItem("icafe_client_token", data.access_token);
        localStorage.setItem("icafe_client_user", JSON.stringify(data.user));
        localStorage.setItem("faceit_auth_complete", "1");
        window.close();
      })
      .catch((err) => {
        localStorage.setItem("faceit_auth_error", err.message);
        window.close();
      });
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
