"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { MEMBER_LIST, MEMBERS, type MemberKey } from "@/lib/members";

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
      options: {
        data: { member_key: memberKey, display_name: m.display_name },
      },
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
        setError(insertErr.message);
        setLoading(false);
        return;
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
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="surface w-full max-w-md p-8"
      >
        <div className="display text-4xl text-accent tracking-[0.2em] text-center">
          FAMILY OS
        </div>
        <div className="text-xs text-muted text-center mt-2 mb-8">Регистрация</div>
        <div className="gold-line mb-8" />

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label>Кто ты в семье?</Label>
            <Select value={memberKey} onChange={(e) => setMemberKey(e.target.value as MemberKey)}>
              {MEMBER_LIST.map((m) => (
                <option key={m.key} value={m.key}>
                  {m.display_name} — {m.role}
                </option>
              ))}
            </Select>
          </div>
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
            <div className="text-sm text-danger border border-danger/30 bg-danger/10 px-3 py-2 rounded-lg">
              {error}
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Создание..." : "Создать аккаунт"}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-muted">
          Уже есть аккаунт?{" "}
          <Link href="/login" className="accent-text hover:underline">
            Войти
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
