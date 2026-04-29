"use client";

import { useState } from "react";
import { ProactiveMessage } from "@/components/agent/ProactiveMessage";
import type { ProactiveMessage as ProactiveMessageT } from "@/lib/agent/types";

export function ProactiveSlot({ initial }: { initial: ProactiveMessageT }) {
  const [msg, setMsg] = useState<ProactiveMessageT | null>(initial);

  async function markRead(id: string) {
    setMsg((cur) => (cur ? { ...cur, read_at: new Date().toISOString() } : null));
    await fetch("/api/agent/proactive-actions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "read", id }),
    }).catch(() => {});
  }

  async function dismiss(id: string) {
    setMsg(null);
    await fetch("/api/agent/proactive-actions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "dismiss", id }),
    }).catch(() => {});
  }

  if (!msg) return null;
  return <ProactiveMessage message={msg} onRead={markRead} onDismiss={dismiss} />;
}
