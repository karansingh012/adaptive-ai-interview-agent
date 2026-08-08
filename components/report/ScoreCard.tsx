export interface ScoreCardProps {
  score?: number;
  label?: string;
  maxScore?: number;
  subtitle?: string;
}

function getScoreColor(score: number, maxScore: number) {
  const ratio = score / maxScore;
  if (ratio >= 0.8) return "text-emerald-400";
  if (ratio >= 0.6) return "text-amber-400";
  return "text-rose-400";
}

function getScoreRingColor(score: number, maxScore: number) {
  const ratio = score / maxScore;
  if (ratio >= 0.8) return "from-emerald-500/30 to-emerald-500/5";
  if (ratio >= 0.6) return "from-amber-500/30 to-amber-500/5";
  return "from-rose-500/30 to-rose-500/5";
}

export function ScoreCard({
  score = 0,
  label = "Overall Score",
  maxScore = 10,
  subtitle,
}: ScoreCardProps) {
  const scoreColor = getScoreColor(score, maxScore);
  const ringColor = getScoreRingColor(score, maxScore);

  return (
    <div className="flex flex-col items-center rounded-2xl border border-white/10 bg-white/5 p-8 text-center sm:flex-row sm:items-center sm:gap-8 sm:text-left">
      <div
        className={`relative flex h-28 w-28 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${ringColor} border border-white/10`}
      >
        <div className="text-center">
          <p className={`text-3xl font-bold tabular-nums ${scoreColor}`}>{score}</p>
          <p className="text-xs text-zinc-500">/ {maxScore}</p>
        </div>
      </div>
      <div className="mt-4 sm:mt-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-indigo-300">{label}</p>
        {subtitle ? <p className="mt-2 text-sm leading-relaxed text-zinc-400">{subtitle}</p> : null}
      </div>
    </div>
  );
}
