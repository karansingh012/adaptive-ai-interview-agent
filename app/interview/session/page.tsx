"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, LoaderCircle, Sparkles, User } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { AnswerEditor } from "@/components/interview/AnswerEditor";
import { ProgressBar } from "@/components/interview/ProgressBar";
import type { AdaptiveSessionState, InterviewQuestionRecord } from "@/types/interview";
import type { InterviewQuestion } from "@/types/question";

type InterviewSessionData = {
  sessionId: string;
  interviewToken?: string;
  candidate: {
    fullName: string;
    role: string;
  };
  firstQuestion: InterviewQuestion;
  currentQuestion?: InterviewQuestion;
  questionHistory?: Array<InterviewQuestion | InterviewQuestionRecord>;
  questionId?: string;
  currentQuestionNumber: number;
  totalQuestions: number;
  evaluations: Array<{
    questionId: string;
    score: number;
    summary?: string;
    feedback: string;
    strengths: string[];
    improvements: string[];
    missingConcepts?: string[];
    confidence: number;
    source?: "gemini" | "fallback";
  }>;
  sessionState?: AdaptiveSessionState;
  questionLabel?: string;
};

type LoadError = "missing" | "invalid" | "not_found" | "network" | "completed";

function SessionPageContent() {
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [session, setSession] = useState<InterviewSessionData | null>(null);
  const [loadError, setLoadError] = useState<LoadError | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [answer, setAnswer] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionIdFromUrl = searchParams.get("sessionId");
  const tokenFromUrl = searchParams.get("token");

  useEffect(() => {
    let cancelled = false;

    async function loadSession() {
      setLoading(true);
      setLoadError(null);

      const stored = sessionStorage.getItem("interview-session");
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as InterviewSessionData;
          const sessionMatches =
            (!sessionIdFromUrl || parsed.sessionId === sessionIdFromUrl) &&
            (!tokenFromUrl || parsed.interviewToken === tokenFromUrl);

          if (sessionMatches) {
            if (!cancelled) {
              setSession(normalizeSession(parsed));
              setLoading(false);
            }
            return;
          }
        } catch {
          sessionStorage.removeItem("interview-session");
        }
      }

      if (tokenFromUrl) {
        try {
          const response = await fetch("/api/interview/start", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: tokenFromUrl }),
          });
          const data = await response.json().catch(() => null);

          if (cancelled) return;

          if (!response.ok) {
            if (response.status === 410) {
              setLoadError("completed");
            } else if (response.status === 404) {
              setLoadError("invalid");
            } else {
              setLoadError("network");
            }
            setLoading(false);
            return;
          }

          if (!data?.firstQuestion || !data?.candidate) {
            setLoadError("not_found");
            setLoading(false);
            return;
          }

          const normalized = normalizeSession(data as InterviewSessionData);
          setSession(normalized);
          sessionStorage.setItem("interview-session", JSON.stringify(normalized));
          setLoading(false);
          return;
        } catch {
          if (!cancelled) {
            setLoadError("network");
            setLoading(false);
          }
          return;
        }
      }

      if (!sessionIdFromUrl) {
        if (!cancelled) {
          setLoadError("missing");
          setLoading(false);
        }
        return;
      }

      try {
        const response = await fetch(
          `/api/interview/session?sessionId=${encodeURIComponent(sessionIdFromUrl)}`,
        );
        const data = await response.json().catch(() => null);

        if (cancelled) return;

        if (!response.ok) {
          if (response.status === 404) {
            setLoadError("not_found");
          } else if (response.status === 410 || response.status === 400) {
            setLoadError("invalid");
          } else {
            setLoadError("network");
          }
          setLoading(false);
          return;
        }

        if (!data?.firstQuestion || !data?.candidate) {
          setLoadError("not_found");
          setLoading(false);
          return;
        }

const { ...sessionData } = data as InterviewSessionData & { success?: boolean };
        const normalized = normalizeSession(sessionData as InterviewSessionData);
        setSession(normalized);
        sessionStorage.setItem("interview-session", JSON.stringify(normalized));
        setLoading(false);
      } catch {
        if (!cancelled) {
          setLoadError("network");
          setLoading(false);
        }
      }
    }

    void loadSession();

    return () => {
      cancelled = true;
    };
  }, [sessionIdFromUrl, tokenFromUrl]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!session || isSubmitting) {
      return;
    }

    setSubmitError(null);
    const currentQuestion = session.currentQuestion ?? session.firstQuestion;
    const updatedClientSession = {
      ...session,
      currentQuestion,
    };
    const payload = {
      sessionId: session.sessionId,
      questionId: currentQuestion.id,
      answer,
      currentQuestion,
      previousQuestions: questionsFromHistory(session.questionHistory),
      questionHistory: session.questionHistory ?? [],
      sessionState: session.sessionState,
      interviewToken: session.interviewToken,
      evaluations: session.evaluations ?? [],
      candidate: session.candidate,
      clientSession: updatedClientSession,
    };

    setIsSubmitting(true);
    let response: Response;
    try {
      response = await fetch("/api/interview/answer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
    } catch {
      setSubmitError("Network error. Please check your connection and try again.");
      setIsSubmitting(false);
      return;
    }

    let data: Record<string, unknown>;
    try {
      data = await response.json();
    } catch {
      setSubmitError("Unexpected server response. Please try again.");
      setIsSubmitting(false);
      return;
    }

    if (!response.ok || data.success === false) {
      setSubmitError(
        typeof data.error === "string"
          ? data.error
          : "Unable to submit your answer. Please try again.",
      );
      setIsSubmitting(false);
      return;
    }

    const evaluation = data.evaluation as Record<string, unknown> | undefined;
    const updatedEvaluations = Array.isArray(data.evaluations)
      ? (data.evaluations as InterviewSessionData["evaluations"])
      : [...(session.evaluations ?? []), {
          questionId: currentQuestion.id,
          score: Number(evaluation?.score ?? 0),
          summary: typeof evaluation?.summary === "string" ? evaluation.summary : String(evaluation?.feedback ?? ""),
          feedback: String(evaluation?.feedback ?? ""),
          strengths: Array.isArray(evaluation?.strengths) ? (evaluation.strengths as string[]) : [],
          improvements: Array.isArray(evaluation?.improvements) ? (evaluation.improvements as string[]) : [],
          missingConcepts: Array.isArray(evaluation?.missingConcepts) ? (evaluation.missingConcepts as string[]) : [],
          confidence: Number(evaluation?.confidence ?? 0),
          source: evaluation?.source === "fallback" ? "fallback" as const : "gemini" as const,
        }];
    const updatedAnsweredHistory = Array.isArray(data.questionHistory)
      ? (data.questionHistory as InterviewQuestionRecord[])
      : markQuestionAnswered(
          session.questionHistory ?? [],
          currentQuestion,
          answer,
          updatedEvaluations[updatedEvaluations.length - 1],
        );

    const nextQuestion = data.nextQuestion as InterviewQuestion | undefined;
    const interviewFinished =
      data.status === "completed" || evaluation?.isFinalQuestion === true;

    if (interviewFinished) {
      const reportPayload = (data.reportData as Record<string, unknown> | undefined) ?? {
        ...data,
        evaluations: updatedEvaluations,
        questionHistory: updatedAnsweredHistory,
        candidate: session.candidate,
        totalQuestions: Number(data.totalQuestions ?? session.totalQuestions),
        status: "completed",
      };
      sessionStorage.setItem("interview-report", JSON.stringify(reportPayload));
      sessionStorage.removeItem("interview-session");

      if (session.interviewToken) {
        await fetch("/api/interview/session", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: session.sessionId,
            completed: true,
            reportData: reportPayload,
          }),
        }).catch(() => undefined);
      }

      router.replace(session.interviewToken ? `/report?token=${encodeURIComponent(session.interviewToken)}` : "/report");
      return;
    }

    if (!nextQuestion) {
      setSubmitError("The interview could not load the next question. Please refresh and try again.");
      setIsSubmitting(false);
      return;
    }

    const updatedSession: InterviewSessionData = {
      ...session,
      evaluations: updatedEvaluations,
      currentQuestion: nextQuestion,
      questionHistory: [...updatedAnsweredHistory, createQuestionRecord(nextQuestion)],
      questionId: nextQuestion.id,
      currentQuestionNumber: Number(data.currentQuestionNumber ?? session.currentQuestionNumber + 1),
      totalQuestions: Number(data.totalQuestions ?? session.totalQuestions),
      sessionState: (data.sessionState as AdaptiveSessionState | undefined) ?? session.sessionState,
      questionLabel:
        typeof evaluation?.questionLabel === "string"
          ? evaluation.questionLabel
          : nextQuestion.questionType === "follow_up"
            ? "Follow-up question"
            : undefined,
    };

    setSession(updatedSession);
    sessionStorage.setItem("interview-session", JSON.stringify(updatedSession));
    setAnswer("");
    setIsSubmitting(false);
  };

  const errorMessage = getErrorMessage(loadError);
  const currentQuestionText =
    session?.currentQuestion?.prompt ?? session?.firstQuestion.prompt ?? "No question available.";
  const questionNumber = session?.currentQuestionNumber ?? 1;
  const totalQuestions = session?.totalQuestions ?? 8;
  const candidateInitials = session?.candidate.fullName
    ? session.candidate.fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "?";

  return (
    <div className="min-h-screen bg-[#09090B] text-white">
      <header className="border-b border-white/10 bg-[#09090B]/80 backdrop-blur-md">
        <Container className="flex items-center justify-between py-3">
          <Link href="/" className="flex items-center gap-2 text-sm text-zinc-400 transition hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <Sparkles className="h-4 w-4 text-indigo-400" />
            Live Interview
          </div>
        </Container>
      </header>

      <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <Container className="grid gap-5 xl:grid-cols-[1fr_280px]">
          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="rounded-2xl border border-white/10 bg-zinc-950/80 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.28)] sm:p-6"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/20 text-xs font-bold text-indigo-300">
                  {loading ? "…" : questionNumber}
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-indigo-300">
                    {loading
                      ? "Loading interview…"
                      : loadError
                        ? "Interview unavailable"
                        : `Question ${questionNumber} of ${totalQuestions}`}
                  </p>
                  <p className="text-xs text-zinc-500">Answer thoughtfully — follow-ups may appear</p>
                </div>
              </div>
              {!loading && !loadError && totalQuestions > 0 && (
                <div className="w-full sm:w-40">
                  <ProgressBar current={questionNumber} total={totalQuestions} />
                </div>
              )}
            </div>

            <div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-5">
              {session?.questionLabel ? (
                <p className="mb-2 text-xs font-medium text-indigo-300">{session.questionLabel}</p>
              ) : null}
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Interview Question</p>
              <p className="mt-3 text-base leading-relaxed text-zinc-100 sm:text-[15px] sm:leading-7">
                {loading
                  ? "Loading interview…"
                  : loadError
                    ? errorMessage
                    : currentQuestionText}
              </p>

              {!loadError ? (
                <form onSubmit={handleSubmit} className="mt-6">
                  <AnswerEditor
                    value={answer}
                    onChange={setAnswer}
                    disabled={loading || isSubmitting || !session}
                    placeholder="Type your answer here…"
                  />

                  {submitError ? (
                    <p className="mt-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                      {submitError}
                    </p>
                  ) : null}

                  <button
                    type="submit"
                    disabled={loading || isSubmitting || !session || !answer.trim()}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                        Evaluating…
                      </>
                    ) : (
                      "Submit Answer"
                    )}
                  </button>
                </form>
              ) : null}
            </div>
          </motion.section>

          <motion.aside
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="rounded-2xl border border-white/10 bg-zinc-950/80 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.28)]"
          >
            <div className="rounded-xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Candidate</p>
              {loading ? (
                <div className="mt-4 space-y-3">
                  <div className="h-12 w-12 rounded-full bg-white/10" />
                  <div className="h-4 w-32 rounded-full bg-white/10" />
                  <div className="h-3 w-24 rounded-full bg-white/10" />
                </div>
              ) : loadError ? (
                <p className="mt-4 text-sm text-zinc-400">{errorMessage}</p>
              ) : (
                <>
                  <div className="mt-4 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500/20 text-sm font-semibold text-indigo-300">
                      {candidateInitials || <User className="h-5 w-5" />}
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold text-white">{session?.candidate.fullName}</h3>
                      <p className="truncate text-sm text-zinc-400">{session?.candidate.role}</p>
                    </div>
                  </div>
                  {totalQuestions > 0 && (
                    <div className="mt-5">
                      <ProgressBar current={questionNumber} total={totalQuestions} />
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.aside>
        </Container>
      </main>
    </div>
  );
}

function normalizeSession(parsed: InterviewSessionData): InterviewSessionData {
  const currentQuestion = parsed.currentQuestion ?? parsed.firstQuestion;
  const questionHistory = normalizeQuestionHistory(parsed.questionHistory, currentQuestion);

  return {
    ...parsed,
    evaluations: Array.isArray(parsed.evaluations) ? parsed.evaluations : [],
    currentQuestion,
    questionHistory,
    questionId: currentQuestion.id,
    sessionState: parsed.sessionState ?? {
      currentTopicIndex: 0,
      followUpCountForCurrentTopic: 0,
      totalQuestionsAsked: 0,
      mainTopicsCompleted: 0,
    },
    totalQuestions: parsed.totalQuestions ?? 8,
  };
}

function getErrorMessage(error: LoadError | null): string {
  switch (error) {
    case "missing":
    case "invalid":
      return "Invalid or expired interview link.";
    case "completed":
      return "This interview has already been completed.";
    case "not_found":
      return "Candidate or session not found.";
    case "network":
      return "Unable to load the interview. Please try again.";
    default:
      return "No question available.";
  }
}

function normalizeQuestionHistory(
  history: Array<InterviewQuestion | InterviewQuestionRecord> | undefined,
  currentQuestion: InterviewQuestion,
): InterviewQuestionRecord[] {
  if (!Array.isArray(history) || history.length === 0) {
    return [createQuestionRecord(currentQuestion)];
  }

  const records = history.map((item) => {
    if ("questionId" in item) {
      return item;
    }

    return createQuestionRecord(item);
  });

  if (!records.some((record) => record.questionId === currentQuestion.id)) {
    records.push(createQuestionRecord(currentQuestion));
  }

  return records;
}

function questionsFromHistory(
  history: Array<InterviewQuestion | InterviewQuestionRecord> | undefined,
): InterviewQuestion[] {
  if (!Array.isArray(history)) {
    return [];
  }

  return history
    .map((item) => ("questionId" in item ? item.question : item))
    .filter((question): question is InterviewQuestion => Boolean(question));
}

function createQuestionRecord(question: InterviewQuestion): InterviewQuestionRecord {
  return {
    questionId: question.id,
    question,
    questionType: question.questionType ?? "main",
    parentQuestionId: question.parentQuestionId,
    askedAt: question.createdAt ?? new Date().toISOString(),
    followUpCount: question.followUpCount,
  };
}

function markQuestionAnswered(
  history: Array<InterviewQuestion | InterviewQuestionRecord>,
  question: InterviewQuestion,
  answer: string,
  evaluation: {
    score: number;
    summary?: string;
    feedback: string;
    strengths: string[];
    improvements: string[];
    missingConcepts?: string[];
    confidence: number;
    source?: "gemini" | "fallback";
  },
): InterviewQuestionRecord[] {
  const records = normalizeQuestionHistory(history, question);

  return records.map((record) => {
    if (record.questionId !== question.id) {
      return record;
    }

    return {
      ...record,
      response: answer,
      candidateAnswer: answer,
      evaluatedScore: evaluation.score,
      evaluation,
    };
  });
}

export default function InterviewSessionPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#09090B]" />}>
      <SessionPageContent />
    </Suspense>
  );
}
