import type { InterviewQuestion } from "../../types/question";

export interface EvaluationResult {
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  confidence: number;
}

export class FollowUpService {
  generateNextStep(question: InterviewQuestion, answer: string, evaluation: EvaluationResult) {
    const trimmedAnswer = answer.trim();
    const hasExpectedConcepts = question.expectedConcepts.length > 0;

    if (evaluation.score <= 4 || trimmedAnswer.length < 25 || !hasExpectedConcepts) {
      return {
        shouldAskFollowUp: true,
        followUpQuestion: this.buildFollowUpQuestion(question),
        reason: "The answer was weak or incomplete, so a clarifying follow-up is appropriate.",
      };
    }

    return {
      shouldAskFollowUp: false,
      followUpQuestion: null,
      reason: "The answer was strong enough to proceed to the next curriculum question.",
    };
  }

  private buildFollowUpQuestion(question: InterviewQuestion): InterviewQuestion {
    const followUpPrompt = this.getFollowUpPrompt(question.topic.name);

    return {
      id: `${question.id}-followup`,
      prompt: followUpPrompt,
      difficulty: question.difficulty,
      topic: {
        ...question.topic,
        id: `${question.topic.id}-followup`,
      },
      expectedConcepts: question.expectedConcepts,
      followUpSupport: {
        enabled: true,
        maxFollowUps: 1,
        allowClarification: true,
      },
      isAdaptive: true,
      createdAt: new Date().toISOString(),
    };
  }

  private getFollowUpPrompt(topic: string): string {
    const normalizedTopic = topic.toLowerCase();

    if (normalizedTopic.includes("rag")) {
      return "Can you explain why RAG improves LLM responses?";
    }

    if (normalizedTopic.includes("embedding")) {
      return "How are embeddings used in similarity search?";
    }

    if (normalizedTopic.includes("vector")) {
      return "How does vector similarity influence retrieval quality?";
    }

    if (normalizedTopic.includes("agent")) {
      return "How do agents decide which tool to use next?";
    }

    return "Can you provide a concrete example to support your answer?";
  }
}

export const followUpService = new FollowUpService();
