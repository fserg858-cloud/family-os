import { cn } from "@/lib/utils";
import { getMember, type MemberKey } from "@/lib/members";

type Size = "xs" | "sm" | "md" | "lg" | "xl";

const SIZES: Record<Size, { box: string; emoji: string; ring: string }> = {
  xs: { box: "w-6 h-6", emoji: "text-[11px]", ring: "ring-1" },
  sm: { box: "w-9 h-9", emoji: "text-base", ring: "ring-1" },
  md: { box: "w-12 h-12", emoji: "text-xl", ring: "ring-2" },
  lg: { box: "w-16 h-16", emoji: "text-3xl", ring: "ring-2" },
  xl: { box: "w-28 h-28", emoji: "text-5xl", ring: "ring-4" },
};

interface Props {
  memberKey: MemberKey | string | null | undefined;
  size?: Size;
  ring?: boolean;
  className?: string;
  badge?: React.ReactNode;
}

export function MemberAvatar({ memberKey, size = "md", ring = false, className, badge }: Props) {
  const m = getMember(memberKey ?? null);
  const sz = SIZES[size];
  const style = m ? { backgroundColor: m.color + "33", color: m.color, borderColor: m.color } : {};
  return (
    <div
      className={cn(
        "relative shrink-0 rounded-full flex items-center justify-center border",
        sz.box,
        ring && "ring-offset-2 ring-offset-bg",
        className,
      )}
      style={{
        ...style,
        ...(ring && m ? { boxShadow: `0 0 0 2px ${m.color}` } : {}),
      }}
      aria-label={m?.display_name ?? "Avatar"}
    >
      <span className={cn(sz.emoji, "leading-none")}>{m?.emoji ?? "👤"}</span>
      {badge && (
        <span className="absolute -bottom-1 -right-1 rounded-full bg-bg p-[2px]">
          {badge}
        </span>
      )}
    </div>
  );
}
