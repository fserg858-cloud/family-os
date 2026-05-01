"use client";

import { useState, useEffect, useRef } from "react";
import { usePreferences } from "./preferences-provider";

interface Props {
  onSuccess?: (redirectUrl: string) => void;
}

const TELEGRAM_ICON = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <path
      d="M21.94 4.34l-3.05 14.4c-.23 1.02-.83 1.27-1.68.79l-4.65-3.43-2.24 2.16c-.25.25-.46.46-.94.46l.34-4.78 8.7-7.86c.38-.34-.08-.53-.59-.19L7.06 11.7l-4.63-1.45c-1.01-.32-1.03-1.01.21-1.5L20.5 2.66c.84-.32 1.58.2 1.44 1.68z"
      fill="currentColor"
    />
  </svg>
);

export function TelegramButton({ onSuccess }: Props) {
  const { t } = usePreferences();
  const [state, setState] = useState<"idle" | "waiting" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [deeplink, setDeeplink] = useState<string | null>(null);
  const pollerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (pollerRef.current) clearInterval(pollerRef.current);
    };
  }, []);

  async function start() {
    setState("waiting");
    setError(null);
    try {
      const r = await fetch("/api/auth/tg-start", { method: "POST" });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? "tg-start failed");

      setDeeplink(data.deeplink);
      // Открываем чат с ботом в новой вкладке (на мобиле — открывает Telegram app)
      window.open(data.deeplink, "_blank", "noopener,noreferrer");

      // Поллим бэкенд раз в 2 сек
      const token = data.token as string;
      pollerRef.current = setInterval(async () => {
        try {
          const p = await fetch(`/api/auth/tg-poll?token=${encodeURIComponent(token)}`);
          const pd = await p.json();
          if (pd.status === "ok") {
            if (pollerRef.current) clearInterval(pollerRef.current);
            const redirectUrl = pd.redirect || "/dashboard";
            if (onSuccess) onSuccess(redirectUrl);
            else window.location.href = redirectUrl;
          } else if (pd.status === "expired") {
            if (pollerRef.current) clearInterval(pollerRef.current);
            setState("error");
            setError(t("tg.expired"));
          }
        } catch {
          /* keep polling */
        }
      }, 2000);
    } catch (e: any) {
      setState("error");
      setError(e.message);
    }
  }

  if (state === "waiting") {
    return (
      <div className="surface p-4 text-center">
        <div className="text-sm font-medium mb-1">{t("tg.open_and_start")}</div>
        <div className="text-xs text-muted mb-3">
          {t("tg.after_confirm")}
        </div>
        <div className="inline-flex items-center gap-2 text-[#2AABEE] text-sm">
          <span className="inline-block w-2 h-2 rounded-full bg-[#2AABEE] animate-pulse" />
          {t("tg.waiting")}
        </div>
        {deeplink && (
          <div className="mt-3">
            <a
              href={deeplink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#2AABEE] underline"
            >
              {t("tg.fallback")}
            </a>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={start}
        className="flex items-center justify-center gap-2 w-full py-4 rounded-xl text-white font-medium transition-transform active:scale-[0.98]"
        style={{ background: "#2AABEE" }}
      >
        {TELEGRAM_ICON}
        {t("tg.login")}
      </button>
      {error && (
        <div className="text-xs text-danger mt-2 text-center">{error}</div>
      )}
    </div>
  );
}
