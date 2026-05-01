"use client";

import { Check, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePreferences } from "./preferences-provider";

interface Props {
  id: string;
  item: string;
  qty?: string | null;
  bought: boolean;
  onToggle: (id: string, next: boolean) => void;
  onDelete?: (id: string) => void;
}

export function ShoppingItem({ id, item, qty, bought, onToggle, onDelete }: Props) {
  const { t } = usePreferences();
  return (
    <div className="surface px-4 py-3 flex items-center gap-3">
      <button
        onClick={() => onToggle(id, !bought)}
        className={cn(
          "shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-colors",
          bought ? "bg-success border-success text-white" : "border-muted",
        )}
        aria-label={t("shopping.aria.bought")}
      >
        {bought && <Check size={16} />}
      </button>
      <div className="flex-1 min-w-0">
        <div className={cn("text-[15px]", bought && "line-through text-muted")}>{item}</div>
        {qty && <div className="text-[11px] text-muted">{qty}</div>}
      </div>
      {onDelete && (
        <button
          onClick={() => onDelete(id)}
          className="text-muted hover:text-danger p-2"
          aria-label={t("common.delete")}
        >
          <Trash2 size={16} />
        </button>
      )}
    </div>
  );
}
