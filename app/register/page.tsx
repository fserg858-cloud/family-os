"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { MEMBER_LIST, MEMBERS, type MemberKey } from "@/lib/members";
import { cn } from "@/lib/utils";
import { TelegramButton } from "@/components/telegram-button";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [memberKey, setMemberKey] = useState<MemberKey>("fedor");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const sb = createClient();
    const m = MEMBERS[memberKey];

    const { data, error: signUpErr } = await sb.auth.signUp({
      email,
      password,
      options: { data: { member_key: memberKey, display_name: m.display_name } },
    });

    if (signUpErr) {
      setError(signUpErr.message);
      setLoading(false);
      return;
    }

    const userId = data.user?.id;
    if (userId) {
      const { error: insertErr } = await sb.from("users").insert({
        id: userId,
        email,
        member_key: memberKey,
        display_name: m.display_name,
        age: m.age,
        ui_profile: m.ui_profile,
      });
      if (insertErr) {
        console.warn("profile insert failed:", insertErr.message);
      }
    }

    setLoading(false);
    if (data.session) {
      router.push("/dashboard");
      router.refresh();
    } else {
      router.push("/login?confirm=1");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-5 py-10">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">Кто ты в семье?</h1>
          <p className="text-sm text-muted mt-2">Выбери свой аватар</p>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          {MEMBER_LIST.map((m) => {
            const active = memberKey === m.key;
            return (
              <button
                key={m.key}
                type="button"
                onClick={() => setMemberKey(m.key)}
                className={cn(
                  "flex flex-col items-center gap-2 py-4 rounded-2xl transition-colors",
                  active ? "bg-surface ring-2" : "bg-surface/60",
                )}
                style={{ ...(active ? { boxShadow: `0 0 0 2px ${m.color}` } : {}) }}
              >
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center text-3xl border"
                  style={{ background: m.color + "33", borderColor: m.color, color: m.color }}
                >
                  {m.emoji}
                </div>
                <div className="text-[12px] font-medium" style={{ color: active ? m.color : "#FFF" }}>
                  {m.display_name}
                </div>
                <div className="text-[10px] text-muted -mt-1">{m.role}</div>
              </button>
            );
          })}
        </div>

        <div className="mb-5">
          <TelegramButton memberKey={memberKey} />
        </div>

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted uppercase tracking-widest">или email</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label>Email</Label>
            <Input
              type="email"
              required
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
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Минимум 6 символов"
            />
          </div>

          {error && (
            <div className="text-sm text-danger bg-danger/10 border border-danger/30 rounded-xl px-3 py-2">
              {error}
            </div>
          )}

          <Button type="submit" disabled={loading} block size="lg">
            {loading ? "Создание..." : "Создать аккаунт"}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-muted">
          Уже есть аккаунт?{" "}
          <Link href="/login" className="text-accent">
            Войти
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
