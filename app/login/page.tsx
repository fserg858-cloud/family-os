"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="surface w-full max-w-md p-8"
      >
        <div className="display text-4xl text-accent tracking-[0.2em] text-center">
          FAMILY OS
        </div>
        <div className="text-xs text-muted text-center mt-2 mb-8">
          Семейная операционная система
        </div>
        <div className="gold-line mb-8" />

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
            <div className="text-sm text-danger border border-danger/30 bg-danger/10 px-3 py-2 rounded-lg">
              {error}
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Вход..." : "Войти"}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-muted">
          Нет аккаунта?{" "}
          <Link href="/register" className="accent-text hover:underline">
            Зарегистрироваться
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
