import { MemberAvatar } from "./member-avatar";

interface Props {
  actorMemberKey?: string | null;
  title: string;
  body?: string | null;
  created_at: string;
  read?: boolean;
}

function timeAgo(iso: string) {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "только что";
  if (m < 60) return `${m} мин назад`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ч назад`;
  const day = Math.floor(h / 24);
  if (day < 7) return `${day} дн назад`;
  return d.toLocaleDateString("ru-RU");
}

export function NotificationItem({ actorMemberKey, title, body, created_at, read }: Props) {
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
        <div className="text-[10px] text-muted mt-1">{timeAgo(created_at)}</div>
      </div>
      {!read && <span className="w-2 h-2 rounded-full bg-accent mt-1.5" />}
    </div>
  );
}
