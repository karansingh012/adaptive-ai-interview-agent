"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { AlertCircle, ArrowLeft, ArrowRight, LoaderCircle, Sparkles } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { ScoreCard } from "@/components/report/ScoreCard";
import { RecommendationCard } from "@/components/report/RecommendationCard";
import {
  buildInterviewReport,
  getQuestionPrompt,
  type InterviewReportPayload,
  type StoredEvaluation,
} from "@/lib/services/report.service";
import type { InterviewQuestionRecord } from "@/types/interview";

type InterviewReport = InterviewReportPayload;

function getScoreBadgeColor(score: number) {
  if (score >= 8) return "bg-emerald-500/15 text-emerald-300 border-emerald-500/20";
  if (score >= 6) return "bg-amber-500/15 text-amber-300 border-amber-500/20";
  return "bg-rose-500/15 text-rose-300 border-rose-500/20";
}

function ReportPageContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [report, setReport] = useState<InterviewReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadReport() {
      setLoading(true);
      setLoadError(null);

      const stored = sessionStorage.getItem("interview-report");
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as Record<string, unknown>;
          if (!cancelled) {
            setReport(resolveReport(parsed));
            setLoading(false);
          }
          return;
        } catch {
          sessionStorage.removeItem("interview-report");
        }
      }

      if (!token) {
        if (!cancelled) {
          setLoading(false);
        }
        return;
      }

      try {
        const response = await fetch(`/api/interview/report-by-token?token=${encodeURIComponent(token)}`);
        const data = await response.json().catch(() => null);

        if (cancelled) return;

        if (!response.ok || !data?.report) {
          setLoadError(data?.error ?? "Report not available yet.");
          setLoading(false);
          return;
        }

        setReport(resolveReport(data.report as Record<string, unknown>));
        setLoading(false);
      } catch {
        if (!cancelled) {
          setLoadError("Unable to load the interview report.");
          setLoading(false);
        }
      }
    }

    void loadReport();

    return () => {
      cancelled = true;
    };
  }, [token]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#09090B] text-white">
        <div className="flex items-center gap-3 text-sm text-zinc-400">
          <LoaderCircle className="h-5 w-5 animate-spin text-indigo-400" />
          Loading report…
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#09090B] px-4 text-white">
        <div className="max-w-sm text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/15 text-indigo-300">
            <Sparkles className="h-6 w-6" />
          </div>
          <h1 className="mt-5 text-2xl font-semibold">No Report Found</h1>
          <p className="mt-2 text-sm text-zinc-400">
            {loadError ?? "Complete an interview first to view results."}
          </p>
          <Link
            href="/dashboard"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500"
          >
            Go to Dashboard
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  const evaluations = report.evaluations ?? [];
  const questionHistory = report.questionHistory ?? [];
  const evaluatedQuestions = report.questionsAnswered || evaluations.length;
  const isIncomplete = report.status !== "completed" || evaluatedQuestions < report.totalQuestions;
  const showFallbackNotice = report.evaluationSource === "fallback" || report.evaluationSource === "mixed";

  if (evaluations.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#09090B] px-4 text-white">
        <div className="max-w-sm text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-300">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h1 className="mt-5 text-2xl font-semibold">Report Incomplete</h1>
          <p className="mt-2 text-sm text-zinc-400">
            No evaluations were recorded for this interview. The session may have ended prematurely.
          </p>
          <Link
            href="/dashboard"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500"
          >
            Go to Dashboard
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090B] text-white">
      <header className="border-b border-white/10 bg-[#09090B]/80 backdrop-blur-md">
        <Container className="flex items-center justify-between py-3">
          <Link href="/dashboard" className="flex items-center gap-2 text-sm text-zinc-400 transition hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </Link>
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <Sparkles className="h-4 w-4 text-indigo-400" />
            Interview Report
          </div>
        </Container>
      </header>

      <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <Container className="space-y-5">
          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="rounded-2xl border border-white/10 bg-zinc-950/80 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.28)] sm:p-6"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-indigo-300">Interview Complete</p>
                <h1 className="mt-1 text-2xl font-semibold text-white sm:text-3xl">Performance Report</h1>
                <p className="mt-2 text-sm text-zinc-400">
                  {report.candidate?.fullName
                    ? `${report.candidate.fullName} · ${report.candidate.role}`
                    : "Candidate interview"}
                </p>
                <p className="mt-1 text-sm text-zinc-500">
                  {evaluatedQuestions} question{evaluatedQuestions === 1 ? "" : "s"} evaluated
                  {report.followUpCount > 0
                    ? ` · ${report.followUpCount} follow-up${report.followUpCount === 1 ? "" : "s"}`
                    : ""}
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-400">
                  <span className="text-zinc-500">Questions completed</span>
                  <p className="text-lg font-semibold text-white">{evaluatedQuestions}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-400">
                  <span className="text-zinc-500">Avg. confidence</span>
                  <p className="text-lg font-semibold text-white">{Math.round(report.averageConfidence * 100)}%</p>
                </div>
              </div>
            </div>

            {showFallbackNotice && (
              <p className="mt-4 rounded-lg border border-zinc-700/50 bg-zinc-800/40 px-3 py-2 text-xs text-zinc-400">
                AI evaluation temporarily unavailable — fallback assessment used
                {report.fallbackCount > 0 ? ` for ${report.fallbackCount} question${report.fallbackCount === 1 ? "" : "s"}` : ""}.
              </p>
            )}

            {isIncomplete && (
              <p className="mt-3 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-amber-300">
                This report reflects a partially completed interview ({evaluatedQuestions} of {report.totalQuestions} questions).
              </p>
            )}
          </motion.section>

          <div className="grid gap-5 lg:grid-cols-2">
            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.05 }}
              className="rounded-2xl border border-white/10 bg-zinc-950/80 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.28)]"
            >
              <ScoreCard
                score={report.overallScore}
                label="Overall Score"
                maxScore={10}
                subtitle={`Based on ${evaluatedQuestions} evaluated question${evaluatedQuestions === 1 ? "" : "s"}`}
              />
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.08 }}
              className="rounded-2xl border border-white/10 bg-zinc-950/80 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.28)]"
            >
              <RecommendationCard
                title="Recommendation"
                tier={report.recommendationTier}
                description={report.recommendation}
                strengths={report.strengths}
                improvements={report.improvements}
              />
            </motion.section>
          </div>

          {report.topicPerformance.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.09 }}
              className="rounded-2xl border border-white/10 bg-zinc-950/80 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.28)] sm:p-6"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-indigo-300">Topic Performance</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {report.topicPerformance.map((topic) => (
                  <div key={topic.topic} className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <p className="font-medium text-white">{topic.topic}</p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {topic.questionsAsked} question{topic.questionsAsked === 1 ? "" : "s"}
                      {topic.followUpsAsked > 0
                        ? ` · ${topic.followUpsAsked} follow-up${topic.followUpsAsked === 1 ? "" : "s"}`
                        : ""}
                    </p>
                    <p className={`mt-2 text-sm font-semibold ${getScoreBadgeColor(topic.averageScore).split(" ").find((c) => c.startsWith("text-")) ?? "text-indigo-300"}`}>
                      {topic.averageScore}/10 avg.
                    </p>
                  </div>
                ))}
              </div>
            </motion.section>
          )}

          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.1 }}
            className="rounded-2xl border border-white/10 bg-zinc-950/80 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.28)] sm:p-6"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-300">Per-Question Breakdown</p>
            <h2 className="mt-1 text-lg font-semibold text-white">Question Evaluations</h2>
            <div className="mt-5 space-y-4">
              {evaluations.map((evaluation, index) => {
                const historyRecord = questionHistory.find((record) => record.questionId === evaluation.questionId);
                const questionPrompt = historyRecord
                  ? getQuestionPrompt(historyRecord, index)
                  : `Question ${index + 1}`;

                return (
                  <div
                    key={`${evaluation.questionId}-${index}`}
                    className="rounded-xl border border-white/10 bg-white/5 p-4 sm:p-5"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-medium text-zinc-500">Question {index + 1}</p>
                          {evaluation.source === "fallback" && (
                            <span className="rounded-md border border-zinc-600/50 bg-zinc-800/50 px-1.5 py-0.5 text-[10px] text-zinc-500">
                              fallback
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm font-medium text-zinc-200">{questionPrompt}</p>
                        <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                          {evaluation.summary || evaluation.feedback}
                        </p>
                      </div>
                      <span
                        className={`inline-flex shrink-0 items-center rounded-lg border px-3 py-1 text-sm font-semibold tabular-nums ${getScoreBadgeColor(evaluation.score)}`}
                      >
                        {evaluation.score}/10
                      </span>
                    </div>
                    {(evaluation.strengths.length > 0 ||
                      evaluation.improvements.length > 0 ||
                      evaluation.missingConcepts.length > 0) && (
                      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {evaluation.strengths.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-emerald-400">Strengths</p>
                            <ul className="mt-1.5 space-y-1">
                              {evaluation.strengths.map((s) => (
                                <li key={s} className="text-xs text-zinc-400">
                                  {s}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {evaluation.improvements.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-amber-400">Improve</p>
                            <ul className="mt-1.5 space-y-1">
                              {evaluation.improvements.map((i) => (
                                <li key={i} className="text-xs text-zinc-400">
                                  {i}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {evaluation.missingConcepts.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-rose-400">Missing Concepts</p>
                            <ul className="mt-1.5 space-y-1">
                              {evaluation.missingConcepts.map((c) => (
                                <li key={c} className="text-xs text-zinc-400">
                                  {c}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.section>

          <div className="flex justify-center pb-4 pt-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500"
            >
              Back to Dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Container>
      </main>
    </div>
  );
}

function resolveReport(input: Record<string, unknown>): InterviewReport {
  if (hasBuiltReportFields(input)) {
    return input as unknown as InterviewReport;
  }

  const reportData = input.reportData as Record<string, unknown> | undefined;
  if (reportData && hasBuiltReportFields(reportData)) {
    return reportData as unknown as InterviewReport;
  }

  const evaluations = normalizeEvaluationsList(input.evaluations);
  return buildInterviewReport({
    sessionId: typeof input.sessionId === "string" ? input.sessionId : undefined,
    status: typeof input.status === "string" ? input.status : "completed",
    totalQuestions: typeof input.totalQuestions === "number" ? input.totalQuestions : evaluations.length,
    evaluations,
    questionHistory: Array.isArray(input.questionHistory)
      ? (input.questionHistory as InterviewQuestionRecord[])
      : undefined,
    candidate: isCandidateSummary(input.candidate) ? input.candidate : undefined,
  });
}

function hasBuiltReportFields(input: Record<string, unknown>): boolean {
  return typeof input.overallScore === "number" &&
    typeof input.recommendation === "string" &&
    Array.isArray(input.evaluations);
}

function normalizeEvaluationsList(value: unknown): StoredEvaluation[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item) => {
    const record = item as Record<string, unknown>;
    const summary = typeof record.summary === "string"
      ? record.summary
      : typeof record.feedback === "string"
        ? record.feedback
        : "";
    return {
      questionId: String(record.questionId ?? ""),
      score: Number(record.score ?? 0),
      summary,
      feedback: typeof record.feedback === "string" ? record.feedback : summary,
      strengths: Array.isArray(record.strengths) ? (record.strengths as string[]) : [],
      improvements: Array.isArray(record.improvements) ? (record.improvements as string[]) : [],
      missingConcepts: Array.isArray(record.missingConcepts) ? (record.missingConcepts as string[]) : [],
      confidence: Number(record.confidence ?? 0),
      source: record.source === "fallback" ? "fallback" : record.source === "gemini" ? "gemini" : undefined,
    };
  });
}

function isCandidateSummary(value: unknown): value is { fullName: string; role: string } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return typeof candidate.fullName === "string" && typeof candidate.role === "string";
}

export default function ReportPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#09090B]" />}>
      <ReportPageContent />
    </Suspense>
  );
}
