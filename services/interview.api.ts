import type { InterviewQuestion } from "@/types/question";

export interface StartInterviewRequest {
  candidateId: string;
}

export interface StartInterviewResponse {
  sessionId: string;
  candidate: {
    id: string;
    fullName: string;
    role: string;
    experienceYears: number;
    completedCurriculumDays?: Array<{
      day: number;
      topic: string;
      status: string;
      completedAt?: string;
    }>;
    skillLevels?: Array<{
      area: string;
      level: string;
      confidence: number;
    }>;
  };
  firstQuestion: InterviewQuestion;
  currentQuestionNumber: number;
  totalQuestions: number;
}

export async function startInterview(input: StartInterviewRequest): Promise<StartInterviewResponse> {
  console.log("Posting to /api/interview/start", input);
  const response = await fetch("/api/interview/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  console.log("API response status:", response.status);

  if (!response.ok) {
    throw new Error("Failed to start interview");
  }

  const data = await response.json();
  console.log("API response JSON:", data);
  return data;
}
