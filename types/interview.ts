import type { InterviewQuestion } from "./question";

export enum InterviewSessionStatus {
  Pending = "pending",
  Active = "active",
  Completed = "completed",
  Paused = "paused",
}

export interface InterviewQuestionRecord {
    questionId: string;
    question?: InterviewQuestion;
    questionType?: "main" | "follow_up";
    parentQuestionId?: string;
    askedAt: string;
    response?: string;
    candidateAnswer?: string;
    followUpCount?: number;
    evaluatedScore?: number;
    evaluation?: {
      score: number;
      feedback: string;
      strengths: string[];
      improvements: string[];
      confidence: number;
    };
  }
export interface InterviewSessionMetadata {
  candidateName?: string;
  role?: string;
  startedFrom?: string;
  source?: string;
}

export interface InterviewState {
  status: InterviewSessionStatus;
  currentQuestionIndex: number;
  totalQuestionsAsked: number;
  isAdaptiveMode: boolean;
  lastUpdatedAt: string;
}

export interface InterviewSession {
  id: string;
  candidateId: string;
  currentQuestion?: InterviewQuestion;
  questionHistory: InterviewQuestionRecord[];
  state: InterviewState;
  metadata?: InterviewSessionMetadata;
  createdAt: string;
  updatedAt: string;
}
