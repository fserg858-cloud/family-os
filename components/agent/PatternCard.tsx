"use client";

import { Trash2 } from "lucide-react";
import type { AgentPattern } from "@/lib/agent/types";

const TYPE_LABEL: Record<string, string> = {
  behavior: "Поведение",
  preference: "Предпочтение",
  trigger: "Триггер",
  correlation: "Корреляция",
  ritual: "Ритуал",
};

function colorFor(conf: number): string {
  if (conf >= 0.8) return "#4CAF50";
  if (conf >= 0.6) return "#FFB02E";
  return "#8E8E93";
}

export function PatternCard({
  pattern,
  onDelete,
}: {
  pattern: AgentPattern;
  onDelete: (id: string) => void;
}) {
  const conf = Number(pattern.confidence ?? 0);
  const color = colorFor(conf);
  return (
    <div className="surface p-3">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[14px] font-medium truncate">{pattern.pattern_key}</span>
            <span
              className="text-[10px] px-2 py-0.5 rounded-full"
              style={{ background: color + "22", color }}
            >
              {TYPE_LABEL[pattern.pattern_type] ?? pattern.pattern_type}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full bg-surface2 overflow-hidden">
              <div
                className="h-full transition-[width] duration-500"
                style={{ width: `${Math.round(conf * 100)}%`, background: color }}
              />
            </div>
            <span className="text-[10px] text-muted">{Math.round(conf * 100)}%</span>
          </div>
          <div className="text-[10px] text-muted mt-1.5">
            Подтверждено {pattern.occurrences ?? 1} раз
            {pattern.last_confirmed_at && (
              <> · {new Date(pattern.last_confirmed_at).toLocaleDateString("ru-RU")}</>
            )}
          </div>
        </div>
        <button
          onClick={() => onDelete(pattern.id)}
          className="text-muted hover:text-danger p-1"
          aria-label="Удалить"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
