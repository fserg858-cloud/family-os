"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { TelegramLogin, type TelegramUser } from "@/components/telegram-login";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const botName = process.env.NEXT_PUBLIC_TELEGRAM_BOT_NAME;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const sb = createClient();
    const { error } = await sb.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  async function onTelegramAuth(user: TelegramUser) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/telegram", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tg_data: user }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "telegram auth failed");

      const sb = createClient();
      const r = await sb.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });
      if (r.error) throw new Error(r.error.message);
      router.push("/dashboard");
      router.refresh();
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-5">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <div className="inline-block w-20 h-20 rounded-3xl bg-accent/15 mb-5 flex items-center justify-center text-4xl">
            🏠
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">XS.Family</h1>
          <p className="text-sm text-muted mt-2">Семейный хаб для всех</p>
        </div>

        {botName && (
          <div className="mb-6">
            <TelegramLogin botName={botName} onAuth={onTelegramAuth} />
            <div className="text-center text-xs text-muted mt-3">
              Или войди через email
            </div>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label>Email</Label>
            <Input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@family.os"
            />
          </div>
          <div>
            <Label>Пароль</Label>
            <Input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <div className="text-sm text-danger bg-danger/10 border border-danger/30 rounded-xl px-3 py-2">
              {error}
            </div>
          )}

          <Button type="submit" disabled={loading} block size="lg">
            {loading ? "Вход..." : "Войти"}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-muted">
          Нет аккаунта?{" "}
          <Link href="/register" className="text-accent">
            Зарегистрироваться
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
