"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { MemberCarousel } from "@/components/member-carousel";
import { TaskCard, type TaskCardData } from "@/components/task-card";
import { Progress } from "@/components/ui/progress";
import { getMember } from "@/lib/members";
import { xpProgress } from "@/lib/xp";
import { usePreferences } from "@/components/preferences-provider";
import { translateRole } from "@/lib/i18n";

interface Member {
  id: string;
  display_name: string;
  member_key: string;
  level: number;
  xp: number;
}

export function FamilyClient({
  members,
  tasks: initial,
  currentUserId,
  initialFilter,
}: {
  members: Member[];
  tasks: any[];
  currentUserId: string;
  initialFilter: string | null;
}) {
  const router = useRouter();
  const { t, locale } = usePreferences();
  const [tasks, setTasks] = useState<any[]>(initial);
  const [selected, setSelected] = useState<string | null>(initialFilter ?? null);

  const memberMap = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);

  const filtered = useMemo(() => {
    if (!selected) return tasks;
    return tasks.filter((t) => t.assigned_to === selected || t.created_by === selected);
  }, [tasks, selected]);

  async function complete(id: string) {
    setTasks((p) => p.map((t) => (t.id === id ? { ...t, status: "done" } : t)));
    await fetch("/api/tasks", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, status: "done" }),
    });
    router.refresh();
  }

  const focused = selected ? members.find((m) => m.id === selected) : null;
  const focusDef = focused ? getMember(focused.member_key) : null;

  return (
    <div>
      <MemberCarousel members={members} selected={selected} onSelect={setSelected} />

      {focused && focusDef && (
        <motion.div
          key={focused.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="surface mt-3 p-4"
          style={{ background: focusDef.color + "11", borderColor: focusDef.color + "55" }}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-semibold" style={{ color: focusDef.color }}>
                {focused.display_name}
              </div>
              <div className="text-xs text-muted">{translateRole(focused.member_key, locale)}</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-semibold">L{focused.level}</div>
              <div className="text-[11px] text-muted">{focused.xp} XP</div>
            </div>
          </div>
          <Progress value={xpProgress(focused.xp).percent} className="mt-3" color={focusDef.color} />
        </motion.div>
      )}

      <h3 className="text-[13px] uppercase tracking-[0.16em] text-muted font-medium mt-6 mb-3">
        {focused ? `${t("family.tasks")} · ${focused.display_name}` : t("family.tasks_of")}
      </h3>

      <AnimatePresence mode="popLayout">
        <div className="space-y-2">
          {filtered.length === 0 && (
            <div className="surface p-4 text-center text-sm text-muted">{t("family.no_tasks")}</div>
          )}
          {filtered.map((t, i) => {
            const ass = t.assigned_to ? memberMap.get(t.assigned_to) : null;
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: i * 0.03 }}
              >
                <TaskCard
                  task={t as TaskCardData}
                  memberKey={ass?.member_key ?? null}
                  onComplete={complete}
                  swipe={false}
                />
              </motion.div>
            );
          })}
        </div>
      </AnimatePresence>
    </div>
  );
}
