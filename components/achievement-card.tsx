import { Trophy } from "lucide-react";

interface Props {
  title: string;
  description?: string | null;
  earned_at?: string | null;
  icon?: string;
}

export function AchievementCard({ title, description, earned_at, icon = "🏆" }: Props) {
  return (
    <div className="surface px-4 py-3 flex items-center gap-3">
      <div className="w-12 h-12 rounded-xl bg-accent/15 flex items-center justify-center text-2xl">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium leading-tight">{title}</div>
        {description && <div className="text-[11px] text-muted mt-0.5 truncate">{description}</div>}
        {earned_at && (
          <div className="text-[10px] text-muted mt-0.5">
            {new Date(earned_at).toLocaleDateString("ru-RU")}
          </div>
        )}
      </div>
      <Trophy size={18} className="text-accent" />
    </div>
  );
}
