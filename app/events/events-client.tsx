"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { getMember } from "@/lib/members";
import { cn } from "@/lib/utils";
import { usePreferences } from "@/components/preferences-provider";
import { describeEvent, dateLocale, t as translate, type TKey } from "@/lib/i18n";

interface Member {
  id: string;
  display_name: string;
  member_key: string;
}

function dayKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function EventsClient({
  events,
  tasks,
  members,
}: {
  events: any[];
  tasks: any[];
  members: Member[];
}) {
  const { locale } = usePreferences();
  const tr = (k: TKey) => translate(k, locale);
  const memberMap = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);

  const days = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - 6 + i);
      return d;
    });
  }, []);

  const [selected, setSelected] = useState<string>(dayKey(new Date()));

  const dayEvents = events
    .filter((e) => dayKey(new Date(e.created_at)) === selected)
    .map((e) => ({ ...e, _desc: describeEvent(e, locale) }))
    .filter((e) => e._desc);
  const dayTasks = tasks.filter((t) => t.due_at && dayKey(new Date(t.due_at)) === selected);
  const dl = dateLocale(locale);

  return (
    <div>
      <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-5 px-5 py-2">
        {days.map((d) => {
          const k = dayKey(d);
          const active = selected === k;
          const isToday = dayKey(new Date()) === k;
          return (
            <button
              key={k}
              onClick={() => setSelected(k)}
              className={cn(
                "shrink-0 w-14 py-3 rounded-2xl flex flex-col items-center gap-1 text-xs transition-colors",
                active ? "bg-accent text-white" : "bg-surface text-text",
              )}
            >
              <span className="opacity-70 capitalize">{tr(`weekday.${d.getDay()}` as TKey)}</span>
              <span className={cn("text-lg font-semibold", isToday && !active && "text-accent")}>
                {d.getDate()}
              </span>
            </button>
          );
        })}
      </div>

      <h3 className="text-[13px] uppercase tracking-[0.16em] text-muted font-medium mt-6 mb-3">
        {tr("events.section")}
      </h3>
      <div className="space-y-2">
        {dayEvents.length === 0 && (
          <div className="surface p-4 text-center text-sm text-muted">{tr("events.empty")}</div>
        )}
        {dayEvents.map((e, i) => {
          const actor = e.actor_id ? memberMap.get(e.actor_id) : null;
          const def = actor ? getMember(actor.member_key) : null;
          return (
            <motion.div
              key={e.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="surface p-3 flex gap-3 items-start"
            >
              <div className="self-stretch w-1 rounded-full" style={{ background: def?.color ?? "#8E8E93" }} />
              <div className="flex-1 min-w-0">
                <div className="text-sm">
                  <span className="font-medium" style={{ color: def?.color ?? "#FFF" }}>
                    {actor?.display_name ?? tr("common.someone")}
                  </span>{" "}
                  <span className="text-muted">{e._desc}</span>
                </div>
                <div className="text-[10px] text-muted mt-0.5">
                  {new Date(e.created_at).toLocaleTimeString(dl, { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <h3 className="text-[13px] uppercase tracking-[0.16em] text-muted font-medium mt-6 mb-3">
        {tr("events.day_tasks")}
      </h3>
      <div className="space-y-2">
        {dayTasks.length === 0 && (
          <div className="surface p-4 text-center text-sm text-muted">{tr("events.no_tasks")}</div>
        )}
        {dayTasks.map((t) => {
          const ass = t.assigned_to ? memberMap.get(t.assigned_to) : null;
          const def = ass ? getMember(ass.member_key) : null;
          return (
            <div key={t.id} className="surface p-3 flex items-center gap-3">
              <div
                className="w-2 h-10 rounded-full"
                style={{ background: def?.color ?? "#8E8E93" }}
              />
              <div className="flex-1 min-w-0">
                <div className={cn("text-[15px]", t.status === "done" && "line-through text-muted")}>
                  {t.title}
                </div>
                <div className="text-[11px] text-muted">
                  {new Date(t.due_at).toLocaleTimeString(dl, { hour: "2-digit", minute: "2-digit" })} ·{" "}
                  {ass?.display_name ?? tr("events.any")}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
