export interface ProgressBarProps {
  current: number;
  total: number;
}

export function ProgressBar({ current, total }: ProgressBarProps) {
  const percentage = total > 0 ? Math.min((current / total) * 100, 100) : 0;

  return (
    <div className="w-full">
      <div className="mb-2 flex items-center justify-between text-sm text-muted-foreground">
        <span>Progress</span>
        <span>{current}/{total}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}
