"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { usePreferences } from "@/components/preferences-provider";
import { translateGrowthStatus } from "@/lib/i18n";

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
  const { t, locale } = usePreferences();
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
        {t("growth.add_skill")}
      </h3>
      <form onSubmit={addCompetency} className="surface p-4 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label>{t("growth.skill_name")}</Label>
            <Input value={compName} onChange={(e) => setCompName(e.target.value)} placeholder={t("growth.skill_name_placeholder")} />
          </div>
          <div>
            <Label>{t("growth.skill_category")}</Label>
            <Input value={compCat} onChange={(e) => setCompCat(e.target.value)} placeholder={t("growth.skill_category_placeholder")} />
          </div>
        </div>
        <Button type="submit" block>
          <Plus size={14} /> {t("common.add")}
        </Button>
        {existingComps.length > 0 && (
          <div className="text-[11px] text-muted">{t("growth.have_already")}{existingComps.join(", ")}</div>
        )}
      </form>

      <h3 className="text-[13px] uppercase tracking-[0.16em] text-muted font-medium mt-8 mb-3">
        {t("growth.materials")}
      </h3>
      <form onSubmit={addContent} className="surface p-4 space-y-3">
        <div>
          <Label>{t("growth.material_name")}</Label>
          <Input
            value={item.title}
            onChange={(e) => setItem({ ...item, title: e.target.value })}
            placeholder={t("growth.material_name_placeholder")}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label>{t("growth.material_source")}</Label>
            <Input
              value={item.source}
              onChange={(e) => setItem({ ...item, source: e.target.value })}
              placeholder={t("growth.material_source_placeholder")}
            />
          </div>
          <div>
            <Label>{t("growth.material_link")}</Label>
            <Input
              value={item.url}
              onChange={(e) => setItem({ ...item, url: e.target.value })}
              placeholder="https://"
            />
          </div>
        </div>
        <Button type="submit" block>
          <Plus size={14} /> {t("common.add")}
        </Button>
      </form>

      <div className="mt-4 space-y-2">
        {content.length === 0 && <div className="surface p-4 text-center text-sm text-muted">{t("growth.empty")}</div>}
        {content.map((c) => (
          <div key={c.id} className="surface p-3 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="text-[15px]">{c.title}</div>
              <div className="text-[11px] text-muted">
                {c.source}
                {c.url ? " · " : ""}
                {c.url && (
                  <a href={c.url} target="_blank" className="text-accent">
                    {t("growth.link")}
                  </a>
                )}
              </div>
            </div>
            <Select
              value={c.status}
              onChange={(e) => setStatus(c.id, e.target.value as Content["status"])}
              className="!w-32 !py-2 text-xs"
            >
              <option value="queued">{translateGrowthStatus("queued", locale)}</option>
              <option value="active">{translateGrowthStatus("active", locale)}</option>
              <option value="done">{translateGrowthStatus("done", locale)}</option>
            </Select>
          </div>
        ))}
      </div>
    </>
  );
}
