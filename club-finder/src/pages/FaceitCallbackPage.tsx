import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/components/auth/AuthProvider";

export default function FaceitCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login, updateUser } = useAuth();
  const called = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    const linked = searchParams.get("linked");
    const faceitError = searchParams.get("faceit_error") || searchParams.get("error");

    if (faceitError) {
      setError(`Ошибка FACEIT: ${faceitError}`);
      return;
    }

    // Link flow: server linked FACEIT to existing user
    if (linked === "true") {
      const data = {
        faceit_id: searchParams.get("faceit_id") ?? null,
        faceit_elo: searchParams.get("faceit_elo") ? parseInt(searchParams.get("faceit_elo")!) : null,
        faceit_level: searchParams.get("faceit_level") ? parseInt(searchParams.get("faceit_level")!) : null,
        avatar_url: searchParams.get("avatar_url") ?? undefined,
      };
      // If in popup — notify parent and close
      if (window.opener) {
        window.opener.postMessage({ type: "faceit_linked", ...data }, window.location.origin);
        window.close();
      } else {
        // Opened directly (e.g. mobile redirect) — update and go to profile
        updateUser(data);
        navigate("/profile", { replace: true });
      }
      return;
    }

    // Normal login flow
    const at = searchParams.get("at");
    const uEncoded = searchParams.get("u");

    if (!at || !uEncoded) {
      navigate("/auth", { replace: true });
      return;
    }

    try {
      const padding = (4 - uEncoded.length % 4) % 4;
      const user = JSON.parse(atob((uEncoded + "=".repeat(padding)).replace(/-/g, "+").replace(/_/g, "/")));
      login(at, user);
      navigate("/", { replace: true });
    } catch {
      setError("Ошибка обработки данных авторизации");
    }
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
