"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Send, Sparkles, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { AgentTyping } from "@/components/agent/AgentTyping";

interface Msg {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const STARTERS = [
  "Почему сложно проснуться?",
  "Как работает дофамин?",
  "Разбор моей недели",
  "Что сделать сегодня?",
  "Объясни механизм стресса",
  "Как улучшить сон?",
];

interface InitialMsg {
  role: "user" | "assistant";
  content: string;
}

export function AssistantClient({
  initialHistory,
  memberName,
}: {
  initialHistory: InitialMsg[];
  memberName: string;
}) {
  const [messages, setMessages] = useState<Msg[]>(
    initialHistory.map((m, i) => ({ id: `init-${i}`, role: m.role, content: m.content })),
  );
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastIdRef = useRef<string | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isStreaming]);

  async function send(text: string) {
    if (!text.trim() || isStreaming) return;
    const userMsg: Msg = { id: crypto.randomUUID(), role: "user", content: text };
    const replyId = crypto.randomUUID();
    lastIdRef.current = replyId;
    setMessages((m) => [...m, userMsg, { id: replyId, role: "assistant", content: "" }]);
    setInput("");
    setIsStreaming(true);

    try {
      const resp = await fetch("/api/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      if (!resp.ok || !resp.body) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error ?? `HTTP ${resp.status}`);
      }
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let nl;
        while ((nl = buffer.indexOf("\n\n")) !== -1) {
          const event = buffer.slice(0, nl).trim();
          buffer = buffer.slice(nl + 2);
          if (!event.startsWith("data:")) continue;
          const payload = event.slice(5).trim();
          if (payload === "[DONE]") {
            setIsStreaming(false);
            return;
          }
          try {
            const data = JSON.parse(payload);
            if (data.error) throw new Error(data.error);
            if (typeof data.text === "string") {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === replyId ? { ...m, content: m.content + data.text } : m,
                ),
              );
            }
          } catch {
            /* ignore parse errors */
          }
        }
      }
    } catch (e: any) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === replyId ? { ...m, content: `Ошибка: ${e.message}` } : m,
        ),
      );
    } finally {
      setIsStreaming(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Ассистент</h1>
        <Link href="/memory" className="text-xs text-accent flex items-center gap-1">
          <BookOpen size={14} /> Память →
        </Link>
      </div>

      <div ref={scrollRef} className="surface p-3 max-h-[60vh] overflow-y-auto space-y-3">
        {messages.length === 0 && (
          <div>
            <div className="text-sm text-muted mb-3">Привет, {memberName}. Спроси что-нибудь:</div>
            <div className="grid grid-cols-2 gap-2">
              {STARTERS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-left text-xs px-3 py-2 rounded-xl bg-surface2 hover:bg-accent/20"
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
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {m.role === "assistant" && (
              <div className="shrink-0 w-7 h-7 rounded-full bg-[#C9A84C]/20 text-[#C9A84C] flex items-center justify-center">
                <Sparkles size={14} />
              </div>
            )}
            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-wrap leading-relaxed ${
                m.role === "user" ? "bg-accent text-white" : "bg-surface2 text-text"
              }`}
            >
              {m.content || (isStreaming && m.id === lastIdRef.current ? <AgentTyping /> : "...")}
            </div>
          </motion.div>
        ))}
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
        <Button type="submit" disabled={isStreaming || !input.trim()}>
          <Send size={16} />
        </Button>
      </form>
    </div>
  );
}
