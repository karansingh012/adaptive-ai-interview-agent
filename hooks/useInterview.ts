import { useCallback, useMemo, useState } from "react";
import { startInterview, type StartInterviewResponse } from "@/services/interview.api";

export function useInterview() {
  const [isLoading, setIsLoading] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<unknown>(null);
  const [evaluation] = useState<unknown>(null);
  const [report] = useState<unknown>(null);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const start = useCallback(async (candidateId: string): Promise<StartInterviewResponse | null> => {
    console.log("Calling startInterview() in hook");
    setIsLoading(true);
    try {
      const response = await startInterview({ candidateId });
      console.log("API response:", response);
      setCurrentQuestion(response.firstQuestion);
      setProgress({ current: response.currentQuestionNumber, total: response.totalQuestions });
      console.log("Saving interview state");
      return response;
    } catch (error) {
      console.error("Interview hook start error:", error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return useMemo(
    () => ({
      isLoading,
      currentQuestion,
      evaluation,
      report,
      progress,
      start,
    }),
    [currentQuestion, evaluation, isLoading, progress, report, start],
  );
}
