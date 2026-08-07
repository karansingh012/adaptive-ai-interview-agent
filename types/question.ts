export enum QuestionDifficulty {
  Easy = "easy",
  Medium = "medium",
  Hard = "hard",
}

export interface QuestionTopic {
  id: string;
  name: string;
  category?: string;
  description?: string;
}

export interface ExpectedConcept {
  id: string;
  name: string;
  description?: string;
}

export interface FollowUpSupport {
  enabled: boolean;
  maxFollowUps?: number;
  allowClarification?: boolean;
}

export interface InterviewQuestion {
  id: string;
  prompt: string;
  difficulty: QuestionDifficulty;
  topic: QuestionTopic;
  expectedConcepts: ExpectedConcept[];
  followUpSupport: FollowUpSupport;
  isAdaptive?: boolean;
  createdAt?: string;
}
