"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Sparkles } from "lucide-react";
import { Container } from "@/components/layout/Container";


type InterviewSessionData = {
  sessionId: string;
  candidate: {
    fullName: string;
    role: string;
  };
  firstQuestion: {
    id: string;
    prompt: string;
  };
  currentQuestion?: {
    id: string;
    prompt: string;
  };
  questionId?: string;
  currentQuestionNumber: number;
  totalQuestions: number;
};

function SessionPageContent() {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<InterviewSessionData | null>(null);
  const [answer, setAnswer] = useState("");
  const router = useRouter();

  useEffect(() => {
    console.log("SESSION PAGE RENDERED");
    const stored = sessionStorage.getItem("interview-session");
    console.log("SESSION EFFECT START");
    console.log("Stored session:", stored);

    queueMicrotask(() => {
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as InterviewSessionData;
          const currentQuestion = parsed.currentQuestion ?? parsed.firstQuestion;
          const normalizedSession = {
            ...parsed,
            currentQuestion,
            questionId: currentQuestion.id,
          };
          console.log("Parsed session:", parsed);
          setSession(normalizedSession);
        } catch (err) {
          console.error("Failed to parse interview session", err);
        }
      }

      if (!stored) {
        console.error("Interview session not found in sessionStorage");
      }
      console.log("Loading finished");
      setLoading(false);
    });
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!session) {
      console.error("No interview session loaded");
      return;
    }

    const currentQuestion = session.currentQuestion ?? session.firstQuestion;
    const payload = {
      sessionId: session.sessionId,
      questionId: currentQuestion.id,
      answer,
    };

    console.log("========== STEP 1 ==========");
    console.log("Frontend payload", payload);
    console.log("Submitting:", currentQuestion.id);
    console.log("Submitting answer for session:", session.sessionId);

    const response = await fetch("/api/interview/answer", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    console.log("Final submit response:", JSON.stringify(data, null, 2));
    console.log("Submit response:", data);

    if (!response.ok) {
      console.error("Submit failed", data);
      return;
    }

    console.log("Answer submitted successfully");
    console.log("Updating UI:", data.nextQuestion?.id);

    const interviewFinished =
      data.status === "completed" ||
      data.evaluation?.isFinalQuestion === true ||
      !data.nextQuestion;

    if (interviewFinished) {
      sessionStorage.setItem("interview-report", JSON.stringify(data));
      sessionStorage.removeItem("interview-session");
      router.replace("/report");
      return;
    }

    const updatedSession = {
      ...session,
      currentQuestion: data.nextQuestion ?? currentQuestion,
      questionId: data.nextQuestion?.id ?? currentQuestion.id,
      currentQuestionNumber: data.currentQuestionNumber ?? session.currentQuestionNumber,
    };

    setSession(updatedSession);
    sessionStorage.setItem("interview-session", JSON.stringify(updatedSession));
    setAnswer("");
  };

  return (
    <div className="min-h-screen bg-[#09090B] text-white">
      <header className="border-b border-white/10 bg-[#09090B]/80 backdrop-blur">
        <Container className="flex items-center justify-between py-4">
          <Link href="/interview" className="flex items-center gap-2 text-sm text-zinc-400 transition hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <Sparkles className="h-4 w-4 text-indigo-300" />
            Live Interview
          </div>
        </Container>
      </header>

      <main className="px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <Container className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="rounded-[2rem] border border-white/10 bg-zinc-950/80 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.28)] sm:p-8"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-indigo-300">{loading ? "Loading..." : `Question ${session?.currentQuestionNumber ?? 1}`}</p>
                <h1 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">
                  {loading ? "Loading session..." : session?.currentQuestion?.prompt ?? session?.firstQuestion.prompt ?? "No question found"}
                </h1>
              </div>
              <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-zinc-400">
                {loading ? "Loading session..." : `${session?.currentQuestionNumber ?? 1} / ${session?.totalQuestions ?? 0}`}
              </div>
            </div>

            <div className="mt-8 rounded-[1.5rem] border border-white/10 bg-white/5 p-6">
              <p className="text-sm uppercase tracking-[0.2em] text-zinc-400">Interview Question</p>

              <p className="mt-4 text-lg leading-8 text-white">
                {loading
                  ? "Loading question..."
                  : session?.currentQuestion?.prompt ?? session?.firstQuestion.prompt ?? "No question available."}
              </p>

              <form onSubmit={handleSubmit} className="mt-8">
                <textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  className="h-32 w-full rounded-xl border border-white/10 bg-zinc-900 p-4 text-white outline-none focus:border-indigo-500"
                  placeholder="Type your answer here..."
                />

                <button
                  type="submit"
                  disabled={loading || !session || !answer.trim()}
                  className="mt-4 mb-2 w-full rounded-xl bg-indigo-600 px-4 py-3 font-medium text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Submit Answer
                </button>
              </form>
            </div>
          </motion.section>

          <motion.aside
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="rounded-[2rem] border border-white/10 bg-zinc-950/80 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.28)]"
          >
            <div className="rounded-[1.25rem] border border-white/10 bg-white/5 p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-zinc-400">Candidate</p>
              <div className="mt-4 h-12 w-12 rounded-full bg-indigo-500/20" />
              {loading ? (
                <>
                  <div className="mt-4 h-4 w-32 rounded-full bg-white/10" />
                  <div className="mt-3 h-3 w-24 rounded-full bg-white/10" />
                </>
              ) : (
                <>
                  <h3 className="mt-4 font-semibold text-white">{session?.candidate.fullName}</h3>
                  <p className="mt-2 text-sm text-zinc-400">{session?.candidate.role}</p>
                </>
              )}
              <div className="mt-6 h-2 w-full rounded-full bg-white/10" />
            </div>
          </motion.aside>
        </Container>
      </main>
    </div>
  );
}

export default function InterviewSessionPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#09090B]" />}> 
      <SessionPageContent />
    </Suspense>
  );
}
