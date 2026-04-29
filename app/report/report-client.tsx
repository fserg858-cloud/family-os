"use client";

import { useState } from "react";
import { Card, CardLabel } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

interface Report {
  summary: string;
  highlights: any[];
}

export function ReportClient({
  weekStart,
  initial,
}: {
  weekStart: string;
  initial: Report | null;
}) {
  const [report, setReport] = useState<Report | null>(initial);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function generate() {
    setBusy(true);
    setErr(null);
    const res = await fetch("/api/briefing", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ kind: "weekly_report", week_start: weekStart }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setErr(data.error ?? "Ошибка");
      return;
    }
    setReport({ summary: data.summary, highlights: data.highlights ?? [] });
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <CardLabel>AI-обзор недели</CardLabel>
        <Button onClick={generate} disabled={busy}>
          <Sparkles size={16} /> {report ? "Обновить" : "Сгенерировать"}
        </Button>
      </div>

      {err && (
        <div className="text-sm text-danger border border-danger/30 bg-danger/10 px-3 py-2 rounded-lg">
          {err}
        </div>
      )}

      {!report && !busy && (
        <div className="text-muted text-sm">Нажми «Сгенерировать» — Claude соберёт обзор по событиям недели.</div>
      )}

      {busy && <div className="text-muted">Думаю...</div>}

      {report && (
        <div className="text-text whitespace-pre-wrap leading-relaxed">{report.summary}</div>
      )}
    </Card>
  );
}
