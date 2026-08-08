import { motion } from "framer-motion";
import { CheckCircle2, Lightbulb, Sparkles, TriangleAlert } from "lucide-react";

export interface EvaluationPanelProps {
  score?: number;
  confidence?: number;
  feedback?: string;
  strengths?: string[];
  improvements?: string[];
  followUpQuestion?: string;
  shouldAskFollowUp?: boolean;
  onContinue?: () => void;
  isLoading?: boolean;
}

function getScoreTone(score = 0) {
  if (score >= 8) {
    return "text-emerald-300";
  }

  if (score >= 5) {
    return "text-amber-300";
  }

  return "text-rose-300";
}

export function EvaluationPanel({
  score = 0,
  confidence = 0,
  feedback = "Your answer is being evaluated.",
  strengths = [],
  improvements = [],
  followUpQuestion,
  shouldAskFollowUp = false,
  onContinue,
  isLoading = false,
}: EvaluationPanelProps) {
  const scoreTone = getScoreTone(score);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="rounded-[1.75rem] border border-white/10 bg-zinc-950/80 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.25)]"
      aria-live="polite"
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.25em] text-indigo-300">
            <Sparkles className="h-4 w-4" />
            AI Evaluation
          </div>
          <h2 className="mt-3 text-2xl font-semibold text-white">Your answer is ready</h2>
          <p className="mt-3 text-sm leading-7 text-zinc-400">{feedback}</p>
        </div>

        <div className="flex items-center justify-center rounded-full border border-white/10 bg-white/5 p-4">
          <div className={`text-4xl font-semibold ${scoreTone}`}>{score}/10</div>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
          <div className="flex items-center justify-between text-sm text-zinc-400">
            <span>Confidence</span>
            <span>{Math.round(confidence * 100)}%</span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-800">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.max(0, Math.min(100, confidence * 100))}%` }}
              transition={{ duration: 0.6 }}
              className={`h-full rounded-full ${score >= 8 ? "bg-emerald-400" : score >= 5 ? "bg-amber-400" : "bg-rose-400"}`}
            />
          </div>

          <div className="mt-6 space-y-4">
            <div className="rounded-[1rem] border border-emerald-400/20 bg-emerald-500/10 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-300">
                <CheckCircle2 className="h-4 w-4" />
                Strengths
              </div>
              {strengths.length > 0 ? (
                <ul className="mt-3 space-y-2 text-sm text-zinc-300">
                  {strengths.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="mt-1 h-2 w-2 rounded-full bg-emerald-400" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-zinc-400">Strengths will appear here once the backend returns them.</p>
              )}
            </div>

            <div className="rounded-[1rem] border border-amber-400/20 bg-amber-500/10 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-amber-300">
                <TriangleAlert className="h-4 w-4" />
                Improvements
              </div>
              {improvements.length > 0 ? (
                <ul className="mt-3 space-y-2 text-sm text-zinc-300">
                  {improvements.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="mt-1 h-2 w-2 rounded-full bg-amber-400" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-zinc-400">Opportunities will appear here once the backend returns them.</p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {shouldAskFollowUp && followUpQuestion ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="rounded-[1.5rem] border border-indigo-400/25 bg-indigo-500/10 p-5"
            >
              <div className="flex items-center gap-2 text-sm font-semibold text-indigo-200">
                <Lightbulb className="h-4 w-4" />
                Adaptive follow-up
              </div>
              <h3 className="mt-3 text-lg font-semibold text-white">AI wants to ask a follow-up question</h3>
              <p className="mt-3 text-sm leading-7 text-zinc-300">{followUpQuestion}</p>
              <button
                type="button"
                className="mt-5 rounded-full bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400"
                onClick={onContinue}
              >
                Answer Follow-up
              </button>
            </motion.div>
          ) : (
            <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-zinc-400">Next step</p>
              <h3 className="mt-3 text-xl font-semibold text-white">Continue to the next question</h3>
              <p className="mt-3 text-sm leading-7 text-zinc-400">
                The interview flow will advance once you continue.
              </p>
              <button
                type="button"
                className="mt-5 rounded-full border border-white/10 bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800"
                onClick={onContinue}
              >
                Continue
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
