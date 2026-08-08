"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Sparkles } from "lucide-react";
import { Container } from "@/components/layout/Container";

type InterviewReport = {
  status: string;
  totalQuestions: number;
  evaluation: {
    score: number;
    feedback: string;
    isFinalQuestion: boolean;
  };
};

export default function ReportPage() {
  const [report, setReport] = useState<InterviewReport | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("interview-report");
    if (stored) {
      try {
        setReport(JSON.parse(stored));
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
          <Link href="/" className="mt-6 inline-block rounded-lg bg-indigo-600 px-5 py-3 text-white">Go Home</Link>
        </div>
      </div>
    );
  }

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
                  Your interview has been completed successfully. Below is a summary of your performance generated from the interview evaluation.
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
                <div>
                  <p className="text-sm text-zinc-400">Overall Score</p>
                  <h2 className="mt-3 text-4xl font-bold text-white">{report.evaluation.score}/5</h2>
                  <p className="mt-4 text-zinc-300">{report.evaluation.feedback}</p>
                </div>
              </div>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.08 }}
              className="rounded-[2rem] border border-white/10 bg-zinc-950/80 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.28)]"
            >
              <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6">
                <div>
                  <p className="text-sm text-zinc-400">Questions Completed</p>
                  <h2 className="mt-3 text-4xl font-bold text-white">{report.totalQuestions}</h2>
                  <p className="mt-6 text-zinc-300">
                    {report.evaluation.score >= 4 ? "Recommendation: Excellent performance." : "Recommendation: Keep practicing and improve core concepts."}
                  </p>
                </div>
              </div>
            </motion.section>
          </div>
        </Container>
      </main>
    </div>
  );
}
