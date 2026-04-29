"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Check, Trash2 } from "lucide-react";
import { Card, CardLabel } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";

interface Goal {
  id: string;
  title: string;
  description: string | null;
  horizon: "daily" | "weekly" | "monthly" | "yearly";
  progress: number;
  status: "active" | "done" | "paused";
}

const HORIZON_LABEL: Record<Goal["horizon"], string> = {
  daily: "День",
  weekly: "Неделя",
  monthly: "Месяц",
  yearly: "Год",
};

export function GoalsClient({ initial }: { initial: Goal[] }) {
  const router = useRouter();
  const [goals, setGoals] = useState<Goal[]>(initial);
  const [adding, setAdding] = useState(false);
  const [pending, start] = useTransition();
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
    if (progress >= 100) start(() => router.refresh());
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
      <div className="flex justify-end mb-4">
        <Button onClick={() => setAdding((v) => !v)} variant={adding ? "ghost" : "primary"}>
          <Plus size={16} /> {adding ? "Отмена" : "Новая цель"}
        </Button>
      </div>

      <AnimatePresence>
        {adding && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={create}
            className="surface p-5 mb-6 space-y-4 overflow-hidden"
          >
            <div>
              <Label>Цель</Label>
              <Input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Например: Подтянуться 10 раз"
              />
            </div>
            <div>
              <Label>Горизонт</Label>
              <Select
                value={form.horizon}
                onChange={(e) => setForm({ ...form, horizon: e.target.value as Goal["horizon"] })}
              >
                <option value="daily">Дневная</option>
                <option value="weekly">Недельная</option>
                <option value="monthly">Месячная</option>
                <option value="yearly">Годовая</option>
              </Select>
            </div>
            <div>
              <Label>Описание</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Зачем эта цель и как ты поймёшь, что она достигнута"
              />
            </div>
            <Button type="submit" disabled={pending}>
              Сохранить
            </Button>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="space-y-6">
        {(Object.keys(HORIZON_LABEL) as Goal["horizon"][]).map((h) => (
          <section key={h}>
            <CardLabel>{HORIZON_LABEL[h]}</CardLabel>
            <div className="mt-3 space-y-3">
              {grouped[h].length === 0 && (
                <div className="text-muted text-sm">Нет целей</div>
              )}
              {grouped[h].map((g) => (
                <Card key={g.id}>
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-text">{g.title}</span>
                        {g.status === "done" && <Check size={16} className="text-success" />}
                      </div>
                      {g.description && (
                        <div className="text-sm text-muted mt-1">{g.description}</div>
                      )}
                      <div className="mt-3 flex items-center gap-3">
                        <Progress value={Number(g.progress)} className="flex-1" />
                        <input
                          type="range"
                          min={0}
                          max={100}
                          step={5}
                          value={Number(g.progress)}
                          onChange={(e) => updateProgress(g.id, Number(e.target.value))}
                          className="w-32 accent-accent"
                        />
                        <span className="text-sm text-muted w-10 text-right">
                          {Math.round(Number(g.progress))}%
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => remove(g.id)}
                      className="text-muted hover:text-danger p-2"
                      aria-label="Удалить"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
