"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";

interface Msg {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
}

const STARTERS = [
  "Что съесть сегодня для энергии до вечера?",
  "Как улучшить сон, если ложусь после 1?",
  "С чего начать силовую тренировку дома?",
  "Что выпить вечером, чтобы не было тревоги?",
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
      const reply: Msg = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.reply,
        created_at: new Date().toISOString(),
      };
      setMessages((m) => [...m, reply]);
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
    <div className="flex flex-col gap-4">
      <div ref={scrollRef} className="surface p-5 max-h-[60vh] overflow-y-auto space-y-4">
        {messages.length === 0 && (
          <div>
            <div className="text-muted text-sm mb-3">
              Привет, {memberName}. Спроси что-нибудь — или попробуй один из стартеров:
            </div>
            <div className="flex flex-wrap gap-2">
              {STARTERS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="surface-2 px-3 py-2 text-sm hover:border-accent hover:text-accent transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {m.role === "assistant" && (
              <div className="shrink-0 w-8 h-8 rounded-full bg-accent/20 text-accent flex items-center justify-center">
                <Sparkles size={14} />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap leading-relaxed ${
                m.role === "user"
                  ? "bg-accent text-bg"
                  : "bg-surface2 text-text border border-border"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}

        {busy && (
          <div className="flex gap-3">
            <div className="shrink-0 w-8 h-8 rounded-full bg-accent/20 text-accent flex items-center justify-center">
              <Sparkles size={14} />
            </div>
            <div className="bg-surface2 border border-border rounded-2xl px-4 py-3 text-muted text-sm">
              Думаю...
            </div>
          </div>
        )}
      </div>

      <Card>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex gap-3 items-end"
        >
          <div className="flex-1">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
              placeholder="Напиши вопрос — Enter, чтобы отправить"
              className="min-h-[64px]"
            />
          </div>
          <Button type="submit" disabled={busy || !input.trim()}>
            <Send size={16} />
          </Button>
        </form>
      </Card>
    </div>
  );
}
