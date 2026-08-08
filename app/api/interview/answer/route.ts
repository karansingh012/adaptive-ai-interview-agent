import { NextRequest, NextResponse } from "next/server";
import { interviewService } from "@/lib/services/interview.service";
import { interviewLinkService } from "@/lib/services/interview-link.service";
import { buildInterviewReport, type StoredEvaluation } from "@/lib/services/report.service";
import { getErrorDiagnostics } from "@/lib/services/gemini.service";
import { MAX_TOTAL_QUESTIONS } from "@/utils/constants";
import type { InterviewQuestionRecord } from "@/types/interview";
import type { InterviewQuestion } from "@/types/question";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as {
      sessionId?: string;
      questionId?: string;
      answer?: string;
      currentQuestion?: InterviewQuestion;
      previousQuestions?: InterviewQuestion[];
      questionHistory?: InterviewQuestionRecord[];
      sessionState?: {
        currentTopicIndex: number;
        followUpCountForCurrentTopic: number;
        totalQuestionsAsked: number;
        mainTopicsCompleted: number;
      };
      interviewToken?: string;
      clientSession?: Record<string, unknown>;
      evaluations?: Array<{
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
      candidate?: {
        fullName: string;
        role: string;
      };
    } | null;

    if (
      !body ||
      typeof body.sessionId !== "string" ||
      body.sessionId.trim() === "" ||
      typeof body.questionId !== "string" ||
      body.questionId.trim() === "" ||
      typeof body.answer !== "string"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request: sessionId, questionId, and answer are required.",
        },
        { status: 400 },
      );
    }

    const sessionId = body.sessionId.trim();
    const questionId = body.questionId.trim();
    const answer = body.answer;
    const questionHistory = Array.isArray(body.questionHistory)
      ? body.questionHistory.filter(isInterviewQuestionRecord)
      : [];
    const previousQuestions = Array.isArray(body.previousQuestions)
      ? body.previousQuestions.filter(isInterviewQuestion)
      : [];
    const currentQuestion = isInterviewQuestion(body.currentQuestion) ? body.currentQuestion : undefined;

    if (!currentQuestion) {
      return NextResponse.json(
        { success: false, error: "Invalid request: currentQuestion is required." },
        { status: 400 },
      );
    }

    if (currentQuestion.id !== questionId) {
      return NextResponse.json(
        { success: false, error: "Question ID does not match the current question." },
        { status: 409 },
      );
    }

    console.log("[Answer API] Submitting answer", {
      sessionId,
      questionId,
      answerLength: answer.length,
      historyCount: questionHistory.length,
    });

    const response = await interviewService.submitAnswer(
      sessionId,
      questionId,
      answer,
      currentQuestion,
      previousQuestions,
      questionHistory,
      isAdaptiveSessionState(body.sessionState) ? body.sessionState : undefined,
    );

    const evaluationRecord = {
      questionId,
      score: response.evaluation.score,
      summary: response.evaluation.summary,
      feedback: response.evaluation.feedback,
      strengths: response.evaluation.strengths,
      improvements: response.evaluation.improvements,
      missingConcepts: response.evaluation.missingConcepts,
      confidence: response.evaluation.confidence,
      source: response.evaluation.source,
    };

    const priorEvaluations = normalizeStoredEvaluations(body.evaluations);
    const evaluations: StoredEvaluation[] = [...priorEvaluations, evaluationRecord];
    const updatedHistory = markQuestionAnswered(questionHistory, currentQuestion, answer, evaluationRecord);

    let reportData;
    if (response.status === "completed") {
      reportData = buildInterviewReport({
        sessionId,
        status: response.status,
        totalQuestions: MAX_TOTAL_QUESTIONS,
        evaluations,
        questionHistory: updatedHistory,
        candidate: isCandidateSummary(body.candidate) ? body.candidate : undefined,
      });
    }

    const payload = {
      success: true,
      ...response,
      totalQuestions: MAX_TOTAL_QUESTIONS,
      evaluations,
      questionHistory: updatedHistory,
      ...(reportData ? { reportData } : {}),
    };

    if (typeof body.interviewToken === "string" && body.interviewToken.trim() !== "") {
      const token = body.interviewToken.trim();
      const clientSession = {
        ...(body.clientSession ?? {}),
        sessionId,
        interviewToken: token,
        candidate: body.candidate ?? body.clientSession?.candidate,
        firstQuestion: body.clientSession?.firstQuestion ?? currentQuestion,
        currentQuestion: response.nextQuestion ?? currentQuestion,
        currentQuestionNumber: response.currentQuestionNumber,
        totalQuestions: MAX_TOTAL_QUESTIONS,
        sessionState: response.sessionState,
        evaluations,
        questionHistory: updatedHistory,
        questionLabel: response.evaluation.questionLabel,
      };

      if (response.status === "completed") {
        await interviewLinkService.markCompleted(
          token,
          reportData ?? buildInterviewReport({
            sessionId,
            status: response.status,
            totalQuestions: MAX_TOTAL_QUESTIONS,
            evaluations,
            questionHistory: updatedHistory,
            candidate: isCandidateSummary(body.candidate) ? body.candidate : undefined,
          }),
        );
      } else {
        await interviewLinkService.saveActiveSession(token, clientSession);
      }
    }

    console.log("[Answer API] Response", {
      sessionId: response.sessionId,
      status: response.status,
      currentQuestionNumber: response.currentQuestionNumber,
      hasNextQuestion: Boolean(response.nextQuestion),
    });

    return NextResponse.json(payload, { status: 200 });
  } catch (error) {
    console.error("Submit Answer API Error:", error);
    if (error instanceof Error && error.stack) {
      console.error("Submit Answer API Stack:", error.stack);
    }
    console.error("Submit Answer API Diagnostics:", getErrorDiagnostics(error));

    if (error instanceof Error && error.message === "Invalid request") {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request",
        },
        { status: 400 },
      );
    }

    if (error instanceof Error && error.message === "Session not found") {
      return NextResponse.json(
        {
          success: false,
          error: "Session not found",
        },
        { status: 404 },
      );
    }

    if (error instanceof Error && error.message === "Candidate not found") {
      return NextResponse.json(
        {
          success: false,
          error: "Candidate not found",
        },
        { status: 404 },
      );
    }

    const errorMessage = error instanceof Error ? error.message : "Failed to submit answer";

    return NextResponse.json(
      {
        success: false,
        error: "Unable to process your answer. Please try again.",
      },
      { status: getStatusCode(errorMessage) },
    );
  }
}

