"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Flame, Check, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { cn } from "@/lib/utils";

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
      <div className="flex justify-end mb-3">
        <Button onClick={() => setAdding((v) => !v)} variant={adding ? "ghost" : "primary"} size="sm">
          <Plus size={14} /> {adding ? "Отмена" : "Новая"}
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
              <Label>Привычка</Label>
              <Input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="30 мин чтения"
              />
            </div>
            <div>
              <Label>Зачем</Label>
              <Textarea
                value={form.why}
                onChange={(e) => setForm({ ...form, why: e.target.value })}
                placeholder="Снижает кортизол, готовит ко сну"
              />
            </div>
            <Button type="submit" block>
              Сохранить
            </Button>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="space-y-2">
        {habits.length === 0 && (
          <div className="surface p-6 text-center text-muted text-sm">
            Пусто. Добавь первую привычку.
          </div>
        )}
        {habits.map((h, i) => {
          const isDone = done.has(h.id);
          return (
            <motion.div key={h.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <div className="surface p-3 flex items-center gap-3">
                <button
                  onClick={() => logDone(h.id)}
                  disabled={isDone}
                  className={cn(
                    "shrink-0 w-11 h-11 rounded-full flex items-center justify-center transition-colors",
                    isDone ? "bg-success/20 text-success" : "bg-accent/15 text-accent",
                  )}
                >
                  {isDone ? <Check size={18} /> : <Flame size={18} />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className={cn("text-[15px]", isDone && "text-muted line-through")}>
                    {h.title}
                  </div>
                  {h.why && <div className="text-[11px] text-muted mt-0.5 line-clamp-1">{h.why}</div>}
                </div>
                <div className="text-right">
                  <div className="text-xl font-semibold text-accent">{h.streak}</div>
                  <div className="text-[10px] text-muted uppercase tracking-widest">стрик</div>
                </div>
                <button
                  onClick={() => remove(h.id)}
                  className="text-muted hover:text-danger p-1"
                  aria-label="Удалить"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
