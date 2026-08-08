export interface ProgressBarProps {
  current: number;
  total: number;
  variant?: "light" | "dark";
}

export function ProgressBar({ current, total, variant = "dark" }: ProgressBarProps) {
  const percentage = total > 0 ? Math.min((current / total) * 100, 100) : 0;
  const isDark = variant === "dark";

  return (
    <div className="w-full">
      <div
        className={`mb-2 flex items-center justify-between text-xs font-medium ${isDark ? "text-zinc-400" : "text-muted-foreground"}`}
      >
        <span>Progress</span>
        <span>
          {current} of {total}
        </span>
      </div>
      <div className={`h-1.5 w-full overflow-hidden rounded-full ${isDark ? "bg-white/10" : "bg-muted"}`}>
        <div
          className={`h-full rounded-full transition-all duration-500 ${isDark ? "bg-indigo-500" : "bg-primary"}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
