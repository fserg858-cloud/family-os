"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Label, Select } from "@/components/ui/input";
import { MemberAvatar } from "@/components/member-avatar";
import {
  TASK_CATEGORIES,
  TASK_PRIORITIES,
  type TaskPriority,
  type TaskCategoryKey,
  getMember,
} from "@/lib/members";
import { cn } from "@/lib/utils";
import { usePreferences } from "@/components/preferences-provider";
import { translateTaskCategory, translateTaskPriority } from "@/lib/i18n";

interface Member {
  id: string;
  display_name: string;
  member_key: string;
}

export function CreateTaskClient({
  members,
  currentUserId,
}: {
  members: Member[];
  currentUserId: string;
}) {
  const router = useRouter();
  const { t, locale } = usePreferences();
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [assignees, setAssignees] = useState<string[]>([currentUserId]);
  const [dueAt, setDueAt] = useState("");
  const [category, setCategory] = useState<TaskCategoryKey>("home");
  const [recurrence, setRecurrence] = useState("none");
  const [priority, setPriority] = useState<TaskPriority>("med");
  const [points, setPoints] = useState(10);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function toggleAssignee(id: string) {
    setAssignees((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    setErr(null);
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title,
        notes,
        assigned_to: assignees[0] ?? null,
        assignees,
        due_at: dueAt ? new Date(dueAt).toISOString() : null,
        category,
        recurrence,
        priority,
        points,
        reward_xp: points,
      }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErr(data.error ?? t("common.error"));
      return;
    }
    router.push("/tasks");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-5 pb-10">
      <div>
        <Label>{t("task.form.title")}</Label>
        <Input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t("task.form.title_placeholder")}
        />
      </div>

      <div>
        <Label>{t("task.form.note")}</Label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={t("task.form.note_placeholder")}
        />
      </div>

      <div>
        <Label>{t("task.form.assignee")}</Label>
        <div className="flex gap-2 flex-wrap">
          {members.map((m) => {
            const def = getMember(m.member_key);
            const active = assignees.includes(m.id);
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => toggleAssignee(m.id)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-2xl transition-colors",
                  active ? "bg-surface ring-2" : "bg-surface/60",
                )}
                style={active ? { boxShadow: `0 0 0 2px ${def?.color}` } : {}}
              >
                <MemberAvatar memberKey={m.member_key} size="sm" />
                <span className="text-sm" style={{ color: active ? def?.color : "#FFF" }}>
                  {m.display_name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <Label>{t("task.form.due")}</Label>
        <Input
          type="datetime-local"
          value={dueAt}
          onChange={(e) => setDueAt(e.target.value)}
        />
      </div>

      <div>
        <Label>{t("task.form.category")}</Label>
        <div className="grid grid-cols-3 gap-2">
          {TASK_CATEGORIES.map((c) => {
            const active = category === c.key;
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => setCategory(c.key)}
                className={cn(
                  "flex flex-col items-center gap-1 py-3 rounded-xl text-xs",
                  active ? "ring-2" : "bg-surface",
                )}
                style={
                  active
                    ? { background: c.color + "22", boxShadow: `0 0 0 2px ${c.color}`, color: c.color }
                    : {}
                }
              >
                <span className="text-xl">{c.icon}</span>
                {translateTaskCategory(c.key, locale)}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <Label>{t("task.form.repeat")}</Label>
        <Select value={recurrence} onChange={(e) => setRecurrence(e.target.value)}>
          <option value="none">{t("task.form.repeat.none")}</option>
          <option value="daily">{t("task.form.repeat.daily")}</option>
          <option value="weekly">{t("task.form.repeat.weekly")}</option>
          <option value="monthly">{t("task.form.repeat.monthly")}</option>
        </Select>
      </div>

      <div>
        <Label>{t("task.form.priority")}</Label>
        <div className="grid grid-cols-3 gap-2">
          {TASK_PRIORITIES.map((p) => {
            const active = priority === p.key;
            return (
              <button
                key={p.key}
                type="button"
                onClick={() => setPriority(p.key)}
                className={cn("py-3 rounded-xl text-sm font-medium", active ? "" : "bg-surface")}
                style={
                  active
                    ? { background: p.color + "22", color: p.color, boxShadow: `0 0 0 2px ${p.color}` }
                    : {}
                }
              >
                {translateTaskPriority(p.key, locale)}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <Label>{t("task.form.points")}: {points}</Label>
        <input
          type="range"
          min={5}
          max={100}
          step={5}
          value={points}
          onChange={(e) => setPoints(Number(e.target.value))}
          className="w-full accent-accent"
        />
        <div className="flex justify-between text-[11px] text-muted mt-1">
          <span>5</span>
          <span>50</span>
          <span>100</span>
        </div>
      </div>

      {err && (
        <div className="text-sm text-danger bg-danger/10 border border-danger/30 rounded-xl px-3 py-2">
          {err}
        </div>
      )}

      <Button type="submit" disabled={busy} block size="lg">
        {busy ? t("task.form.creating") : t("task.form.create")}
      </Button>
    </form>
  );
}
