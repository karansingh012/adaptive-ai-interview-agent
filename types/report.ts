export interface InterviewReport {
  id: string;
  candidateId: string;
  generatedAt: string;
  summary: string;
  strengths: string[];
  concerns: string[];
  score: number;
}
