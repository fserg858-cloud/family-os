"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardLabel } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Plus, Check, Trash2, ShoppingCart, Trophy } from "lucide-react";
import { xpProgress } from "@/lib/xp";

interface Member {
  id: string;
  display_name: string;
  member_key: string;
  level: number;
  xp: number;
}
interface Task {
  id: string;
  title: string;
  description: string | null;
  status: "open" | "in_progress" | "done";
  assigned_to: string | null;
  reward_xp: number;
}
interface Shopping {
  id: string;
  item: string;
  qty: string | null;
  bought: boolean;
}
interface Challenge {
  id: string;
  title: string;
  description: string | null;
  reward_xp: number;
}
interface Progress {
  id: string;
  challenge_id: string;
  user_id: string;
  progress: number;
  completed: boolean;
}
interface Event {
  id: string;
  actor_id: string | null;
  kind: string;
  payload: any;
  created_at: string;
}

type Tab = "feed" | "tasks" | "shopping" | "challenges" | "rank";

export function FamilyClient({
  currentUserId,
  events,
  tasks: initialTasks,
  shopping: initialShop,
  challenges,
  progress: initialProgress,
  members,
}: {
  currentUserId: string;
  events: Event[];
  tasks: Task[];
  shopping: Shopping[];
  challenges: Challenge[];
  progress: Progress[];
  members: Member[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("feed");
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [shop, setShop] = useState<Shopping[]>(initialShop);
  const [progress, setProgress] = useState<Progress[]>(initialProgress);
  const [taskForm, setTaskForm] = useState({ title: "", assigned_to: "", reward_xp: 15 });
  const [shopItem, setShopItem] = useState({ item: "", qty: "" });

  const memberMap = new Map(members.map((m) => [m.id, m]));

  async function addTask(e: React.FormEvent) {
    e.preventDefault();
    if (!taskForm.title.trim()) return;
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: taskForm.title,
        assigned_to: taskForm.assigned_to || null,
        reward_xp: taskForm.reward_xp,
      }),
    });
    if (res.ok) {
      const t = await res.json();
      setTasks((p) => [t, ...p]);
      setTaskForm({ title: "", assigned_to: "", reward_xp: 15 });
      router.refresh();
    }
  }

  async function completeTask(id: string) {
    setTasks((p) => p.map((t) => (t.id === id ? { ...t, status: "done" } : t)));
    await fetch("/api/tasks", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, status: "done" }),
    });
    router.refresh();
  }

  async function deleteTask(id: string) {
    setTasks((p) => p.filter((t) => t.id !== id));
    await fetch(`/api/tasks?id=${id}`, { method: "DELETE" });
  }

  async function addShop(e: React.FormEvent) {
    e.preventDefault();
    if (!shopItem.item.trim()) return;
    const res = await fetch("/api/family/shopping", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(shopItem),
    });
    if (res.ok) {
      const s = await res.json();
      setShop((p) => [s, ...p]);
      setShopItem({ item: "", qty: "" });
    }
  }

  async function toggleShop(id: string, bought: boolean) {
    setShop((p) => p.map((s) => (s.id === id ? { ...s, bought } : s)));
    await fetch("/api/family/shopping", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, bought }),
    });
  }

  async function deleteShop(id: string) {
    setShop((p) => p.filter((s) => s.id !== id));
    await fetch(`/api/family/shopping?id=${id}`, { method: "DELETE" });
  }

  async function bumpChallenge(challenge_id: string) {
    const existing = progress.find((p) => p.challenge_id === challenge_id && p.user_id === currentUserId);
    const next = Math.min(100, (existing?.progress ?? 0) + 20);
    const res = await fetch("/api/family/challenges", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ challenge_id, progress: next }),
    });
    if (res.ok) {
      const updated = await res.json();
      setProgress((p) => {
        const without = p.filter((x) => !(x.challenge_id === challenge_id && x.user_id === currentUserId));
        return [...without, updated];
      });
      router.refresh();
    }
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: "feed", label: "Лента" },
    { key: "tasks", label: "Задачи" },
    { key: "shopping", label: "Список продуктов" },
    { key: "challenges", label: "Челленджи" },
    { key: "rank", label: "Рейтинг" },
  ];

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-6">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-xl text-sm border ${
              tab === t.key ? "bg-accent text-bg border-accent" : "border-border text-text hover:border-accent"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "feed" && (
        <div className="space-y-2">
          {events.length === 0 && <Card className="text-muted text-sm">Пока тихо. Сделай шаг — лента оживёт.</Card>}
          {events.map((e) => {
            const actor = e.actor_id ? memberMap.get(e.actor_id)?.display_name : "Кто-то";
            return (
              <Card key={e.id}>
                <div className="text-xs text-muted">{new Date(e.created_at).toLocaleString("ru-RU")}</div>
                <div className="text-text mt-1">
                  <span className="accent-text">{actor}</span>: {describeEvent(e)}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {tab === "tasks" && (
        <div>
          <Card className="mb-4">
            <form onSubmit={addTask} className="grid md:grid-cols-4 gap-3 items-end">
              <div className="md:col-span-2">
                <Label>Задача</Label>
                <Input
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  placeholder="Помыть посуду"
                />
              </div>
              <div>
                <Label>Кому</Label>
                <Select
                  value={taskForm.assigned_to}
                  onChange={(e) => setTaskForm({ ...taskForm, assigned_to: e.target.value })}
                >
                  <option value="">Любой</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.display_name}
                    </option>
                  ))}
                </Select>
              </div>
              <Button type="submit"><Plus size={16} /> Добавить</Button>
            </form>
          </Card>
          <div className="space-y-2">
            {tasks.length === 0 && <Card className="text-muted text-sm">Задач нет</Card>}
            {tasks.map((t) => (
              <Card key={t.id}>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => completeTask(t.id)}
                    disabled={t.status === "done"}
                    className={`shrink-0 w-8 h-8 rounded-full border flex items-center justify-center ${
                      t.status === "done"
                        ? "border-success bg-success/20 text-success"
                        : "border-accent text-accent hover:bg-accent/10"
                    }`}
                  >
                    <Check size={16} />
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className={t.status === "done" ? "text-muted line-through" : "text-text"}>
                      {t.title}
                    </div>
                    <div className="text-xs text-muted">
                      {t.assigned_to ? memberMap.get(t.assigned_to)?.display_name ?? "—" : "Любой"} ·
                      {" +"}{t.reward_xp} XP
                    </div>
                  </div>
                  <button onClick={() => deleteTask(t.id)} className="text-muted hover:text-danger p-2">
                    <Trash2 size={16} />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {tab === "shopping" && (
        <div>
          <Card className="mb-4">
            <form onSubmit={addShop} className="grid md:grid-cols-4 gap-3 items-end">
              <div className="md:col-span-2">
                <Label>Продукт</Label>
                <Input
                  value={shopItem.item}
                  onChange={(e) => setShopItem({ ...shopItem, item: e.target.value })}
                  placeholder="Хлеб"
                />
              </div>
              <div>
                <Label>Кол-во</Label>
                <Input
                  value={shopItem.qty}
                  onChange={(e) => setShopItem({ ...shopItem, qty: e.target.value })}
                  placeholder="2 шт"
                />
              </div>
              <Button type="submit"><ShoppingCart size={16} /> Добавить</Button>
            </form>
          </Card>
          <div className="space-y-2">
            {shop.length === 0 && <Card className="text-muted text-sm">Список пуст</Card>}
            {shop.map((s) => (
              <Card key={s.id}>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={s.bought}
                    onChange={(e) => toggleShop(s.id, e.target.checked)}
                    className="w-5 h-5 accent-accent"
                  />
                  <div className={`flex-1 ${s.bought ? "text-muted line-through" : "text-text"}`}>
                    {s.item} {s.qty && <span className="text-muted">· {s.qty}</span>}
                  </div>
                  <button onClick={() => deleteShop(s.id)} className="text-muted hover:text-danger p-2">
                    <Trash2 size={16} />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {tab === "challenges" && (
        <div className="space-y-3">
          {challenges.length === 0 && <Card className="text-muted text-sm">Активных челленджей нет</Card>}
          {challenges.map((c) => {
            const myProgress = progress.find((p) => p.challenge_id === c.id && p.user_id === currentUserId);
            const pct = Number(myProgress?.progress ?? 0);
            return (
              <Card key={c.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="text-text display text-xl">{c.title}</div>
                    {c.description && <div className="text-muted text-sm mt-1">{c.description}</div>}
                    <div className="text-xs accent-text mt-2">+{c.reward_xp} XP при завершении</div>
                  </div>
                  <Trophy className="text-accent" />
                </div>
                <Progress value={pct} className="mt-3" />
                <div className="flex items-center justify-between mt-3">
                  <div className="text-xs text-muted">{Math.round(pct)}%</div>
                  <Button onClick={() => bumpChallenge(c.id)} variant="outline">+20%</Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {tab === "rank" && (
        <div className="space-y-2">
          {members.map((m, i) => {
            const { percent, into, max } = xpProgress(m.xp);
            return (
              <Card key={m.id}>
                <div className="flex items-center gap-4">
                  <div className="display text-3xl text-accent w-8">{i + 1}</div>
                  <div className="flex-1">
                    <div className="text-text">{m.display_name}</div>
                    <div className="text-xs text-muted">Уровень {m.level} · {m.xp} XP</div>
                    <Progress value={percent} className="mt-2" />
                    <div className="text-[10px] text-muted mt-1">{into}/{max}</div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function describeEvent(e: Event) {
  switch (e.kind) {
    case "habit_logged":
      return `закрыл привычку «${e.payload?.title ?? ""}»`;
    case "task_completed":
      return `выполнил задачу «${e.payload?.title ?? ""}» (+${e.payload?.xp ?? 0} XP)`;
    case "task_created":
      return `добавил задачу «${e.payload?.title ?? ""}»`;
    case "reflection_saved":
      return "записал рефлексию";
    case "goal_completed":
      return `достиг цели «${e.payload?.title ?? ""}»`;
    case "challenge_progress":
      return `продвинулся в челлендже «${e.payload?.title ?? ""}» (${Math.round(Number(e.payload?.progress ?? 0))}%)`;
    case "shopping_added":
      return `добавил в список «${e.payload?.item ?? ""}»`;
    default:
      return e.kind;
  }
}
