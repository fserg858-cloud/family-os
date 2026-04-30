"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    onTelegramAuth?: (user: TelegramUser) => void;
  }
}

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

interface Props {
  botName: string;
  onAuth: (user: TelegramUser) => void;
  size?: "small" | "medium" | "large";
  cornerRadius?: number;
  requestAccess?: boolean;
}

export function TelegramLogin({
  botName,
  onAuth,
  size = "large",
  cornerRadius = 12,
  requestAccess = true,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    window.onTelegramAuth = onAuth;
    return () => {
      if (window.onTelegramAuth === onAuth) {
        window.onTelegramAuth = undefined;
      }
    };
  }, [onAuth]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    if (el.querySelector("script")) return;

    const script = document.createElement("script");
    script.async = true;
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.setAttribute("data-telegram-login", botName);
    script.setAttribute("data-size", size);
    script.setAttribute("data-radius", String(cornerRadius));
    script.setAttribute("data-userpic", "false");
    if (requestAccess) script.setAttribute("data-request-access", "write");
    script.setAttribute("data-onauth", "onTelegramAuth(user)");
    el.appendChild(script);
  }, [botName, size, cornerRadius, requestAccess]);

  return <div ref={containerRef} className="flex justify-center" />;
}
