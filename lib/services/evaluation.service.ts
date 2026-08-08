import type { InterviewQuestion } from "@/types/question";
import type { GeminiEvaluation } from "./gemini.service";
import { geminiService } from "./gemini.service";

export type EvaluationSource = "gemini" | "fallback";

export type EvaluationResult = GeminiEvaluation & {
  source: EvaluationSource;
};

export class EvaluationService {
  async evaluateAnswer(question: InterviewQuestion, answer: string): Promise<EvaluationResult> {
    const expectedConcepts = question.expectedConcepts.map((concept) => concept.name);

    try {
      const result = await geminiService.evaluateAnswer(question, answer, expectedConcepts);
      return { ...result, source: "gemini" };
    } catch {
      return createLocalFallbackEvaluation(question, answer, expectedConcepts);
    }
  }
}

function matchConcepts(normalizedAnswer: string, expectedConcepts: string[]): {
  matched: string[];
  missing: string[];
} {
  const matched: string[] = [];
  const missing: string[] = [];

  for (const concept of expectedConcepts) {
    const normalizedConcept = concept.toLowerCase();
    const keywords = normalizedConcept.split(/[\s,/]+/).filter((word) => word.length > 2);
    const isMatched = keywords.length > 0
      ? keywords.some((keyword) => normalizedAnswer.includes(keyword))
      : normalizedAnswer.includes(normalizedConcept);

    if (isMatched) {
      matched.push(concept);
    } else {
      missing.push(concept);
    }
  }

  return { matched, missing };
}

export function createLocalFallbackEvaluation(
  question: InterviewQuestion,
  answer: string,
  expectedConcepts: string[] = question.expectedConcepts.map((concept) => concept.name),
): EvaluationResult {
  const trimmed = answer.trim();
  const normalizedAnswer = trimmed.toLowerCase();
  const topicName = question.topic?.name ?? "this topic";
  const { matched, missing } = matchConcepts(normalizedAnswer, expectedConcepts);

  if (!trimmed) {
    return {
      score: 0,
      summary: `No answer was provided for the question about ${topicName}.`,
      feedback: `No answer was provided for the question about ${topicName}.`,
      strengths: [],
      improvements: ["Provide a structured answer that addresses the question directly."],
      missingConcepts: expectedConcepts.slice(0, 4),
      confidence: 0.95,
      source: "fallback",
    };
  }

  if (trimmed.length < 20) {
    return {
      score: 2,
      summary: `The answer was too brief to demonstrate understanding of ${topicName}.`,
      feedback: `The answer was too brief to demonstrate understanding of ${topicName}.`,
      strengths: ["You attempted to respond to the question."],
      improvements: [
        "Expand your answer with concrete examples or steps.",
        `Cover key ideas related to ${topicName}.`,
      ],
      missingConcepts: missing.length > 0 ? missing.slice(0, 4) : expectedConcepts.slice(0, 2),
      confidence: 0.7,
      source: "fallback",
    };
  }

  const conceptCoverage = expectedConcepts.length > 0
    ? matched.length / expectedConcepts.length
    : trimmed.length >= 120 ? 0.6 : 0.35;

  const lengthBonus = Math.min(trimmed.length / 400, 0.25);
  const rawScore = 3 + conceptCoverage * 5 + lengthBonus * 4;
  const score = Math.round(Math.min(10, Math.max(0, rawScore)) * 10) / 10;

  const strengths: string[] = [];
  const improvements: string[] = [];

  if (trimmed.length >= 80) {
    strengths.push(`Provided a detailed response on ${topicName}.`);
  }
  if (matched.length > 0) {
    strengths.push(`Referenced relevant concepts: ${matched.slice(0, 3).join(", ")}.`);
  }
  if (missing.length > 0) {
    improvements.push(`Address missing concepts: ${missing.slice(0, 3).join(", ")}.`);
  }
  if (trimmed.length < 100) {
    improvements.push("Add more depth with examples, trade-offs, or implementation details.");
  }
  if (strengths.length === 0) {
    strengths.push("Attempted to address the question.");
  }
  if (improvements.length === 0) {
    improvements.push("Continue refining clarity and structure in your technical explanations.");
  }

  const summary = matched.length > 0
    ? `Fallback assessment: partial coverage of ${topicName} (${matched.length}/${expectedConcepts.length || "?"} expected concepts detected).`
    : `Fallback assessment: limited evidence of understanding for ${topicName} based on keyword and length analysis.`;

  return {
    score,
    summary,
    feedback: summary,
    strengths,
    improvements,
    missingConcepts: missing.slice(0, 5),
    confidence: 0.45,
    source: "fallback",
  };
}

export const evaluationService = new EvaluationService();
