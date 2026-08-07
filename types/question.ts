export interface InterviewQuestion {
  id: string;
  category: string;
  prompt: string;
  difficulty: "easy" | "medium" | "hard";
  expectedSkills: string[];
}
