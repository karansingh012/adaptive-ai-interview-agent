import { readFile } from "fs/promises";
import path from "path";
import {
  CurriculumDayStatus,
  LearningSignalType,
  SkillProficiencyLevel,
  type CandidateProfile,
} from "../../types/candidate";
import type { CurriculumDay } from "../../types/curriculum";
import type { InterviewQuestion } from "../../types/question";
import { InterviewSessionStatus, type InterviewQuestionRecord, type InterviewSession } from "../../types/interview";
import { geminiService } from "./gemini.service";
import { questionGenerationService } from "./question-generation.service";

const MAX_FOLLOW_UPS_PER_MAIN_QUESTION = 2;

type CandidateRecord = {
  id: string;
  name?: string;
  email?: string;
  completedCurriculumDays?: Array<{
    day: number;
    topic: string;
    status: string;
    completedAt?: string;
  }>;
  skippedCurriculumDays?: string[];
  learningSignals?: Array<{
    type: string;
    value: number;
    observedAt: string;
    source?: string;
  }>;
  profile?: {
    id?: string;
    fullName?: string;
    email?: string;
    role?: string;
    experienceYears?: number;
    completedCurriculumDays?: Array<{
      day: number;
      topic: string;
      status: string;
      completedAt?: string;
    }>;
    skippedCurriculumDays?: string[];
    learningSignals?: Array<{
      type: string;
      value: number;
      observedAt: string;
      source?: string;
    }>;
    skillLevels?: Array<{
      area: string;
      level: string;
      confidence: number;
      lastAssessedAt?: string;
    }>;
    createdAt?: string;
    updatedAt?: string;
  };
  skills?: Array<{
    area: string;
    level: string;
    confidence: number;
  }>;
};

type CandidateDataFile = {
  candidates: CandidateRecord[];
};

type CurriculumDataFile = {
  curriculum: CurriculumDay[];
};

type StartInterviewResult = {
  sessionId: string;
  candidate: CandidateProfile;
  firstQuestion: InterviewQuestion;
  currentQuestionNumber: number;
  totalQuestions: number;
};

