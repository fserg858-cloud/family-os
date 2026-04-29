"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Plus, Droplet } from "lucide-react";
import { todayISO } from "@/lib/utils";
import { cn } from "@/lib/utils";

type Kind = "nutrition" | "sleep" | "workout" | "metric" | "water";

interface Log {
  id: string;
  kind: Kind;
  occurred_on: string;
  payload: any;
  created_at: string;
}

const TABS: { key: Kind; label: string; icon: string }[] = [
  { key: "nutrition", label: "Питание", icon: "🍽️" },
  { key: "sleep", label: "Сон", icon: "🌙" },
  { key: "workout", label: "Тренировки", icon: "🏋️" },
  { key: "metric", label: "Метрики", icon: "📊" },
  { key: "water", label: "Вода", icon: "💧" },
];

export function HealthClient({ initial }: { initial: Log[] }) {
  const [tab, setTab] = useState<Kind>("nutrition");
  const [logs, setLogs] = useState<Log[]>(initial);

  async function addLog(payload: any) {
    const res = await fetch("/api/health", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ kind: tab, occurred_on: todayISO(), payload }),
    });
    if (res.ok) {
      const log = await res.json();
      setLogs((p) => [log, ...p]);
    }
  }

  const filtered = logs.filter((l) => l.kind === tab);

  return (
    <div>
      <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-5 px-5 mb-4">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "shrink-0 px-3 py-2 rounded-xl text-sm flex items-center gap-2",
              tab === t.key ? "bg-accent text-white" : "bg-surface",
            )}
          >
            <span>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "nutrition" && <NutritionForm onAdd={addLog} />}
      {tab === "sleep" && <SleepForm onAdd={addLog} />}
      {tab === "workout" && <WorkoutForm onAdd={addLog} />}
      {tab === "metric" && <MetricForm onAdd={addLog} />}
      {tab === "water" && <WaterForm onAdd={addLog} todayLogs={filtered} />}

      <h3 className="text-[13px] uppercase tracking-[0.16em] text-muted font-medium mt-6 mb-3">
        История
      </h3>
      <div className="space-y-2">
        {filtered.length === 0 && <div className="surface p-4 text-center text-sm text-muted">Пусто</div>}
        {filtered.map((l) => (
          <div key={l.id} className="surface p-3">
            <div className="text-[10px] text-muted">{l.occurred_on}</div>
            <pre className="text-[13px] mt-1 whitespace-pre-wrap font-mono text-text/90">
              {Object.entries(l.payload || {}).map(([k, v]) => `${k}: ${v}`).join("\n")}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
}

function NutritionForm({ onAdd }: { onAdd: (p: any) => void }) {
  const [meal, setMeal] = useState("");
  const [kcal, setKcal] = useState("");
  const [protein, setProtein] = useState("");
  const [fat, setFat] = useState("");
  const [carbs, setCarbs] = useState("");
  return (
    <form
      className="surface p-4 space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!meal) return;
        onAdd({
          meal,
          kcal: Number(kcal) || 0,
          protein: Number(protein) || 0,
          fat: Number(fat) || 0,
          carbs: Number(carbs) || 0,
        });
        setMeal("");
        setKcal("");
        setProtein("");
        setFat("");
        setCarbs("");
      }}
    >
      <div>
        <Label>Что съел/выпил</Label>
        <Input value={meal} onChange={(e) => setMeal(e.target.value)} placeholder="Овсянка с орехами" />
      </div>
      <div className="grid grid-cols-4 gap-2">
        <div>
          <Label>Ккал</Label>
          <Input type="number" value={kcal} onChange={(e) => setKcal(e.target.value)} />
        </div>
        <div>
          <Label>Б</Label>
          <Input type="number" value={protein} onChange={(e) => setProtein(e.target.value)} />
        </div>
        <div>
          <Label>Ж</Label>
          <Input type="number" value={fat} onChange={(e) => setFat(e.target.value)} />
        </div>
        <div>
          <Label>У</Label>
          <Input type="number" value={carbs} onChange={(e) => setCarbs(e.target.value)} />
        </div>
      </div>
      <Button type="submit" block>
        <Plus size={14} /> Записать
      </Button>
    </form>
  );
}

