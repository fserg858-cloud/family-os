"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { NotificationItem } from "@/components/notification-item";
import { usePreferences } from "@/components/preferences-provider";

interface Notif {
  id: string;
  actor_id: string | null;
  kind: string;
  title: string;
  body: string | null;
  read: boolean;
  created_at: string;
}

interface Member {
  id: string;
  display_name: string;
  member_key: string;
}

function isToday(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  return d.toDateString() === now.toDateString();
}

export function NotificationsClient({
  initial,
  members,
}: {
  initial: Notif[];
  members: Member[];
}) {
  const { t } = usePreferences();
  const [items, setItems] = useState<Notif[]>(initial);
  const memberMap = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);

  useEffect(() => {
    const unread = items.filter((n) => !n.read).map((n) => n.id);
    if (unread.length === 0) return;
    fetch("/api/notifications", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ids: unread }),
    }).then(() => {
      setItems((p) => p.map((n) => ({ ...n, read: true })));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const today = items.filter((i) => isToday(i.created_at));
  const earlier = items.filter((i) => !isToday(i.created_at));

  return (
    <div className="space-y-6">
      {items.length === 0 && (
        <div className="surface p-6 text-center text-sm text-muted">
          {t("notifications.empty")}
        </div>
      )}

      {today.length > 0 && (
        <section>
          <h3 className="text-[13px] uppercase tracking-[0.16em] text-muted font-medium mb-3">
            {t("time.today")}
          </h3>
          <div className="space-y-2">
            {today.map((n, i) => {
              const actor = n.actor_id ? memberMap.get(n.actor_id) : null;
              return (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <NotificationItem
                    actorMemberKey={actor?.member_key ?? null}
                    title={n.title}
                    body={n.body}
                    created_at={n.created_at}
                    read={n.read}
                  />
                </motion.div>
              );
            })}
          </div>
        </section>
      )}

      {earlier.length > 0 && (
        <section>
          <h3 className="text-[13px] uppercase tracking-[0.16em] text-muted font-medium mb-3">
            {t("time.earlier")}
          </h3>
          <div className="space-y-2">
            {earlier.map((n) => {
              const actor = n.actor_id ? memberMap.get(n.actor_id) : null;
              return (
                <NotificationItem
                  key={n.id}
                  actorMemberKey={actor?.member_key ?? null}
                  title={n.title}
                  body={n.body}
                  created_at={n.created_at}
                  read={n.read}
                />
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
