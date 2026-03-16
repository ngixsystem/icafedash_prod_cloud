import { useRef, useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";

const FACEIT_CLIENT_ID = "38961025-aebd-41f7-8424-86879eb9f6af";
const FACEIT_REDIRECT_URI = "https://cloud.icafedash.com/api/auth/faceit/oauth-callback";

export function useFaceitLink() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const popupRef = useRef<Window | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const verifierRef = useRef<string>("");
  const { token, updateUser } = useAuth();

  const stopPoll = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (popupRef.current && !popupRef.current.closed) popupRef.current.close();
    setLoading(false);
  };

  const exchangeCode = (code: string) => {
    fetch("/api/public/profile/faceit/link", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ code, redirect_uri: FACEIT_REDIRECT_URI, code_verifier: verifierRef.current }),
    })
      .then(async (res) => { const d = await res.json(); if (!res.ok) throw new Error(d.message); return d; })
      .then((d) => {
        updateUser({
          faceit_id: d.faceit_id,
          faceit_elo: d.faceit_elo,
          faceit_level: d.faceit_level,
          avatar_url: d.avatar_url,
        });
      })
      .catch((e) => setError(e.message));
  };

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (!e.origin.includes("faceit.com")) return;
      const data = e.data;
      if (!data) return;
      const code = data.code || (typeof data === "string" && data.includes("code=")
        ? new URLSearchParams(data).get("code") : null);
      if (code) { stopPoll(); exchangeCode(code); }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [token]);

  const start = async () => {
    setLoading(true);
    setError(null);

    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    const verifier = btoa(String.fromCharCode(...array))
      .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
    verifierRef.current = verifier;

    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
    const challenge = btoa(String.fromCharCode(...new Uint8Array(digest)))
      .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");

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
        const code = params.get("code");
        const err = params.get("error");
        if (!code && !err) return;
        stopPoll();
        if (err) { setError("Авторизация отменена"); return; }
        exchangeCode(code!);
      } catch { /* cross-origin */ }
    }, 300);
  };

  return { start, loading, error };
}
