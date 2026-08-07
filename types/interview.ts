import type { InterviewQuestion } from "./question";

export enum InterviewSessionStatus {
  Pending = "pending",
  Active = "active",
  Completed = "completed",
  Paused = "paused",
}

export interface InterviewQuestionRecord {
  questionId: string;
  askedAt: string;
  response?: string;
  followUpCount?: number;
  evaluatedScore?: number;
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
