import type { InterviewQuestion } from "@/types/question";
import { geminiService } from "./gemini.service";

export class EvaluationService {
  async evaluateAnswer(question: InterviewQuestion, answer: string) {
    const expectedConcepts = question.expectedConcepts.map((concept) => concept.name);

    try {
      const result = await geminiService.evaluateAnswer(question, answer, expectedConcepts);
      console.log("[EvaluationService] Gemini evaluation:", result);
      return result;
    } catch (error) {
      console.error("[EvaluationService] Gemini failed, using mock fallback:", error);
      const fallback = this.mockFallback(question, answer);
      console.log("[EvaluationService] Mock evaluation:", fallback);
      return fallback;
    }
  }

  private mockFallback(question: InterviewQuestion, answer: string) {
    const trimmedAnswer = answer.trim();
    const answerLength = trimmedAnswer.length;

    if (answerLength === 0) {
      return {
        score: 0,
        feedback: "Empty answer.",
        strengths: [],
        improvements: ["Provide a clear response to the question."],
        confidence: 0.2,
      };
    }

    if (answerLength < 30) {
      return {
        score: 3,
        feedback: "Very short answer.",
        strengths: ["You attempted to answer the question."],
        improvements: ["Add more detail and concrete examples."],
        confidence: 0.4,
      };
    }

    if (answerLength < 120) {
      return {
        score: 6,
        feedback: "Medium-length answer with some useful detail.",
        strengths: ["You provided a relevant explanation."],
        improvements: ["Add a stronger example or connect the answer to the topic more clearly."],
        confidence: 0.7,
      };
    }

    if (answerLength < 220) {
      return {
        score: 8,
        feedback: "Detailed answer with clear reasoning.",
        strengths: ["You explained the topic clearly.", "Your answer includes useful detail."],
        improvements: ["Consider mentioning a practical example or tradeoff."],
        confidence: 0.85,
      };
    }

    return {
      score: 10,
      feedback: "Excellent answer with strong depth and clarity.",
      strengths: ["You explained the topic clearly.", "Your answer shows strong depth and structure."],
      improvements: ["Consider refining the response for brevity if needed."],
      confidence: 0.95,
    };
  }
}

export const evaluationService = new EvaluationService();
