export interface TimerProps {
  secondsRemaining?: number;
}

export function Timer({ secondsRemaining = 0 }: TimerProps) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm font-medium">
      Time remaining: {secondsRemaining}s
    </div>
  );
}
