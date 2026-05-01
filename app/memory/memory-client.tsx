"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, ThumbsUp, ThumbsDown } from "lucide-react";
import { PatternCard } from "@/components/agent/PatternCard";
import { Button } from "@/components/ui/button";
import type { AgentDecision, AgentPattern } from "@/lib/agent/types";
import { usePreferences } from "@/components/preferences-provider";
import { dateLocale, type TKey } from "@/lib/i18n";

const OUTCOME_STYLE: Record<string, { bg: string; color: string; labelKey: TKey }> = {
  positive: { bg: "#4CAF5022", color: "#4CAF50", labelKey: "memory.useful" },
  negative: { bg: "#FF3B3022", color: "#FF3B30", labelKey: "memory.useless" },
  pending: { bg: "#8E8E9322", color: "#8E8E93", labelKey: "memory.unrated" },
};

interface MemoryRow {
  id: string;
  memory_type?: string | null;
  content?: string | null;
  value?: string | null;
  key?: string | null;
  created_at: string;
}

export function MemoryClient({
  initialPatterns,
  initialDecisions,
  initialInsights,
}: {
  initialPatterns: AgentPattern[];
  initialDecisions: AgentDecision[];
  initialInsights: MemoryRow[];
}) {
  const { t, locale } = usePreferences();
  const [patterns, setPatterns] = useState(initialPatterns);
  const [decisions, setDecisions] = useState(initialDecisions);
  const [insights, setInsights] = useState(initialInsights);
  const [busy, setBusy] = useState(false);

  async function deletePattern(id: string) {
    setPatterns((p) => p.filter((x) => x.id !== id));
    await fetch("/api/agent/memory", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "pattern", id }),
    });
  }

  async function deleteMemory(id: string) {
    setInsights((p) => p.filter((x) => x.id !== id));
    await fetch("/api/agent/memory", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "memory", id }),
    });
  }

  async function deleteDecision(id: string) {
    setDecisions((p) => p.filter((x) => x.id !== id));
    await fetch("/api/agent/memory", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "decision", id }),
    });
  }

  async function rate(decisionId: string, outcome: "positive" | "negative") {
    setDecisions((p) => p.map((d) => (d.id === decisionId ? { ...d, outcome } : d)));
    await fetch("/api/agent/memory", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision_id: decisionId, outcome }),
    });
  }

  async function clearAll() {
    if (!confirm(t("memory.confirm_clear"))) return;
    setBusy(true);
    await fetch("/api/agent/memory", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    setPatterns([]);
    setDecisions([]);
    setInsights([]);
    setBusy(false);
  }

  return (
    <div className="space-y-6">
      <section>
        <h3 className="text-[13px] uppercase tracking-[0.16em] text-muted font-medium mb-3">
          {t("memory.patterns")}
        </h3>
        <div className="space-y-2">
          {patterns.length === 0 && (
            <div className="surface p-4 text-center text-sm text-muted">
              {t("memory.patterns_empty")}
            </div>
          )}
          <AnimatePresence mode="popLayout">
            {patterns.map((p) => (
              <motion.div
                key={p.id}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 30 }}
              >
                <PatternCard pattern={p} onDelete={deletePattern} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </section>

      <section>
        <h3 className="text-[13px] uppercase tracking-[0.16em] text-muted font-medium mb-3">
          {t("memory.decisions")}
        </h3>
        <div className="space-y-2">
          {decisions.length === 0 && (
            <div className="surface p-4 text-center text-sm text-muted">{t("memory.decisions_empty")}</div>
          )}
          <AnimatePresence mode="popLayout">
            {decisions.map((d) => {
              const style = OUTCOME_STYLE[d.outcome] ?? OUTCOME_STYLE.pending;
              return (
                <motion.div
                  key={d.id}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 30 }}
                  className="surface p-3"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full"
                      style={{ background: style.bg, color: style.color }}
                    >
                      {t(style.labelKey)}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted">
                        {t("memory.used_times")} {d.used_count ?? 0}
                      </span>
                      <button
                        onClick={() => deleteDecision(d.id)}
                        className="text-muted hover:text-danger p-1"
                        aria-label={t("common.delete")}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                  <div className="text-[13px] font-medium leading-snug">
                    {d.question_normalized}
                  </div>
                  <div className="text-[12px] text-muted mt-1 line-clamp-3">
                    {d.decision.slice(0, 200)}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" variant="ghost" onClick={() => rate(d.id, "positive")}>
                      <ThumbsUp size={12} /> {t("memory.useful")}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => rate(d.id, "negative")}>
                      <ThumbsDown size={12} /> {t("memory.useless")}
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </section>

      <section>
        <h3 className="text-[13px] uppercase tracking-[0.16em] text-muted font-medium mb-3">
          {t("memory.history")}
        </h3>
        <div className="space-y-2">
          {insights.length === 0 && (
            <div className="surface p-4 text-center text-sm text-muted">{t("memory.history_empty")}</div>
          )}
          {insights.map((m) => (
            <div key={m.id} className="surface p-3 flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="text-[11px] text-muted">
                  {m.memory_type ?? m.key ?? "fact"} · {new Date(m.created_at).toLocaleDateString(dateLocale(locale))}
                </div>
                <div className="text-[13px] mt-1 line-clamp-3 whitespace-pre-wrap">
                  {m.content ?? m.value ?? ""}
                </div>
              </div>
              <button
                onClick={() => deleteMemory(m.id)}
                className="text-muted hover:text-danger p-1"
                aria-label={t("common.delete")}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </section>

      <Button onClick={clearAll} disabled={busy} variant="danger" block>
        <Trash2 size={14} /> {t("memory.clear_all")}
      </Button>
    </div>
  );
}
