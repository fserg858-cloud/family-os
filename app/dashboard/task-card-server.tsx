"use client";

import { useRouter } from "next/navigation";
import { TaskCard, type TaskCardData } from "@/components/task-card";

export function TaskCardServer({
  task,
  memberKey,
}: {
  task: any;
  memberKey: string | null;
}) {
  const router = useRouter();
  return (
    <TaskCard
      task={task as TaskCardData}
      memberKey={memberKey}
      onComplete={async (id) => {
        await fetch("/api/tasks", {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ id, status: "done" }),
        });
        router.refresh();
      }}
      onDelete={async (id) => {
        await fetch(`/api/tasks?id=${id}`, { method: "DELETE" });
        router.refresh();
      }}
    />
  );
}
