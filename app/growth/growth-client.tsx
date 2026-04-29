"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";

interface Content {
  id: string;
  title: string;
  source: string | null;
  url: string | null;
  status: "queued" | "active" | "done";
  notes: string | null;
}

export function GrowthClient({
  initialContent,
  existingComps,
}: {
  initialContent: Content[];
  existingComps: string[];
}) {
  const router = useRouter();
  const [content, setContent] = useState<Content[]>(initialContent);
  const [compName, setCompName] = useState("");
  const [compCat, setCompCat] = useState("");
  const [item, setItem] = useState({ title: "", source: "", url: "" });

  async function addCompetency(e: React.FormEvent) {
    e.preventDefault();
    if (!compName.trim()) return;
    const res = await fetch("/api/growth", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ kind: "competency", name: compName, category: compCat }),
    });
    if (res.ok) {
      setCompName("");
      setCompCat("");
      router.refresh();
    }
  }

  async function addContent(e: React.FormEvent) {
    e.preventDefault();
    if (!item.title.trim()) return;
    const res = await fetch("/api/growth", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ kind: "content", ...item }),
    });
    if (res.ok) {
      const c = await res.json();
      setContent((p) => [c, ...p]);
      setItem({ title: "", source: "", url: "" });
    }
  }

  async function setStatus(id: string, status: Content["status"]) {
    setContent((p) => p.map((c) => (c.id === id ? { ...c, status } : c)));
    await fetch("/api/growth", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
  }

  return (
    <>
      <h3 className="text-[13px] uppercase tracking-[0.16em] text-muted font-medium mt-8 mb-3">
        Добавить компетенцию
      </h3>
      <form onSubmit={addCompetency} className="surface p-4 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label>Название</Label>
            <Input value={compName} onChange={(e) => setCompName(e.target.value)} placeholder="Английский" />
          </div>
          <div>
            <Label>Категория</Label>
            <Input value={compCat} onChange={(e) => setCompCat(e.target.value)} placeholder="Языки" />
          </div>
        </div>
        <Button type="submit" block>
          <Plus size={14} /> Добавить
        </Button>
        {existingComps.length > 0 && (
          <div className="text-[11px] text-muted">Уже есть: {existingComps.join(", ")}</div>
        )}
      </form>

      <h3 className="text-[13px] uppercase tracking-[0.16em] text-muted font-medium mt-8 mb-3">
        Учебные материалы
      </h3>
      <form onSubmit={addContent} className="surface p-4 space-y-3">
        <div>
          <Label>Название</Label>
          <Input
            value={item.title}
            onChange={(e) => setItem({ ...item, title: e.target.value })}
            placeholder="Why we sleep — M.Walker"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label>Источник</Label>
            <Input
              value={item.source}
              onChange={(e) => setItem({ ...item, source: e.target.value })}
              placeholder="Книга / Курс"
            />
          </div>
          <div>
            <Label>Ссылка</Label>
            <Input
              value={item.url}
              onChange={(e) => setItem({ ...item, url: e.target.value })}
              placeholder="https://"
            />
          </div>
        </div>
        <Button type="submit" block>
          <Plus size={14} /> Добавить
        </Button>
      </form>

      <div className="mt-4 space-y-2">
        {content.length === 0 && <div className="surface p-4 text-center text-sm text-muted">Пусто</div>}
        {content.map((c) => (
          <div key={c.id} className="surface p-3 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="text-[15px]">{c.title}</div>
              <div className="text-[11px] text-muted">
                {c.source}
                {c.url ? " · " : ""}
                {c.url && (
                  <a href={c.url} target="_blank" className="text-accent">
                    ссылка
                  </a>
                )}
              </div>
            </div>
            <Select
              value={c.status}
              onChange={(e) => setStatus(c.id, e.target.value as Content["status"])}
              className="!w-32 !py-2 text-xs"
            >
              <option value="queued">в очереди</option>
              <option value="active">в работе</option>
              <option value="done">завершено</option>
            </Select>
          </div>
        ))}
      </div>
    </>
  );
}
