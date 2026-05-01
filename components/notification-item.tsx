"use client";

import { MemberAvatar } from "./member-avatar";
import { usePreferences } from "./preferences-provider";
import { formatTimeAgo, dateLocale } from "@/lib/i18n";

interface Props {
  actorMemberKey?: string | null;
  title: string;
  body?: string | null;
  created_at: string;
  read?: boolean;
}

export function NotificationItem({ actorMemberKey, title, body, created_at, read }: Props) {
  const { locale } = usePreferences();
  const d = new Date(created_at);
  const diffDays = Math.floor((Date.now() - d.getTime()) / 86400000);
  const label = diffDays >= 7 ? d.toLocaleDateString(dateLocale(locale)) : formatTimeAgo(d, locale);

  return (
    <div
      className={`px-4 py-3 rounded-2xl flex items-start gap-3 ${
        read ? "bg-surface" : "bg-accent/10 border border-accent/30"
      }`}
    >
      <MemberAvatar memberKey={actorMemberKey ?? null} size="sm" />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium leading-snug">{title}</div>
        {body && <div className="text-[12px] text-muted mt-0.5">{body}</div>}
        <div className="text-[10px] text-muted mt-1">{label}</div>
      </div>
      {!read && <span className="w-2 h-2 rounded-full bg-accent mt-1.5" />}
    </div>
  );
}
