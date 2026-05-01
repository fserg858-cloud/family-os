"use client";

import { MemberAvatar } from "./member-avatar";
import { getMember, type MemberKey } from "@/lib/members";
import { cn } from "@/lib/utils";
import { usePreferences } from "./preferences-provider";

interface Props {
  members: { id: string; member_key: string; display_name: string }[];
  selected?: string | null; // user.id or null = all
  onSelect?: (id: string | null) => void;
  showAll?: boolean;
}

export function MemberCarousel({ members, selected, onSelect, showAll = true }: Props) {
  const { t } = usePreferences();
  return (
    <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-5 px-5 py-2">
      {showAll && (
        <button
          onClick={() => onSelect?.(null)}
          className={cn(
            "shrink-0 flex flex-col items-center gap-1.5 px-1",
            selected === null ? "opacity-100" : "opacity-70",
          )}
        >
          <div
            className={cn(
              "w-12 h-12 rounded-full bg-surface border flex items-center justify-center text-lg",
              selected === null ? "border-accent" : "border-border",
            )}
          >
            👥
          </div>
          <div className={cn("text-[11px]", selected === null ? "text-accent" : "text-muted")}>
            {t("family.all")}
          </div>
        </button>
      )}
      {members.map((m) => {
        const def = getMember(m.member_key);
        const active = selected === m.id;
        return (
          <button
            key={m.id}
            onClick={() => onSelect?.(m.id)}
            className={cn("shrink-0 flex flex-col items-center gap-1.5 px-1", active ? "opacity-100" : "opacity-70")}
          >
            <MemberAvatar memberKey={m.member_key} size="md" ring={active} />
            <div className="text-[11px] text-muted truncate max-w-[60px]" style={{ color: active ? def?.color : undefined }}>
              {m.display_name}
            </div>
          </button>
        );
      })}
    </div>
  );
}