function normalizeStoredEvaluations(value: unknown): StoredEvaluation[] {
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

function isAdaptiveSessionState(value: unknown): value is {
  currentTopicIndex: number;
  followUpCountForCurrentTopic: number;
  totalQuestionsAsked: number;
  mainTopicsCompleted: number;
} {
  if (!value || typeof value !== "object") {
    return false;
  }

  const state = value as Record<string, unknown>;

  return typeof state.currentTopicIndex === "number" &&
    typeof state.followUpCountForCurrentTopic === "number" &&
    typeof state.totalQuestionsAsked === "number" &&
    typeof state.mainTopicsCompleted === "number";
}

function isInterviewQuestionRecord(value: unknown): value is InterviewQuestionRecord {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Partial<InterviewQuestionRecord>;

  return typeof record.questionId === "string" &&
    typeof record.askedAt === "string" &&
    (!record.question || isInterviewQuestion(record.question));
}

function isInterviewQuestion(value: unknown): value is InterviewQuestion {
  if (!value || typeof value !== "object") {
    return false;
  }

  const question = value as Partial<InterviewQuestion>;

  return typeof question.id === "string" &&
    typeof question.prompt === "string" &&
    Array.isArray(question.expectedConcepts);
}

function isCandidateSummary(value: unknown): value is { fullName: string; role: string } {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return typeof candidate.fullName === "string" && typeof candidate.role === "string";
}

function markQuestionAnswered(
  history: InterviewQuestionRecord[],
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
  const records = history.some((record) => record.questionId === question.id)
    ? [...history]
    : [...history, createQuestionRecord(question)];

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

function getStatusCode(message: string) {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes("missing api key")) {
    return 503;
  }

  if (lowerMessage.includes("authentication")) {
    return 401;
  }

  if (lowerMessage.includes("rate limit") || lowerMessage.includes("quota")) {
    return 429;
  }

  if (lowerMessage.includes("model not found")) {
    return 404;
  }

  if (lowerMessage.includes("invalid json") || lowerMessage.includes("invalid gemini response")) {
    return 502;
  }

  if (lowerMessage.includes("network error")) {
    return 503;
  }

  return 500;
}