function SleepForm({ onAdd }: { onAdd: (p: any) => void }) {
  const [hours, setHours] = useState("");
  const [quality, setQuality] = useState("4");
  return (
    <form
      className="surface p-4 space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!hours) return;
        onAdd({ hours: Number(hours), quality: Number(quality) });
        setHours("");
      }}
    >
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Часов</Label>
          <Input type="number" step="0.1" value={hours} onChange={(e) => setHours(e.target.value)} />
        </div>
        <div>
          <Label>Качество (1–5)</Label>
          <Input type="number" min={1} max={5} value={quality} onChange={(e) => setQuality(e.target.value)} />
        </div>
      </div>
      <Button type="submit" block>
        <Plus size={14} /> Записать
      </Button>
    </form>
  );
}

function WorkoutForm({ onAdd }: { onAdd: (p: any) => void }) {
  const [type, setType] = useState("");
  const [minutes, setMinutes] = useState("");
  const [intensity, setIntensity] = useState("3");
  return (
    <form
      className="surface p-4 space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!type) return;
        onAdd({ type, minutes: Number(minutes) || 0, intensity: Number(intensity) });
        setType("");
        setMinutes("");
      }}
    >
      <div>
        <Label>Тип</Label>
        <Input value={type} onChange={(e) => setType(e.target.value)} placeholder="Силовая / бег / йога" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label>Минут</Label>
          <Input type="number" value={minutes} onChange={(e) => setMinutes(e.target.value)} />
        </div>
        <div>
          <Label>Интенс. (1–5)</Label>
          <Input type="number" min={1} max={5} value={intensity} onChange={(e) => setIntensity(e.target.value)} />
        </div>
      </div>
      <Button type="submit" block>
        <Plus size={14} /> Записать
      </Button>
    </form>
  );
}

function MetricForm({ onAdd }: { onAdd: (p: any) => void }) {
  const [weight, setWeight] = useState("");
  const [bp, setBp] = useState("");
  const [hr, setHr] = useState("");
  return (
    <form
      className="surface p-4 space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        const payload: any = {};
        if (weight) payload.weight_kg = Number(weight);
        if (bp) payload.blood_pressure = bp;
        if (hr) payload.resting_hr = Number(hr);
        if (Object.keys(payload).length === 0) return;
        onAdd(payload);
        setWeight("");
        setBp("");
        setHr("");
      }}
    >
      <div className="grid grid-cols-3 gap-2">
        <div>
          <Label>Вес</Label>
          <Input type="number" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} />
        </div>
        <div>
          <Label>Давление</Label>
          <Input value={bp} onChange={(e) => setBp(e.target.value)} placeholder="120/80" />
        </div>
        <div>
          <Label>Пульс</Label>
          <Input type="number" value={hr} onChange={(e) => setHr(e.target.value)} />
        </div>
      </div>
      <Button type="submit" block>
        <Plus size={14} /> Записать
      </Button>
    </form>
  );
}

function WaterForm({
  onAdd,
  todayLogs,
}: {
  onAdd: (p: any) => void;
  todayLogs: Log[];
}) {
  const totalMl = todayLogs
    .filter((l) => l.occurred_on === todayISO())
    .reduce((acc, l) => acc + (Number(l.payload?.ml) || 0), 0);
  const target = 2500;
  const pct = Math.min(100, (totalMl / target) * 100);
  return (
    <div className="surface p-4 space-y-3">
      <div className="flex items-center gap-3">
        <Droplet size={28} className="text-accent" />
        <div className="flex-1">
          <div className="text-2xl font-semibold">
            {totalMl} <span className="text-muted text-sm">/ {target} мл</span>
          </div>
          <div className="h-2 rounded-full bg-surface2 overflow-hidden mt-2">
            <div className="h-full bg-accent" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[250, 500, 750].map((v) => (
          <Button key={v} variant="outline" onClick={() => onAdd({ ml: v })}>
            +{v}
          </Button>
        ))}
      </div>
    </div>
  );
}
