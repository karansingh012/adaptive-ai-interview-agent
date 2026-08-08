export interface QuestionCardProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export function QuestionCard({ title, description, children }: QuestionCardProps) {
  return (
    <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <h2 className="text-xl font-semibold">{title}</h2>
      {description ? <p className="mt-2 text-sm text-muted-foreground">{description}</p> : null}
      {children ? <div className="mt-6">{children}</div> : null}
    </section>
  );
}
