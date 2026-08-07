export interface CategoryScore {
  category: string;
  score: number;
  maxScore: number;
}

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  priority?: "low" | "medium" | "high";
}

export interface InterviewReport {
  id: string;
  candidateId: string;
  interviewSessionId: string;
  overallScore: number;
  categoryScores: CategoryScore[];
  strengths: string[];
  weakTopics: string[];
  recommendations: Recommendation[];
  finalFeedback: string;
  generatedAt: string;
}
