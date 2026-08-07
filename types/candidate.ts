export enum CurriculumDayStatus {
  Completed = "completed",
  InProgress = "in_progress",
  Skipped = "skipped",
}

export enum LearningSignalType {
  AnswerQuality = "answer_quality",
  ResponseTime = "response_time",
  TopicInterest = "topic_interest",
  Consistency = "consistency",
}

export enum SkillProficiencyLevel {
  Beginner = "beginner",
  Intermediate = "intermediate",
  Advanced = "advanced",
}

export interface CurriculumDayProgress {
  day: number;
  topic: string;
  status: CurriculumDayStatus;
  completedAt?: string;
}

export interface LearningSignal {
  type: LearningSignalType;
  value: number;
  observedAt: string;
  source?: string;
}

export interface SkillLevel {
  area: string;
  level: SkillProficiencyLevel;
  confidence: number;
  lastAssessedAt?: string;
}

export interface CandidateProfile {
  id: string;
  fullName: string;
  email?: string;
  role: string;
  experienceYears: number;
  completedCurriculumDays: CurriculumDayProgress[];
  skippedCurriculumDays: string[];
  learningSignals: LearningSignal[];
  skillLevels: SkillLevel[];
  createdAt?: string;
  updatedAt?: string;
}
