"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea, Label } from "@/components/ui/input";

interface Reflection {
  id: string;
  win: string | null;
  lesson: string | null;
  next_step: string | null;
  ai_insight: string | null;
  mood: number | null;
}

export function ReflectionClient({ existing }: { existing: Reflection | null }) {
  const router = useRouter();
  const [win, setWin] = useState(existing?.win ?? "");
  const [lesson, setLesson] = useState(existing?.lesson ?? "");
  const [next, setNext] = useState(existing?.next_step ?? "");
  const [mood, setMood] = useState<number>(existing?.mood ?? 3);
  const [insight, setInsight] = useState(existing?.ai_insight ?? "");
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    const res = await fetch("/api/reflection", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ win, lesson, next_step: next, mood }),
    });
    const data = await res.json();
    setBusy(false);
    if (res.ok) {
      setInsight(data.ai_insight ?? "");
      router.refresh();
    }
  }

  return (
    <div className="space-y-3">
      <div className="surface p-4">
        <Label>Настроение</Label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => setMood(n)}
              className={`flex-1 py-3 rounded-xl text-2xl ${
                mood === n ? "bg-accent" : "bg-surface2"
              }`}
            >
              {["😞", "😕", "😐", "🙂", "😊"][n - 1]}
            </button>
          ))}
        </div>
      </div>

      <div className="surface p-4">
        <Label>Главная победа дня</Label>
        <Textarea value={win} onChange={(e) => setWin(e.target.value)} placeholder="Что я сделал лучше" />
      </div>
      <div className="surface p-4">
        <Label>Главный урок</Label>
        <Textarea value={lesson} onChange={(e) => setLesson(e.target.value)} placeholder="Что я понял" />
      </div>
      <div className="surface p-4">
        <Label>Шаг на завтра</Label>
        <Textarea value={next} onChange={(e) => setNext(e.target.value)} placeholder="Конкретное действие" />
      </div>

      <Button onClick={save} disabled={busy} block size="lg">
        {busy ? "Сохраняю..." : "Сохранить и получить инсайт"}
      </Button>

      {insight && (
        <div className="surface p-4">
          <div className="flex items-center gap-2 text-accent mb-2">
            <Sparkles size={14} />
            <span className="text-[11px] uppercase tracking-[0.16em]">AI инсайт</span>
          </div>
          <div className="text-[13px] whitespace-pre-wrap leading-relaxed">{insight}</div>
        </div>
      )}
    </div>
  );
}
