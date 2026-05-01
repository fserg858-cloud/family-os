"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { TelegramButton } from "@/components/telegram-button";
import { usePreferences } from "@/components/preferences-provider";

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 32) || "user"
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const { t } = usePreferences();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError(null);
    const sb = createClient();
    const displayName = name.trim();
    const memberKey = `${slugify(displayName)}-${Math.random().toString(36).slice(2, 8)}`;

    const { data, error: signUpErr } = await sb.auth.signUp({
      email,
      password,
      options: { data: { member_key: memberKey, display_name: displayName } },
    });

    if (signUpErr) {
      setError(signUpErr.message);
      setLoading(false);
      return;
    }

    const userId = data.user?.id;
    if (userId) {
      await sb.from("users").insert({
        id: userId,
        email,
        member_key: memberKey,
        display_name: displayName,
        ui_profile: "default",
      });
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
          <div className="inline-block w-20 h-20 rounded-3xl bg-accent/15 mb-5 flex items-center justify-center text-4xl">
            🏠
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">XS.Family</h1>
          <p className="text-sm text-muted mt-2">{t("auth.tagline")}</p>
        </div>

        <div className="mb-5">
          <TelegramButton />
        </div>

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted uppercase tracking-widest">{t("auth.or_email")}</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label>{t("auth.name")}</Label>
            <Input
              required
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("auth.name_placeholder")}
            />
          </div>
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
            <Label>{t("common.password")}</Label>
            <Input
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("auth.password_placeholder")}
            />
          </div>

          {error && (
            <div className="text-sm text-danger bg-danger/10 border border-danger/30 rounded-xl px-3 py-2">
              {error}
            </div>
          )}

          <Button type="submit" disabled={loading} block size="lg">
            {loading ? t("auth.creating") : t("auth.create_account")}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-muted">
          {t("auth.have_account")}{" "}
          <Link href="/login" className="text-accent">
            {t("auth.login")}
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