export class InterviewService {
  /**
   * Submit an answer to an interview question and get the next question or follow-up.
   * @param sessionId - The interview session ID
   * @param answer - The candidate's answer to the current question
   * @returns The updated session state, next question (if any), and evaluation results
   */
  async submitAnswer(
    sessionId: string,
    questionId: string,
    answer: string,
    currentQuestionInput?: InterviewQuestion,
    previousQuestions: InterviewQuestion[] = [],
    questionHistory: InterviewQuestionRecord[] = [],
  ): Promise<{
    sessionId: string;
    evaluation: {
      score: number;
      feedback: string;
      strengths: string[];
      improvements: string[];
      confidence: number;
      followUp?: InterviewQuestion;
      isFinalQuestion: boolean;
    };
    nextQuestion?: InterviewQuestion;
    currentQuestionNumber: number;
    totalQuestions: number;
    status: InterviewSessionStatus;
  }> {
    const candidate = await this.loadCandidate(this.getCandidateIdFromSession(sessionId));
    const curriculum = await this.loadCurriculum();
    const totalQuestions = curriculum.length;

    // Determine the current question index from the submitted question id.
    const match = questionId.match(/question-(\d+)/);
    const answeredQuestionIndex = match ? parseInt(match[1], 10) - 1 : 0;
    const nextQuestionIndex = answeredQuestionIndex + 1;
    const currentMainQuestionNumber = answeredQuestionIndex + 1;
    const currentDay = curriculum[answeredQuestionIndex];
    const currentQuestion = currentQuestionInput ??
      questionGenerationService.generateFallbackQuestion(candidate, currentDay, previousQuestions);
    const expectedConcepts = currentQuestion.expectedConcepts.map((concept) => concept.name);
    const mainQuestion = this.findMainQuestion(currentQuestion, questionHistory);
    const answeredFollowUpCount = this.getAnsweredFollowUpCount(currentQuestion, questionHistory, mainQuestion.id);

    console.log("========== STEP 3 ==========");
    console.log("Current question", currentQuestion);
    console.log("========== STEP 4 ==========");
    console.log("Answer", answer);
    console.log("========== STEP 5 ==========");
    console.log("Expected concepts", expectedConcepts);

    const evaluation = await geminiService.evaluateAnswer(
      currentQuestion,
      answer,
      expectedConcepts,
    );

    let followUp: InterviewQuestion | undefined = undefined;
    const shouldTryFollowUp =
      this.shouldAskFollowUp(evaluation) &&
      answeredFollowUpCount < MAX_FOLLOW_UPS_PER_MAIN_QUESTION &&
      currentQuestion.followUpSupport.enabled;

    let nextQuestion: InterviewQuestion | undefined = undefined;
    let isFinalQuestion = nextQuestionIndex >= totalQuestions;

    if (shouldTryFollowUp) {
      try {
        followUp = await questionGenerationService.generateFollowUpQuestion({
          candidate,
          curriculumDay: currentDay,
          mainQuestion,
          currentQuestion,
          candidateAnswer: answer,
          evaluation,
          previousRecords: questionHistory,
          followUpNumber: answeredFollowUpCount + 1,
        });
        nextQuestion = followUp;
        isFinalQuestion = false;
      } catch (error) {
        console.error("[InterviewService] Follow-up generation failed; continuing to next main question.", error);
      }
    }

    if (!nextQuestion && !isFinalQuestion) {
      const nextDay = curriculum[nextQuestionIndex];
      nextQuestion = await questionGenerationService.generateQuestion(candidate, nextDay, [
        ...previousQuestions,
        currentQuestion,
      ]);
    }

    console.log("Returning:", nextQuestion?.id);

    return {
      sessionId,
      evaluation: {
        score: evaluation.score,
        feedback: evaluation.feedback,
        strengths: evaluation.strengths,
        improvements: evaluation.improvements,
        confidence: evaluation.confidence,
        followUp,
        isFinalQuestion,
      },
      nextQuestion,
      currentQuestionNumber: followUp
        ? currentMainQuestionNumber
        : Math.min(nextQuestionIndex + 1, totalQuestions),
      totalQuestions,
      status: isFinalQuestion && !nextQuestion ? InterviewSessionStatus.Completed : InterviewSessionStatus.Active,
    };
  }
  async startInterview(candidateId: string): Promise<StartInterviewResult> {
    const normalizedCandidateId = this.normalizeCandidateId(candidateId);
    const candidate = await this.loadCandidate(normalizedCandidateId);
    const curriculum = await this.loadCurriculum();

    if (curriculum.length === 0) {
      throw new Error("Curriculum is empty");
    }

    const firstCurriculumDay = curriculum[0];
    const firstQuestion = await questionGenerationService.generateQuestion(candidate, firstCurriculumDay, []);

    const session = this.createSession(normalizedCandidateId, candidate, firstQuestion);

    return {
      sessionId: session.id,
      candidate,
      firstQuestion,
      currentQuestionNumber: 1,
      totalQuestions: curriculum.length,
    };
  }


  private normalizeCandidateId(candidateId: string): string {
    const trimmedCandidateId = candidateId.trim();

    if (trimmedCandidateId.startsWith("candidate-")) {
      return trimmedCandidateId.replace("candidate-", "cand-");
    }

    return trimmedCandidateId;
  }

  private async loadCandidate(candidateId: string): Promise<CandidateProfile> {
    try {
      const dataPath = path.join(process.cwd(), "data", "candidates.json");
      const rawData = await readFile(dataPath, "utf8");
      const parsedData = JSON.parse(rawData) as CandidateDataFile;

      const candidateRecord = parsedData.candidates.find((item) => item.id === candidateId);

      if (!candidateRecord) {
        throw new Error("Candidate not found");
      }

      return this.normalizeCandidate(candidateRecord);
    } catch (error) {
      if (error instanceof Error && error.message === "Candidate not found") {
        throw error;
      }

      throw new Error("Unable to load candidate data");
    }
  }

  private async loadCurriculum(): Promise<CurriculumDay[]> {
    try {
      const dataPath = path.join(process.cwd(), "data", "curriculum.json");
      const rawData = await readFile(dataPath, "utf8");
      const parsedData = JSON.parse(rawData) as CurriculumDataFile;

      return parsedData.curriculum;
    } catch {
      throw new Error("Unable to load curriculum data");
    }
  }

  private createSession(
    candidateId: string,
    candidate: CandidateProfile,
    firstQuestion: InterviewQuestion,
  ): InterviewSession {
    const now = new Date().toISOString();

    return {
      id: `session-${candidateId}-${Date.now()}`,
      candidateId,
      currentQuestion: firstQuestion,
      questionHistory: [],
      state: {
        status: InterviewSessionStatus.Active,
        currentQuestionIndex: 0,
        totalQuestionsAsked: 0,
        isAdaptiveMode: true,
        lastUpdatedAt: now,
      },
      metadata: {
        candidateName: candidate.fullName,
        role: candidate.role,
        startedFrom: "interview_start",
        source: "mock_initializer",
      },
      createdAt: now,
      updatedAt: now,
    };
  }

