export interface ScoreCardProps {
  score?: number;
  label?: string;
}

export function ScoreCard({ score = 0, label = "Overall Score" }: ScoreCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-4xl font-semibold">{score}/5</p>
    </div>
  );
}
