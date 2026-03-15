import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";

const FACEIT_REDIRECT_URI = "https://cloud.icafedash.com/auth/faceit/callback";

function sendToParent(data: object) {
  if (window.opener && !window.opener.closed) {
    window.opener.postMessage(data, window.location.origin);
  }
  window.close();
}

export default function FaceitCallbackPage() {
  const [searchParams] = useSearchParams();
  const called = useRef(false);

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error || !code) {
      sendToParent({
        type: "FACEIT_AUTH_ERROR",
        message: error === "access_denied" ? "Вы отменили вход через FACEIT" : "Код авторизации отсутствует",
      });
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
        sendToParent({ type: "FACEIT_AUTH_SUCCESS", access_token: data.access_token, user: data.user });
      })
      .catch((err) => {
        sendToParent({ type: "FACEIT_AUTH_ERROR", message: err.message });
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
