export const MAX_TOTAL_QUESTIONS = 8;
export const MAX_FOLLOW_UPS_PER_TOPIC = 2;

export const INTERVIEW_CONSTANTS = {
  maxQuestions: MAX_TOTAL_QUESTIONS,
  maxFollowUpsPerTopic: MAX_FOLLOW_UPS_PER_TOPIC,
  maxAnswerLength: 2000,
  defaultStatus: "pending",
} as const;
