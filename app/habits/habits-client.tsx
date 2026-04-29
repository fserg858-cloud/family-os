"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Flame, Check, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";

interface Habit {
  id: string;
  title: string;
  why: string | null;
  cadence: "daily" | "weekly";
  streak: number;
  best_streak: number;
  xp_per_log: number;
}

export function HabitsClient({
  initial,
  doneToday,
}: {
  initial: Habit[];
  doneToday: string[];
}) {
  const router = useRouter();
  const [habits, setHabits] = useState<Habit[]>(initial);
  const [done, setDone] = useState<Set<string>>(new Set(doneToday));
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ title: "", why: "" });

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    const res = await fetch("/api/habits", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ kind: "create", ...form }),
    });
    if (res.ok) {
      const h = await res.json();
      setHabits((p) => [...p, h]);
      setForm({ title: "", why: "" });
      setAdding(false);
    }
  }

  async function logDone(id: string) {
    if (done.has(id)) return;
    setDone((prev) => new Set(prev).add(id));
    setHabits((prev) => prev.map((h) => (h.id === id ? { ...h, streak: h.streak + 1 } : h)));
    await fetch("/api/habits", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ kind: "log", habit_id: id }),
    });
    router.refresh();
  }

  async function remove(id: string) {
    setHabits((p) => p.filter((h) => h.id !== id));
    await fetch(`/api/habits?id=${id}`, { method: "DELETE" });
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button onClick={() => setAdding((v) => !v)} variant={adding ? "ghost" : "primary"}>
          <Plus size={16} /> {adding ? "Отмена" : "Новая привычка"}
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
              <Label>Привычка</Label>
              <Input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Например: 30 мин чтения перед сном"
              />
            </div>
            <div>
              <Label>Зачем (биологический смысл)</Label>
              <Textarea
                value={form.why}
                onChange={(e) => setForm({ ...form, why: e.target.value })}
                placeholder="Снижает кортизол, готовит мозг ко сну"
              />
            </div>
            <Button type="submit">Сохранить</Button>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="space-y-3">
        {habits.length === 0 && (
          <Card className="text-center text-muted">Пока пусто. Добавь первую.</Card>
        )}
        {habits.map((h) => {
          const isDone = done.has(h.id);
          return (
            <motion.div key={h.id} layout>
              <Card>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => logDone(h.id)}
                    disabled={isDone}
                    className={`shrink-0 w-12 h-12 rounded-full border-2 flex items-center justify-center transition-colors ${
                      isDone
                        ? "border-success bg-success/20 text-success"
                        : "border-accent text-accent hover:bg-accent/10"
                    }`}
                    aria-label="Отметить выполненной"
                  >
                    {isDone ? <Check size={20} /> : <Flame size={20} />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="text-text">{h.title}</div>
                    {h.why && <div className="text-xs text-muted mt-1">{h.why}</div>}
                  </div>
                  <div className="text-right">
                    <div className="display text-2xl text-accent">{h.streak}</div>
                    <div className="text-[10px] text-muted uppercase tracking-widest">стрик</div>
                  </div>
                  <button
                    onClick={() => remove(h.id)}
                    className="text-muted hover:text-danger p-2"
                    aria-label="Удалить"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
