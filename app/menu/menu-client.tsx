"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, ShoppingCart, ChefHat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";

interface DayMenu {
  day: string;
  breakfast?: string;
  lunch?: string;
  dinner?: string;
  snack?: string;
}
interface ShoppingGroup {
  category: string;
  items: { item: string; qty?: string }[];
}
interface Menu {
  days: DayMenu[];
  shopping: ShoppingGroup[];
  motivation?: string;
}

const CAT_LABEL: Record<string, string> = {
  produce: "🥬 Овощи и фрукты",
  dairy: "🥛 Молочное",
  meat: "🥩 Мясо и рыба",
  grain: "🌾 Бакалея",
  bakery: "🥐 Хлеб",
  household: "🧴 Бытовое",
  other: "🛒 Другое",
};

export function MenuClient() {
  const [preferences, setPreferences] = useState("");
  const [allergies, setAllergies] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [menu, setMenu] = useState<Menu | null>(null);
  const [adding, setAdding] = useState(false);
  const [addedCount, setAddedCount] = useState(0);

  async function generate() {
    setBusy(true);
    setError(null);
    try {
      const r = await fetch("/api/menu/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ preferences, allergies }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? "ошибка");
      setMenu(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function addAllToShoppingList() {
    if (!menu) return;
    setAdding(true);
    let count = 0;
    for (const group of menu.shopping) {
      for (const it of group.items) {
        try {
          const r = await fetch("/api/family/shopping", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              item: it.item,
              qty: it.qty ?? null,
              category: group.category,
            }),
          });
          if (r.ok) count++;
        } catch {
          /* skip */
        }
      }
    }
    setAdding(false);
    setAddedCount(count);
  }

  if (!menu) {
    return (
      <div className="space-y-4">
        <div className="surface p-4">
          <Label>Предпочтения и стиль</Label>
          <Textarea
            value={preferences}
            onChange={(e) => setPreferences(e.target.value)}
            placeholder="Например: средиземноморский стиль, больше рыбы, минимум сахара, готовлю на 30 мин"
          />
        </div>
        <div className="surface p-4">
          <Label>Аллергии / непереносимости</Label>
          <Input
            value={allergies}
            onChange={(e) => setAllergies(e.target.value)}
            placeholder="Например: лактоза у Игната, орехи"
          />
        </div>
        <Button onClick={generate} disabled={busy} block size="lg">
          <Sparkles size={18} />
          {busy ? "Думаю над меню..." : "Сгенерировать меню недели"}
        </Button>
        {error && (
          <div className="text-sm text-danger bg-danger/10 border border-danger/30 rounded-xl px-3 py-2">
            {error}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {menu.motivation && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="surface p-4 border-l-4 border-accent"
        >
          <div className="text-xs text-muted uppercase tracking-widest mb-1">от AI-нутрициолога</div>
          <div className="text-sm">{menu.motivation}</div>
        </motion.div>
      )}

      <h3 className="text-[13px] uppercase tracking-[0.16em] text-muted font-medium">7 дней</h3>
      <div className="space-y-2">
        {menu.days.map((d, i) => (
          <motion.div
            key={d.day}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="surface p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <ChefHat size={16} className="text-accent" />
              <div className="font-semibold">{d.day}</div>
            </div>
            <div className="text-sm space-y-1">
              {d.breakfast && (
                <div>
                  <span className="text-muted">🌅 </span>
                  {d.breakfast}
                </div>
              )}
              {d.lunch && (
                <div>
                  <span className="text-muted">🌞 </span>
                  {d.lunch}
                </div>
              )}
              {d.dinner && (
                <div>
                  <span className="text-muted">🌙 </span>
                  {d.dinner}
                </div>
              )}
              {d.snack && (
                <div>
                  <span className="text-muted">🍎 </span>
                  {d.snack}
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      <h3 className="text-[13px] uppercase tracking-[0.16em] text-muted font-medium mt-6">Список покупок</h3>
      <div className="space-y-3">
        {menu.shopping.map((g) => (
          <div key={g.category} className="surface p-4">
            <div className="font-semibold mb-2">{CAT_LABEL[g.category] ?? g.category}</div>
            <ul className="text-sm space-y-1">
              {g.items.map((it, i) => (
                <li key={i} className="flex justify-between">
                  <span>{it.item}</span>
                  {it.qty && <span className="text-muted">{it.qty}</span>}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <Button onClick={addAllToShoppingList} disabled={adding} block size="lg">
        <ShoppingCart size={18} />
        {adding ? "Добавляю…" : addedCount > 0 ? `Добавлено ${addedCount} позиций ✓` : "Добавить всё в список покупок"}
      </Button>

      <Button onClick={() => setMenu(null)} variant="ghost" block>
        Сгенерировать заново
      </Button>
    </div>
  );
}
