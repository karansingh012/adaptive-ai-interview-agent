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
      summary?: string;
      feedback: string;
      strengths: string[];
      improvements: string[];
      missingConcepts?: string[];
      confidence: number;
      source?: "gemini" | "fallback";
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
  currentTopicIndex?: number;
  followUpCountForCurrentTopic?: number;
  mainTopicsCompleted?: number;
  maxTotalQuestions?: number;
}

export interface AdaptiveSessionState {
  currentTopicIndex: number;
  followUpCountForCurrentTopic: number;
  totalQuestionsAsked: number;
  mainTopicsCompleted: number;
}

export type InterviewLinkStatus = "sent" | "in_progress" | "completed";

export interface InterviewLinkRecord {
  token: string;
  candidateId: string;
  candidateName: string;
  status: InterviewLinkStatus;
  sessionId?: string;
  activeSession?: Record<string, unknown>;
  reportData?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
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
