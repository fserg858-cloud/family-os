"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { TaskCard, type TaskCardData } from "@/components/task-card";
import { cn } from "@/lib/utils";
import { usePreferences } from "@/components/preferences-provider";

interface Member {
  id: string;
  display_name: string;
  member_key: string;
}

type Filter = "all" | "active" | "done";

export function TasksClient({
  initial,
  members,
  currentUserId,
}: {
  initial: any[];
  members: Member[];
  currentUserId: string;
}) {
  const router = useRouter();
  const { t } = usePreferences();
  const [tasks, setTasks] = useState<any[]>(initial);
  const [filter, setFilter] = useState<Filter>("active");
  const memberMap = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);

  const filtered = useMemo(() => {
    if (filter === "all") return tasks;
    if (filter === "done") return tasks.filter((t) => t.status === "done");
    return tasks.filter((t) => t.status !== "done");
  }, [tasks, filter]);

  async function complete(id: string) {
    setTasks((p) => p.map((t) => (t.id === id ? { ...t, status: "done" } : t)));
    await fetch("/api/tasks", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, status: "done" }),
    });
    router.refresh();
  }

  async function remove(id: string) {
    setTasks((p) => p.filter((t) => t.id !== id));
    await fetch(`/api/tasks?id=${id}`, { method: "DELETE" });
  }

  const FILTERS: { key: Filter; label: string }[] = [
    { key: "all", label: t("tasks.filter.all") },
    { key: "active", label: t("tasks.filter.active") },
    { key: "done", label: t("tasks.filter.done") },
  ];

  return (
    <div>
      <div className="flex gap-2 mb-4 sticky top-[60px] z-20 bg-bg/90 backdrop-blur py-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "flex-1 py-2 rounded-xl text-sm transition-colors",
              filter === f.key ? "bg-accent text-white" : "bg-surface text-text",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="popLayout">
        <div className="space-y-2">
          {filtered.length === 0 && (
            <div className="surface p-6 text-center text-muted text-sm">
              {t("tasks.empty")}
            </div>
          )}
          {filtered.map((t, i) => {
            const ass = t.assigned_to ? memberMap.get(t.assigned_to) : null;
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 30 }}
                transition={{ delay: i * 0.04, type: "spring", stiffness: 400, damping: 30 }}
              >
                <TaskCard
                  task={t as TaskCardData}
                  memberKey={ass?.member_key ?? null}
                  onComplete={complete}
                  onDelete={remove}
                />
              </motion.div>
            );
          })}
        </div>
      </AnimatePresence>
    </div>
  );
}