  private getCandidateIdFromSession(sessionId: string): string {
    const match = sessionId.match(/^session-(cand-[^-]+)-/);

    if (!match) {
      throw new Error("Session not found");
    }

    return match[1];
  }

  private shouldAskFollowUp(evaluation: {
    score: number;
    improvements: string[];
    confidence: number;
  }): boolean {
    return evaluation.score < 7 ||
      evaluation.confidence < 0.55 ||
      (evaluation.score < 8 && evaluation.improvements.length > 0);
  }

  private findMainQuestion(
    currentQuestion: InterviewQuestion,
    questionHistory: InterviewQuestionRecord[],
  ): InterviewQuestion {
    if (currentQuestion.questionType !== "follow_up" || !currentQuestion.parentQuestionId) {
      return currentQuestion;
    }

    const parentRecord = questionHistory.find((record) => record.questionId === currentQuestion.parentQuestionId);

    return parentRecord?.question ?? currentQuestion;
  }

  private getAnsweredFollowUpCount(
    currentQuestion: InterviewQuestion,
    questionHistory: InterviewQuestionRecord[],
    mainQuestionId: string,
  ): number {
    const previousFollowUpCount = questionHistory.filter((record) => (
      record.questionType === "follow_up" && record.parentQuestionId === mainQuestionId
    )).length;

    if (currentQuestion.questionType === "follow_up") {
      return Math.max(previousFollowUpCount, currentQuestion.followUpCount ?? 1);
    }

    return previousFollowUpCount;
  }

  private mapCurriculumStatus(status: string): CurriculumDayStatus {
    switch (status.toLowerCase()) {
      case "in_progress":
        return CurriculumDayStatus.InProgress;
      case "skipped":
        return CurriculumDayStatus.Skipped;
      default:
        return CurriculumDayStatus.Completed;
    }
  }

  private mapLearningSignalType(signalType: string): LearningSignalType {
    switch (signalType.toLowerCase()) {
      case "response_time":
        return LearningSignalType.ResponseTime;
      case "topic_interest":
        return LearningSignalType.TopicInterest;
      case "consistency":
        return LearningSignalType.Consistency;
      default:
        return LearningSignalType.AnswerQuality;
    }
  }

  private mapSkillLevel(level: string): SkillProficiencyLevel {
    switch (level.toLowerCase()) {
      case "advanced":
        return SkillProficiencyLevel.Advanced;
      case "intermediate":
        return SkillProficiencyLevel.Intermediate;
      default:
        return SkillProficiencyLevel.Beginner;
    }
  }

  private normalizeCandidate(candidateRecord: CandidateRecord): CandidateProfile {
    const profile = candidateRecord.profile;

    return {
      id: candidateRecord.id,
      fullName: profile?.fullName ?? candidateRecord.name ?? "Unknown Candidate",
      email: profile?.email ?? candidateRecord.email,
      role: profile?.role ?? "Unknown Role",
      experienceYears: profile?.experienceYears ?? 0,
      completedCurriculumDays: (profile?.completedCurriculumDays ?? candidateRecord.completedCurriculumDays ?? []).map((day) => ({
        day: day.day,
        topic: day.topic,
        status: this.mapCurriculumStatus(day.status),
        completedAt: day.completedAt,
      })),
      skippedCurriculumDays: profile?.skippedCurriculumDays ?? candidateRecord.skippedCurriculumDays ?? [],
      learningSignals: (profile?.learningSignals ?? candidateRecord.learningSignals ?? []).map((signal) => ({
        type: this.mapLearningSignalType(signal.type),
        value: signal.value,
        observedAt: signal.observedAt,
        source: signal.source,
      })),
      skillLevels: [
        ...(profile?.skillLevels ?? []),
        ...(candidateRecord.skills ?? []),
      ].filter((skill, index, skills) => (
        skills.findIndex((item) => item.area.toLowerCase() === skill.area.toLowerCase()) === index
      )).map((skill) => ({
        area: skill.area,
        level: this.mapSkillLevel(skill.level),
        confidence: skill.confidence,
        lastAssessedAt: "lastAssessedAt" in skill && typeof skill.lastAssessedAt === "string"
          ? skill.lastAssessedAt
          : undefined,
      })),
      createdAt: profile?.createdAt,
      updatedAt: profile?.updatedAt,
    };
  }
}

export const interviewService = new InterviewService();
