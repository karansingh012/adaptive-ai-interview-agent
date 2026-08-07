export interface InterviewSession {
  id: string;
  candidateId: string;
  startedAt: string;
  status: "pending" | "active" | "completed";
  currentQuestionIndex: number;
  responses: InterviewResponse[];
}

export interface InterviewResponse {
  questionId: string;
  answer: string;
  timestamp: string;
}
