import { CheckCircle2, Lightbulb, TriangleAlert } from "lucide-react";

export interface RecommendationCardProps {
  title?: string;
  tier?: string;
  description?: string;
  strengths?: string[];
  improvements?: string[];
}

export function RecommendationCard({
  title = "Recommendation",
  tier,
  description = "Suggested next steps will appear here.",
  strengths = [],
  improvements = [],
}: RecommendationCardProps) {
  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-indigo-300">{title}</p>
        {tier ? (
          <p className="mt-2 text-base font-semibold text-white">{tier}</p>
        ) : null}
        <p className={`text-sm leading-relaxed text-zinc-300 ${tier ? "mt-1" : "mt-2"}`}>{description}</p>
      </div>

      {strengths.length > 0 && (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-emerald-300">
            <CheckCircle2 className="h-4 w-4" />
            Strengths
          </div>
          <ul className="mt-3 space-y-2">
            {strengths.map((item) => (
              <li key={item} className="flex gap-2 text-sm text-zinc-300">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {improvements.length > 0 && (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-amber-300">
            <TriangleAlert className="h-4 w-4" />
            Areas to Improve
          </div>
          <ul className="mt-3 space-y-2">
            {improvements.map((item) => (
              <li key={item} className="flex gap-2 text-sm text-zinc-300">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {strengths.length === 0 && improvements.length === 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-zinc-400">
            <Lightbulb className="h-4 w-4" />
            Insights
          </div>
          <p className="mt-2 text-sm text-zinc-500">Detailed feedback will appear after evaluation.</p>
        </div>
      )}
    </div>
  );
}
