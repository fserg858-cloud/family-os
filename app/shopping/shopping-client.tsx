"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import { ShoppingItem } from "@/components/shopping-item";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { SHOPPING_CATEGORIES, type ShoppingCategory } from "@/lib/members";
import { usePreferences } from "@/components/preferences-provider";
import { translateShoppingCategory } from "@/lib/i18n";

interface Item {
  id: string;
  item: string;
  qty: string | null;
  category: string | null;
  bought: boolean;
}

export function ShoppingClient({ initial }: { initial: Item[] }) {
  const { t, locale } = usePreferences();
  const [items, setItems] = useState<Item[]>(initial);
  const [name, setName] = useState("");
  const [qty, setQty] = useState("");
  const [category, setCategory] = useState<ShoppingCategory>("produce");

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const res = await fetch("/api/family/shopping", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ item: name, qty: qty || null, category }),
    });
    if (res.ok) {
      const created = await res.json();
      setItems((p) => [created, ...p]);
      setName("");
      setQty("");
    }
  }

  async function toggle(id: string, next: boolean) {
    setItems((p) => p.map((i) => (i.id === id ? { ...i, bought: next } : i)));
    await fetch("/api/family/shopping", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, bought: next }),
    });
  }

  async function remove(id: string) {
    setItems((p) => p.filter((i) => i.id !== id));
    await fetch(`/api/family/shopping?id=${id}`, { method: "DELETE" });
  }

  const grouped = useMemo(() => {
    const m: Record<string, Item[]> = {};
    for (const i of items) {
      const key = i.category ?? "other";
      (m[key] ??= []).push(i);
    }
    return m;
  }, [items]);

  return (
    <div className="space-y-4">
      <form onSubmit={add} className="surface p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>{t("shopping.form.what")}</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("shopping.form.what_placeholder")} />
          </div>
          <div>
            <Label>{t("shopping.form.qty")}</Label>
            <Input value={qty} onChange={(e) => setQty(e.target.value)} placeholder={t("shopping.form.qty_placeholder")} />
          </div>
        </div>
        <div>
          <Label>{t("shopping.form.category")}</Label>
          <Select value={category} onChange={(e) => setCategory(e.target.value as ShoppingCategory)}>
            {SHOPPING_CATEGORIES.map((c) => (
              <option key={c.key} value={c.key}>
                {c.icon} {translateShoppingCategory(c.key, locale)}
              </option>
            ))}
          </Select>
        </div>
        <Button type="submit" block>
          <Plus size={16} /> {t("common.add")}
        </Button>
      </form>

      <AnimatePresence>
        {SHOPPING_CATEGORIES.map((c) => {
          const list = grouped[c.key] ?? [];
          if (list.length === 0) return null;
          return (
            <motion.section
              key={c.key}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <div className="flex items-center justify-between mb-2 mt-2">
                <h3 className="text-[13px] uppercase tracking-[0.16em] text-muted font-medium flex items-center gap-2">
                  <span>{c.icon}</span> {translateShoppingCategory(c.key, locale)}
                </h3>
                <span className="text-[11px] text-muted">{list.length}</span>
              </div>
              <div className="space-y-2">
                {list.map((it) => (
                  <ShoppingItem key={it.id} {...it} onToggle={toggle} onDelete={remove} />
                ))}
              </div>
            </motion.section>
          );
        })}
      </AnimatePresence>

      {items.length === 0 && (
        <div className="surface p-8 text-center text-muted text-sm">{t("shopping.empty")}</div>
      )}
    </div>
  );
}
