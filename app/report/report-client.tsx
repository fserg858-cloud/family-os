"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePreferences } from "@/components/preferences-provider";

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
  const { t } = usePreferences();
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
      setErr(data.error ?? t("common.error"));
      return;
    }
    setReport({ summary: data.summary, highlights: data.highlights ?? [] });
  }

  return (
    <div className="surface p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] uppercase tracking-widest text-muted">{t("report.ai_overview")}</span>
        <Button onClick={generate} disabled={busy} size="sm">
          <Sparkles size={14} /> {report ? t("report.refresh") : t("report.generate")}
        </Button>
      </div>

      {err && (
        <div className="text-sm text-danger bg-danger/10 border border-danger/30 rounded-xl px-3 py-2 mb-3">
          {err}
        </div>
      )}

      {!report && !busy && (
        <div className="text-sm text-muted">
          {t("report.help")}
        </div>
      )}

      {busy && <div className="text-muted">{t("common.thinking")}</div>}

      {report && (
        <div className="text-[14px] whitespace-pre-wrap leading-relaxed">{report.summary}</div>
      )}
    </div>
  );
}
