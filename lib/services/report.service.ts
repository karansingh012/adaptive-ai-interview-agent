import type { InterviewQuestionRecord } from "@/types/interview";
import type { InterviewQuestion } from "@/types/question";
import type { EvaluationSource } from "./evaluation.service";

export type StoredEvaluation = {
  questionId: string;
  score: number;
  summary: string;
  feedback: string;
  strengths: string[];
  improvements: string[];
  missingConcepts: string[];
  confidence: number;
  source?: EvaluationSource;
};

export type TopicPerformance = {
  topic: string;
  questionsAsked: number;
  followUpsAsked: number;
  averageScore: number;
};

export type InterviewReportPayload = {
  sessionId?: string;
  status: string;
  totalQuestions: number;
  questionsAnswered: number;
  overallScore: number;
  averageConfidence: number;
  recommendation: string;
  recommendationTier: string;
  strengths: string[];
  improvements: string[];
  topicPerformance: TopicPerformance[];
  followUpCount: number;
  evaluations: StoredEvaluation[];
  questionHistory?: InterviewQuestionRecord[];
  candidate?: {
    fullName: string;
    role: string;
  };
  completedAt: string;
  evaluationSource: "mixed" | "gemini" | "fallback";
  fallbackCount: number;
};

export function buildInterviewReport(input: {
  sessionId?: string;
  status: string;
  totalQuestions: number;
  evaluations: StoredEvaluation[];
  questionHistory?: InterviewQuestionRecord[];
  candidate?: {
    fullName: string;
    role: string;
  };
}): InterviewReportPayload {
  const evaluations = normalizeEvaluations(input.evaluations ?? []);
  const questionHistory = input.questionHistory ?? [];
  const questionsAnswered = evaluations.length;

  const overallScore = questionsAnswered > 0
    ? Math.round((evaluations.reduce((sum, item) => sum + item.score, 0) / questionsAnswered) * 10) / 10
    : 0;

  const averageConfidence = questionsAnswered > 0
    ? Math.round((evaluations.reduce((sum, item) => sum + item.confidence, 0) / questionsAnswered) * 100) / 100
    : 0;

  const strengths = uniqueStrings(evaluations.flatMap((item) => item.strengths)).slice(0, 8);
  const improvements = uniqueStrings(evaluations.flatMap((item) => item.improvements)).slice(0, 8);
  const followUpCount = questionHistory.filter((record) => record.questionType === "follow_up").length;
  const topicPerformance = buildTopicPerformance(questionHistory, evaluations);
  const fallbackCount = evaluations.filter((item) => item.source === "fallback").length;
  const evaluationSource = resolveEvaluationSource(evaluations);
  const { recommendation, recommendationTier } = buildRecommendation(overallScore);

  return {
    sessionId: input.sessionId,
    status: input.status,
    totalQuestions: input.totalQuestions,
    questionsAnswered,
    overallScore,
    averageConfidence,
    recommendation,
    recommendationTier,
    strengths,
    improvements,
    topicPerformance,
    followUpCount,
    evaluations,
    questionHistory,
    candidate: input.candidate,
    completedAt: new Date().toISOString(),
    evaluationSource,
    fallbackCount,
  };
}

function normalizeEvaluations(evaluations: StoredEvaluation[]): StoredEvaluation[] {
  return evaluations.map((item) => {
    const summary = item.summary?.trim() || item.feedback?.trim() || "No evaluation summary available.";
    return {
      questionId: item.questionId,
      score: typeof item.score === "number" ? item.score : 0,
      summary,
      feedback: item.feedback?.trim() || summary,
      strengths: Array.isArray(item.strengths) ? item.strengths.filter(Boolean) : [],
      improvements: Array.isArray(item.improvements) ? item.improvements.filter(Boolean) : [],
      missingConcepts: Array.isArray(item.missingConcepts) ? item.missingConcepts.filter(Boolean) : [],
      confidence: typeof item.confidence === "number" ? item.confidence : 0,
      source: item.source,
    };
  });
}

function resolveEvaluationSource(evaluations: StoredEvaluation[]): "mixed" | "gemini" | "fallback" {
  if (evaluations.length === 0) {
    return "gemini";
  }

  const fallbackCount = evaluations.filter((item) => item.source === "fallback").length;

  if (fallbackCount === 0) {
    return "gemini";
  }
  if (fallbackCount === evaluations.length) {
    return "fallback";
  }
  return "mixed";
}

function buildTopicPerformance(
  questionHistory: InterviewQuestionRecord[],
  evaluations: StoredEvaluation[],
): TopicPerformance[] {
  const byTopic = new Map<string, { scores: number[]; followUps: number; questions: number }>();

  for (const record of questionHistory) {
    const topic = record.question?.topic?.name ?? "General";
    const entry = byTopic.get(topic) ?? { scores: [], followUps: 0, questions: 0 };
    entry.questions += 1;
    if (record.questionType === "follow_up") {
      entry.followUps += 1;
    }

    const evaluation = evaluations.find((item) => item.questionId === record.questionId);
    if (evaluation) {
      entry.scores.push(evaluation.score);
    }

    byTopic.set(topic, entry);
  }

  return [...byTopic.entries()].map(([topic, data]) => ({
    topic,
    questionsAsked: data.questions,
    followUpsAsked: data.followUps,
    averageScore: data.scores.length
      ? Math.round((data.scores.reduce((sum, score) => sum + score, 0) / data.scores.length) * 10) / 10
      : 0,
  }));
}

function buildRecommendation(score: number): { recommendation: string; recommendationTier: string } {
  if (score >= 8) {
    return {
      recommendationTier: "Strong candidate",
      recommendation: "Strong candidate — demonstrated solid technical understanding and communication across the interview.",
    };
  }
  if (score >= 6) {
    return {
      recommendationTier: "Recommended with improvement",
      recommendation: "Potential candidate — good fundamentals with identifiable gaps that warrant follow-up in a live round.",
    };
  }
  if (score >= 4) {
    return {
      recommendationTier: "Needs further evaluation",
      recommendation: "Needs further evaluation — core concepts require strengthening before a hiring decision.",
    };
  }
  return {
    recommendationTier: "Not ready",
    recommendation: "Not ready — significant gaps in understanding were observed during the interview.",
  };
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

export function getQuestionPrompt(
  record: InterviewQuestionRecord,
  index: number,
): string {
  return record.question?.prompt ?? `Question ${index + 1}`;
}

export function isFollowUpQuestion(record: InterviewQuestionRecord): boolean {
  return record.questionType === "follow_up" || record.question?.questionType === "follow_up";
}

export type { InterviewQuestion, InterviewQuestionRecord };
