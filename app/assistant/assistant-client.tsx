"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";

interface Msg {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
}

const STARTERS = [
  "Что съесть сегодня для энергии?",
  "Как улучшить сон?",
  "С чего начать тренировку?",
  "Что снизит тревогу вечером?",
];

export function AssistantClient({ history, memberName }: { history: Msg[]; memberName: string }) {
  const [messages, setMessages] = useState<Msg[]>(history);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  async function send(text: string) {
    if (!text.trim() || busy) return;
    const userMsg: Msg = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      created_at: new Date().toISOString(),
    };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setBusy(true);

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Ошибка");
      setMessages((m) => [
        ...m,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.reply,
          created_at: new Date().toISOString(),
        },
      ]);
    } catch (e: any) {
      setMessages((m) => [
        ...m,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: `Ошибка: ${e.message}`,
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div ref={scrollRef} className="surface p-4 max-h-[60vh] overflow-y-auto space-y-3">
        {messages.length === 0 && (
          <div>
            <div className="text-sm text-muted mb-3">Привет, {memberName}. Спроси что-нибудь:</div>
            <div className="flex flex-wrap gap-2">
              {STARTERS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="px-3 py-2 text-xs rounded-full bg-surface2 hover:bg-accent/20"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {m.role === "assistant" && (
              <div className="shrink-0 w-7 h-7 rounded-full bg-accent/20 text-accent flex items-center justify-center">
                <Sparkles size={14} />
              </div>
            )}
            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-wrap leading-relaxed ${
                m.role === "user" ? "bg-accent text-white" : "bg-surface2 text-text"
              }`}
            >
              {m.content}
            </div>
          </motion.div>
        ))}

        {busy && (
          <div className="flex gap-2">
            <div className="shrink-0 w-7 h-7 rounded-full bg-accent/20 text-accent flex items-center justify-center">
              <Sparkles size={14} />
            </div>
            <div className="bg-surface2 rounded-2xl px-4 py-2.5 text-muted text-sm">Думаю...</div>
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex gap-2 items-end"
      >
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(input);
            }
          }}
          placeholder="Спроси меня…"
          className="min-h-[56px]"
        />
        <Button type="submit" disabled={busy || !input.trim()}>
          <Send size={16} />
        </Button>
      </form>
    </div>
  );
}
