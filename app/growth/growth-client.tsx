"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardLabel } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Plus } from "lucide-react";

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
      <section className="mb-8">
        <CardLabel>Добавить компетенцию</CardLabel>
        <Card className="mt-3">
          <form onSubmit={addCompetency} className="grid md:grid-cols-3 gap-3 items-end">
            <div>
              <Label>Название</Label>
              <Input
                value={compName}
                onChange={(e) => setCompName(e.target.value)}
                placeholder="Английский"
              />
            </div>
            <div>
              <Label>Категория</Label>
              <Input
                value={compCat}
                onChange={(e) => setCompCat(e.target.value)}
                placeholder="Языки / Спорт / IT"
              />
            </div>
            <Button type="submit"><Plus size={16} /> Добавить</Button>
          </form>
          {existingComps.length > 0 && (
            <div className="text-xs text-muted mt-3">Уже есть: {existingComps.join(", ")}</div>
          )}
        </Card>
      </section>

      <section>
        <CardLabel>Учебные материалы</CardLabel>
        <Card className="mt-3">
          <form onSubmit={addContent} className="grid md:grid-cols-4 gap-3 items-end">
            <div className="md:col-span-2">
              <Label>Название</Label>
              <Input
                value={item.title}
                onChange={(e) => setItem({ ...item, title: e.target.value })}
                placeholder="Why we sleep — M.Walker"
              />
            </div>
            <div>
              <Label>Источник</Label>
              <Input
                value={item.source}
                onChange={(e) => setItem({ ...item, source: e.target.value })}
                placeholder="Книга / Курс / Видео"
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
            <Button type="submit" className="md:col-span-4"><Plus size={16} /> Добавить</Button>
          </form>
        </Card>

        <div className="mt-4 space-y-2">
          {content.length === 0 && <Card className="text-muted text-sm">Пока пусто</Card>}
          {content.map((c) => (
            <Card key={c.id}>
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-text">{c.title}</div>
                  <div className="text-xs text-muted">
                    {c.source} {c.url ? "· " : ""}
                    {c.url && (
                      <a href={c.url} target="_blank" className="accent-text hover:underline">
                        ссылка
                      </a>
                    )}
                  </div>
                </div>
                <Select
                  value={c.status}
                  onChange={(e) => setStatus(c.id, e.target.value as Content["status"])}
                  className="!w-32"
                >
                  <option value="queued">в очереди</option>
                  <option value="active">в работе</option>
                  <option value="done">завершено</option>
                </Select>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </>
  );
}
