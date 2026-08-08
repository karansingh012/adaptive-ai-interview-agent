export interface EvaluationCardProps {
  score?: number;
  feedback?: string;
}

export function EvaluationCard({ score, feedback }: EvaluationCardProps) {
  return (
    <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <h3 className="text-lg font-semibold">Evaluation</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        {feedback ?? "Your answer will be evaluated here."}
      </p>
      {typeof score === "number" ? <p className="mt-4 text-3xl font-semibold">{score}/5</p> : null}
    </section>
  );
}
