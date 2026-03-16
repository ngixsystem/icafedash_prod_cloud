import { useRef, useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";

const FACEIT_CLIENT_ID = "38961025-aebd-41f7-8424-86879eb9f6af";
const FACEIT_REDIRECT_URI = "https://cloud.icafedash.com/api/auth/faceit/oauth-callback";

export function useFaceitLink() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const popupRef = useRef<Window | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { token, updateUser } = useAuth();

  const stopPoll = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (popupRef.current && !popupRef.current.closed) popupRef.current.close();
    setLoading(false);
  };

  // Listen for postMessage fallback (FaceitCallbackPage sends this if polling misses)
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      if (!e.data || e.data.type !== "faceit_linked") return;
      stopPoll();
      updateUser({
        faceit_id: e.data.faceit_id ?? null,
        faceit_elo: e.data.faceit_elo ?? null,
        faceit_level: e.data.faceit_level ?? null,
        avatar_url: e.data.avatar_url ?? undefined,
      });
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const start = async () => {
    setLoading(true);
    setError(null);

    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    const verifier = btoa(String.fromCharCode(...array))
      .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");

    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
    const challenge = btoa(String.fromCharCode(...new Uint8Array(digest)))
      .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");

    // Encode link_token so server knows to link, not login
    const state = btoa(JSON.stringify({ v: verifier, link_token: token }))
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

    const w = 480, h = 640;
    const left = Math.round(window.screenX + (window.outerWidth - w) / 2);
    const top = Math.round(window.screenY + (window.outerHeight - h) / 2);
    const popup = window.open(url, "faceit_link",
      `width=${w},height=${h},left=${left},top=${top},toolbar=no,menubar=no,location=no,status=no,scrollbars=yes`);
    popupRef.current = popup;

    pollRef.current = setInterval(() => {
      if (!popup || popup.closed) { stopPoll(); return; }
      try {
        const href = popup.location.href;
        const params = new URL(href).searchParams;

        // Server linked successfully — read data from URL params
        if (params.get("linked") === "true") {
          stopPoll();
          updateUser({
            faceit_id: params.get("faceit_id") ?? null,
            faceit_elo: params.get("faceit_elo") ? parseInt(params.get("faceit_elo")!) : null,
            faceit_level: params.get("faceit_level") ? parseInt(params.get("faceit_level")!) : null,
            avatar_url: params.get("avatar_url") ?? undefined,
          });
          return;
        }

        const err = params.get("faceit_error") || params.get("error");
        if (err) { stopPoll(); setError(err === "already_linked_to_another_account" ? "Этот FACEIT аккаунт уже привязан к другому пользователю" : "Авторизация отменена"); return; }
      } catch { /* cross-origin */ }
    }, 300);
  };

  return { start, loading, error };
}
