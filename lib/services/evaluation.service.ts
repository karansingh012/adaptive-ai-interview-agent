import type { InterviewQuestion } from "@/types/question";
import { geminiService } from "./gemini.service";

export class EvaluationService {
  async evaluateAnswer(question: InterviewQuestion, answer: string) {
    const expectedConcepts = question.expectedConcepts.map((concept) => concept.name);
    const result = await geminiService.evaluateAnswer(question, answer, expectedConcepts);
    console.log("[EvaluationService] Gemini evaluation:", result);
    return result;
  }
}

export const evaluationService = new EvaluationService();
