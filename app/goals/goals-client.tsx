"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Check, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { usePreferences } from "@/components/preferences-provider";
import { translateGoalHorizon } from "@/lib/i18n";

interface Goal {
  id: string;
  title: string;
  description: string | null;
  horizon: "daily" | "weekly" | "monthly" | "yearly";
  progress: number;
  status: "active" | "done" | "paused";
}

const HORIZONS: Goal["horizon"][] = ["daily", "weekly", "monthly", "yearly"];

export function GoalsClient({ initial }: { initial: Goal[] }) {
  const router = useRouter();
  const { t, locale } = usePreferences();
  const [goals, setGoals] = useState<Goal[]>(initial);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    horizon: "weekly" as Goal["horizon"],
  });

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    const res = await fetch("/api/goals", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const g = await res.json();
      setGoals((prev) => [g, ...prev]);
      setForm({ title: "", description: "", horizon: "weekly" });
      setAdding(false);
    }
  }

  async function updateProgress(id: string, progress: number) {
    setGoals((prev) =>
      prev.map((g) => (g.id === id ? { ...g, progress, status: progress >= 100 ? "done" : g.status } : g)),
    );
    await fetch("/api/goals", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, progress, status: progress >= 100 ? "done" : "active" }),
    });
    if (progress >= 100) router.refresh();
  }

  async function remove(id: string) {
    setGoals((prev) => prev.filter((g) => g.id !== id));
    await fetch(`/api/goals?id=${id}`, { method: "DELETE" });
  }

  const grouped: Record<Goal["horizon"], Goal[]> = {
    daily: [],
    weekly: [],
    monthly: [],
    yearly: [],
  };
  for (const g of goals) grouped[g.horizon].push(g);

  return (
    <div>
      <div className="flex justify-end mb-3">
        <Button onClick={() => setAdding((v) => !v)} variant={adding ? "ghost" : "primary"} size="sm">
          <Plus size={14} /> {adding ? t("common.cancel") : t("goals.new")}
        </Button>
      </div>

      <AnimatePresence>
        {adding && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={create}
            className="surface p-4 mb-4 space-y-3 overflow-hidden"
          >
            <div>
              <Label>{t("goals.form.name")}</Label>
              <Input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder={t("goals.form.name_placeholder")}
              />
            </div>
            <div>
              <Label>{t("goals.form.horizon")}</Label>
              <Select
                value={form.horizon}
                onChange={(e) => setForm({ ...form, horizon: e.target.value as Goal["horizon"] })}
              >
                <option value="daily">{translateGoalHorizon("daily", locale)}</option>
                <option value="weekly">{translateGoalHorizon("weekly", locale)}</option>
                <option value="monthly">{translateGoalHorizon("monthly", locale)}</option>
                <option value="yearly">{translateGoalHorizon("yearly", locale)}</option>
              </Select>
            </div>
            <div>
              <Label>{t("goals.form.description")}</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder={t("goals.form.description_placeholder")}
              />
            </div>
            <Button type="submit" block>
              {t("common.save")}
            </Button>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="space-y-6">
        {HORIZONS.map((h) => (
          <section key={h}>
            <div className="text-[13px] uppercase tracking-[0.16em] text-muted font-medium mb-2">
              {translateGoalHorizon(h, locale)}
            </div>
            <div className="space-y-2">
              {grouped[h].length === 0 && <div className="text-muted text-sm">{t("goals.empty")}</div>}
              {grouped[h].map((g) => (
                <div key={g.id} className="surface p-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[15px]">{g.title}</span>
                        {g.status === "done" && <Check size={16} className="text-success" />}
                      </div>
                      {g.description && (
                        <div className="text-[11px] text-muted mt-1 line-clamp-2">{g.description}</div>
                      )}
                      <div className="mt-2 flex items-center gap-3">
                        <Progress value={Number(g.progress)} className="flex-1" />
                        <input
                          type="range"
                          min={0}
                          max={100}
                          step={5}
                          value={Number(g.progress)}
                          onChange={(e) => updateProgress(g.id, Number(e.target.value))}
                          className="w-24 accent-accent"
                        />
                        <span className="text-xs text-muted w-10 text-right">
                          {Math.round(Number(g.progress))}%
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => remove(g.id)}
                      className="text-muted hover:text-danger p-1"
                      aria-label={t("common.delete")}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
