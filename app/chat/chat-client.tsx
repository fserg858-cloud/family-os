"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Image as ImageIcon, Send, Trash2 } from "lucide-react";
import { MemberAvatar } from "@/components/member-avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { usePreferences } from "@/components/preferences-provider";
import { dateLocale } from "@/lib/i18n";
import { getMember } from "@/lib/members";

interface Message {
  id: string;
  sender_id: string;
  body: string | null;
  attachment_url: string | null;
  attachment_type: string | null;
  created_at: string;
}

interface Member {
  id: string;
  display_name: string;
  member_key: string;
}

export function ChatClient({
  initial,
  members,
  currentUserId,
}: {
  initial: Message[];
  members: Member[];
  currentUserId: string;
}) {
  const { t, locale } = usePreferences();
  const [messages, setMessages] = useState<Message[]>(initial);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastIdRef = useRef<string | null>(initial[initial.length - 1]?.id ?? null);

  const memberMap = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);
  const dl = dateLocale(locale);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  // Polling каждые 4 секунды — без realtime в стартовой версии
  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const r = await fetch("/api/chat", { cache: "no-store" });
        if (!r.ok) return;
        const data = await r.json();
        const fresh: Message[] = Array.isArray(data.messages) ? data.messages : [];
        if (fresh.length === 0) return;
        const lastFresh = fresh[fresh.length - 1].id;
        if (lastFresh !== lastIdRef.current) {
          lastIdRef.current = lastFresh;
          setMessages(fresh);
        }
      } catch {
        /* ignore */
      }
    }, 4000);
    return () => clearInterval(id);
  }, []);

  async function uploadFile(file: File): Promise<{ url: string; type: string } | null> {
    const fd = new FormData();
    fd.append("file", file);
    const r = await fetch("/api/chat/upload", { method: "POST", body: fd });
    const data = await r.json();
    if (!r.ok) {
      setError(data.error ?? t("common.error"));
      return null;
    }
    return { url: data.url, type: data.type };
  }

  async function send(opts: { body?: string; attachment?: { url: string; type: string } }) {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const r = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          body: opts.body ?? "",
          attachment_url: opts.attachment?.url ?? null,
          attachment_type: opts.attachment?.type ?? null,
        }),
      });
      const data = await r.json();
      if (!r.ok) {
        setError(data.error ?? t("common.error"));
        return;
      }
      setMessages((prev) => [...prev, data.message as Message]);
      lastIdRef.current = data.message.id;
      setText("");
    } finally {
      setBusy(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    await send({ body });
  }

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    setError(null);
    const uploaded = await uploadFile(file);
    if (uploaded) {
      await send({ body: text.trim(), attachment: uploaded });
    }
    setBusy(false);
  }

  async function remove(id: string) {
    const before = messages;
    setMessages((p) => p.filter((m) => m.id !== id));
    const r = await fetch(`/api/chat?id=${id}`, { method: "DELETE" });
    if (!r.ok) setMessages(before);
  }

  function dayLabel(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString(dl, { day: "2-digit", month: "long" });
  }

  function timeLabel(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleTimeString(dl, { hour: "2-digit", minute: "2-digit" });
  }

  let lastDay = "";

  return (
    <div className="flex flex-col gap-3">
      <div
        ref={scrollRef}
        className="surface p-3 max-h-[68vh] overflow-y-auto space-y-3"
      >
        {messages.length === 0 && (
          <div className="text-sm text-muted text-center py-6">{t("chat.empty")}</div>
        )}
        {messages.map((m) => {
          const sender = memberMap.get(m.sender_id);
          const def = sender ? getMember(sender.member_key) : null;
          const isMe = m.sender_id === currentUserId;
          const day = dayLabel(m.created_at);
          const showDay = day !== lastDay;
          lastDay = day;
          return (
            <div key={m.id}>
              {showDay && (
                <div className="text-[10px] uppercase tracking-widest text-muted text-center my-2">
                  {day}
                </div>
              )}
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn("flex gap-2", isMe ? "justify-end" : "justify-start")}
              >
                {!isMe && <MemberAvatar memberKey={sender?.member_key ?? null} size="sm" />}
                <div className={cn("max-w-[78%] flex flex-col gap-1", isMe && "items-end")}>
                  {!isMe && (
                    <div
                      className="text-[11px] font-medium"
                      style={{ color: def?.color }}
                    >
                      {sender?.display_name ?? t("common.someone")}
                    </div>
                  )}
                  <div
                    className={cn(
                      "rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-wrap leading-relaxed",
                      isMe ? "bg-accent text-white" : "bg-surface2 text-text",
                    )}
                  >
                    {m.attachment_url && m.attachment_type === "image" && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={m.attachment_url}
                        alt=""
                        className="rounded-xl max-h-72 object-cover mb-1"
                      />
                    )}
                    {m.body}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-muted">
                    <span>{timeLabel(m.created_at)}</span>
                    {isMe && (
                      <button
                        onClick={() => remove(m.id)}
                        className="hover:text-danger"
                        aria-label={t("common.delete")}
                      >
                        <Trash2 size={11} />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          );
        })}
      </div>

      {error && (
        <div className="text-sm text-danger bg-danger/10 border border-danger/30 rounded-xl px-3 py-2">
          {error}
        </div>
      )}

      <form onSubmit={onSubmit} className="flex gap-2 items-end">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={busy}
          className="shrink-0 w-12 h-12 rounded-xl bg-surface2 flex items-center justify-center disabled:opacity-50"
          aria-label={t("chat.attach_photo")}
        >
          <ImageIcon size={18} />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onPickFile}
        />
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSubmit(e as unknown as React.FormEvent);
            }
          }}
          placeholder={t("chat.placeholder")}
          className="min-h-[48px]"
        />
        <Button type="submit" disabled={busy || !text.trim()}>
          <Send size={16} />
        </Button>
      </form>
    </div>
  );
}
