"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Sparkles } from "lucide-react";
import { Container } from "@/components/layout/Container";

type InterviewEvaluation = {
  questionId: string;
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  confidence: number;
};

type InterviewReport = {
  status: string;
  totalQuestions: number;
  evaluation?: {
    score: number;
    feedback: string;
    isFinalQuestion: boolean;
  };
  evaluations: InterviewEvaluation[];
};

export default function ReportPage() {
  const [report, setReport] = useState<InterviewReport | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("interview-report");
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as InterviewReport;
        setReport({
          ...parsed,
          evaluations: Array.isArray(parsed.evaluations) ? parsed.evaluations : [],
        });
      } catch (err) {
        console.error("Failed to load report", err);
      }
    }
  }, []);

  if (!report) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#09090B] text-white">
        <div className="text-center">
          <h1 className="text-3xl font-bold">No Report Found</h1>
          <p className="mt-3 text-zinc-400">Complete an interview first.</p>
          <Link href="/" className="mt-6 inline-block rounded-lg bg-indigo-600 px-5 py-3 text-white">
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  const evaluations = report.evaluations ?? [];
  const averageScore = evaluations.length
    ? evaluations.reduce((sum, evaluation) => sum + evaluation.score, 0) / evaluations.length
    : report.evaluation?.score ?? 0;
  const roundedScore = Math.round(averageScore * 10) / 10;

  const strengths = Array.from(
    new Set(evaluations.flatMap((evaluation) => evaluation.strengths)),
  ).slice(0, 6);

  const improvements = Array.from(
    new Set(evaluations.flatMap((evaluation) => evaluation.improvements)),
  ).slice(0, 6);

  const latestFeedback =
    evaluations.length > 0
      ? evaluations[evaluations.length - 1].feedback
      : report.evaluation?.feedback ?? "No evaluation feedback available.";

  const evaluatedQuestions = evaluations.length || (report.evaluation ? 1 : 0);

  const recommendation =
    roundedScore >= 8
      ? "Excellent performance."
      : roundedScore >= 6
        ? "Good performance with room for improvement."
        : "Keep practicing and improve core concepts.";

  return (
    <div className="min-h-screen bg-[#09090B] text-white">
      <header className="border-b border-white/10 bg-[#09090B]/80 backdrop-blur">
        <Container className="flex items-center justify-between py-4">
          <Link href="/" className="flex items-center gap-2 text-sm text-zinc-400 transition hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            Back home
          </Link>
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <Sparkles className="h-4 w-4 text-indigo-300" />
            Interview Report
          </div>
        </Container>
      </header>

      <main className="px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <Container className="space-y-6">
          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="rounded-[2rem] border border-white/10 bg-zinc-950/80 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.28)] sm:p-8"
          >
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-indigo-300">Candidate Summary</p>
                <h1 className="mt-3 text-3xl font-semibold text-white">Interview Completed</h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-400">
                  Your interview has been completed successfully. This report aggregates the evaluations from all answered questions.
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5 text-sm text-zinc-400">
                <p className="font-semibold text-white">Status</p>
                <p className="mt-2">{report.status}</p>
              </div>
            </div>
          </motion.section>

          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.05 }}
              className="rounded-[2rem] border border-white/10 bg-zinc-950/80 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.28)]"
            >
              <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6">
                <p className="text-sm text-zinc-400">Overall Score</p>
                <h2 className="mt-3 text-4xl font-bold text-white">{roundedScore}/10</h2>
                <p className="mt-2 text-xs text-zinc-500">
                  Based on {evaluatedQuestions} evaluated question{evaluatedQuestions === 1 ? "" : "s"}
                </p>
                <p className="mt-4 text-zinc-300">{latestFeedback}</p>
              </div>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.08 }}
              className="rounded-[2rem] border border-white/10 bg-zinc-950/80 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.28)]"
            >
              <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6">
                <p className="text-sm text-zinc-400">Questions Completed</p>
                <h2 className="mt-3 text-4xl font-bold text-white">{report.totalQuestions}</h2>
                <p className="mt-6 text-zinc-300">Recommendation: {recommendation}</p>

                {strengths.length > 0 && (
                  <div className="mt-6">
                    <p className="text-sm font-semibold text-white">Strengths</p>
                    <ul className="mt-3 space-y-2 text-sm text-zinc-400">
                      {strengths.map((strength) => (
                        <li key={strength}>• {strength}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {improvements.length > 0 && (
                  <div className="mt-6">
                    <p className="text-sm font-semibold text-white">Areas to Improve</p>
                    <ul className="mt-3 space-y-2 text-sm text-zinc-400">
                      {improvements.map((improvement) => (
                        <li key={improvement}>• {improvement}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </motion.section>
          </div>
        </Container>
      </main>
    </div>
  );
}