"use client";

import { useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X } from "lucide-react";
import type { ProactiveMessage as ProactiveMessageT } from "@/lib/agent/types";
import { usePreferences } from "../preferences-provider";

export function ProactiveMessage({
  message,
  onRead,
  onDismiss,
}: {
  message: ProactiveMessageT;
  onRead: (id: string) => void;
  onDismiss: (id: string) => void;
}) {
  const { t } = usePreferences();
  // Авто-mark-as-read через 10 секунд
  useEffect(() => {
    const timer = setTimeout(() => onRead(message.id), 10000);
    return () => clearTimeout(timer);
  }, [message.id, onRead]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="surface p-4 mb-4"
        style={{ borderLeft: "4px solid #C9A84C" }}
      >
        <div className="flex items-start gap-3">
          <div className="shrink-0 w-9 h-9 rounded-full bg-[#C9A84C]/20 flex items-center justify-center">
            <Sparkles size={16} className="text-[#C9A84C]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[14px] leading-relaxed whitespace-pre-wrap">{message.message}</div>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => {
                  onRead(message.id);
                  onDismiss(message.id);
                }}
                className="px-3 py-1.5 rounded-lg bg-surface2 text-xs text-text"
              >
                {t("proactive.got_it")}
              </button>
              <Link
                href="/assistant"
                onClick={() => onRead(message.id)}
                className="px-3 py-1.5 rounded-lg bg-accent text-xs text-white"
              >
                {t("proactive.open_chat")}
              </Link>
            </div>
          </div>
          <button
            onClick={() => onDismiss(message.id)}
            className="text-muted hover:text-text p-1"
            aria-label={t("proactive.close")}
          >
            <X size={16} />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
