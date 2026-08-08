export interface RecommendationCardProps {
  title?: string;
  description?: string;
}

export function RecommendationCard({ title = "Recommendation", description = "Suggested next steps will appear here." }: RecommendationCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
