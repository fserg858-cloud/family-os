"use client";

import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useState } from "react";
import { Check, Trash2 } from "lucide-react";
import { MemberAvatar } from "./member-avatar";
import { CategoryBadge } from "./category-badge";
import { cn } from "@/lib/utils";

export interface TaskCardData {
  id: string;
  title: string;
  notes?: string | null;
  status: "open" | "in_progress" | "done";
  due_at?: string | null;
  category?: string | null;
  priority?: "low" | "med" | "high" | null;
  points?: number | null;
  assigned_to?: string | null;
}

interface Props {
  task: TaskCardData;
  memberKey?: string | null;
  onComplete?: (id: string) => void;
  onDelete?: (id: string) => void;
  swipe?: boolean;
}

const PRIORITY_DOT: Record<NonNullable<TaskCardData["priority"]>, string> = {
  low: "#8E8E93",
  med: "#FFB02E",
  high: "#FF3B30",
};

function formatTime(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

export function TaskCard({ task, memberKey, onComplete, onDelete, swipe = true }: Props) {
  const x = useMotionValue(0);
  const bg = useTransform(
    x,
    [-160, -80, 0, 80, 160],
    ["#FF3B30", "#FF3B30", "#3A3A3C00", "#4CAF50", "#4CAF50"],
  );
  const [done, setDone] = useState(task.status === "done");

  function handleDragEnd(_: any, info: { offset: { x: number } }) {
    const dx = info.offset.x;
    if (dx > 80 && onComplete && !done) {
      setDone(true);
      animate(x, 240, { duration: 0.2 }).then(() => onComplete(task.id));
      return;
    }
    if (dx < -80 && onDelete) {
      animate(x, -240, { duration: 0.2 }).then(() => onDelete(task.id));
      return;
    }
    animate(x, 0, { type: "spring", stiffness: 400, damping: 30 });
  }

  return (
    <div className="relative">
      <motion.div
        className="absolute inset-0 rounded-2xl flex items-center justify-between px-6 text-white text-sm font-medium"
        style={{ background: bg }}
      >
        <div className="flex items-center gap-2">
          <Check size={18} />
          Готово
        </div>
        <div className="flex items-center gap-2">
          Удалить
          <Trash2 size={18} />
        </div>
      </motion.div>

      <motion.div
        drag={swipe ? "x" : false}
        dragConstraints={{ left: -240, right: 240 }}
        dragElastic={0.15}
        style={{ x }}
        onDragEnd={handleDragEnd}
        className="surface relative px-4 py-3 flex items-center gap-3 touch-pan-y"
      >
        <button
          onClick={() => {
            if (done) return;
            setDone(true);
            onComplete?.(task.id);
          }}
          className={cn(
            "shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-colors",
            done ? "bg-success border-success text-white" : "border-muted",
          )}
          aria-label="Готово"
        >
          {done && <Check size={16} />}
        </button>

        <div className="flex-1 min-w-0">
          <div className={cn("text-[15px] leading-snug", done && "line-through text-muted")}>
            {task.title}
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {task.due_at && (
              <span className="text-[11px] text-muted">{formatTime(task.due_at)}</span>
            )}
            {task.priority && (
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: PRIORITY_DOT[task.priority] }}
              />
            )}
            {task.category && <CategoryBadge category={task.category} />}
            {typeof task.points === "number" && task.points > 0 && (
              <span className="text-[11px] accent-text" style={{ color: "#FF6B8A" }}>
                +{task.points}
              </span>
            )}
          </div>
        </div>

        {memberKey && <MemberAvatar memberKey={memberKey} size="sm" />}
      </motion.div>
    </div>
  );
}
