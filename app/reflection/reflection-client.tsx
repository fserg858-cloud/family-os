"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardLabel } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea, Label } from "@/components/ui/input";
import { Sparkles } from "lucide-react";

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
    <div className="space-y-4">
      <Card>
        <CardLabel>Настроение сегодня</CardLabel>
        <div className="flex gap-2 mt-3">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => setMood(n)}
              className={`flex-1 py-3 rounded-xl border text-2xl ${
                mood === n
                  ? "bg-accent text-bg border-accent"
                  : "border-border hover:border-accent"
              }`}
            >
              {["😞", "😕", "😐", "🙂", "😊"][n - 1]}
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <Label>Главная победа дня</Label>
        <Textarea
          value={win}
          onChange={(e) => setWin(e.target.value)}
          placeholder="Что я сделал лучше, чем вчера"
        />
      </Card>

      <Card>
        <Label>Главный урок</Label>
        <Textarea
          value={lesson}
          onChange={(e) => setLesson(e.target.value)}
          placeholder="Что я понял про себя или ситуацию"
        />
      </Card>

      <Card>
        <Label>Один шаг на завтра</Label>
        <Textarea
          value={next}
          onChange={(e) => setNext(e.target.value)}
          placeholder="Конкретное действие, не абстракция"
        />
      </Card>

      <Button onClick={save} disabled={busy} className="w-full">
        {busy ? "Сохраняю и думаю..." : "Сохранить и получить инсайт"}
      </Button>

      {insight && (
        <Card>
          <div className="flex items-center gap-2 text-accent mb-2">
            <Sparkles size={16} />
            <span className="text-xs uppercase tracking-[0.2em]">AI инсайт</span>
          </div>
          <div className="text-text whitespace-pre-wrap leading-relaxed">{insight}</div>
        </Card>
      )}
    </div>
  );
}
