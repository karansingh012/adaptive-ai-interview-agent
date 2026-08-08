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
import {
  InterviewSessionStatus,
  type AdaptiveSessionState,
  type InterviewQuestionRecord,
  type InterviewSession,
} from "../../types/interview";
import { MAX_FOLLOW_UPS_PER_TOPIC, MAX_TOTAL_QUESTIONS } from "@/utils/constants";
import {
  geminiService,
  type GeminiAdaptiveEvaluation,
  type GeminiEvaluation,
  type InterviewDecisionAction,
} from "./gemini.service";
import { createLocalFallbackEvaluation, type EvaluationSource } from "./evaluation.service";
import { questionGenerationService } from "./question-generation.service";

const MAX_FOLLOW_UPS_PER_MAIN_QUESTION = MAX_FOLLOW_UPS_PER_TOPIC;

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
  sessionState: AdaptiveSessionState;
};

export class InterviewService {
  async submitAnswer(
    sessionId: string,
    questionId: string,
    answer: string,
    currentQuestionInput?: InterviewQuestion,
    previousQuestions: InterviewQuestion[] = [],
    questionHistory: InterviewQuestionRecord[] = [],
    sessionStateInput?: AdaptiveSessionState,
  ): Promise<{
    sessionId: string;
    evaluation: {
      score: number;
      summary: string;
      feedback: string;
      strengths: string[];
      improvements: string[];
      missingConcepts: string[];
      confidence: number;
      source: EvaluationSource;
      followUp?: InterviewQuestion;
      isFinalQuestion: boolean;
      questionLabel?: string;
      decisionAction?: InterviewDecisionAction;
    };
    nextQuestion?: InterviewQuestion;
    currentQuestionNumber: number;
    totalQuestions: number;
    status: InterviewSessionStatus;
    sessionState: AdaptiveSessionState;
  }> {
    const candidate = await this.loadCandidate(this.getCandidateIdFromSession(sessionId));
    const curriculum = await this.loadCurriculum();
    const totalCurriculumTopics = curriculum.length;

    const sessionState = this.resolveSessionState(
      sessionStateInput,
      currentQuestionInput,
      questionHistory,
      curriculum,
    );

    const currentTopicIndex = Math.min(sessionState.currentTopicIndex, totalCurriculumTopics - 1);
    const currentDay = curriculum[currentTopicIndex];
    const currentQuestion = currentQuestionInput ??
      questionGenerationService.generateFallbackQuestion(candidate, currentDay, previousQuestions);
    const mainQuestion = this.findMainQuestion(currentQuestion, questionHistory);
    const answeredFollowUpCount = this.getAnsweredFollowUpCount(questionHistory, mainQuestion.id, currentQuestion);
    const allPreviousQuestions = this.collectPreviousQuestions(previousQuestions, questionHistory, currentQuestion);
    const remainingTopics = curriculum.slice(currentTopicIndex + 1);

    let adaptiveResult: GeminiAdaptiveEvaluation | null = null;
    let evaluation: GeminiEvaluation;
    let evaluationSource: EvaluationSource = "gemini";
    const expectedConcepts = currentQuestion.expectedConcepts.map((concept) => concept.name);

    try {
      adaptiveResult = await geminiService.evaluateAnswerAndDecide({
        candidate,
        currentQuestion,
        mainQuestion,
        candidateAnswer: answer,
        currentTopic: currentDay,
        currentTopicIndex,
        followUpCountForCurrentTopic: answeredFollowUpCount,
        maxFollowUpsPerTopic: MAX_FOLLOW_UPS_PER_MAIN_QUESTION,
        previousQuestions: allPreviousQuestions,
        questionHistory,
        remainingTopics,
        mainTopicsCompleted: sessionState.mainTopicsCompleted,
        totalCurriculumTopics,
      });
      evaluation = adaptiveResult;
    } catch (error) {
      console.error("[InterviewService] Adaptive evaluation failed; using local fallback.", error);
      const fallback = createLocalFallbackEvaluation(currentQuestion, answer, expectedConcepts);
      evaluation = fallback;
      evaluationSource = "fallback";
    }

    let decisionAction = adaptiveResult?.decision.action ?? this.fallbackDecisionAction(evaluation, answeredFollowUpCount);
    const decisionDifficulty = adaptiveResult?.decision.difficulty ?? "medium";
    const decisionPrompt = adaptiveResult?.decision.nextQuestion ?? "";

    if (this.isFollowUpAction(decisionAction) && answeredFollowUpCount >= MAX_FOLLOW_UPS_PER_MAIN_QUESTION) {
      console.log("[InterviewService] Follow-up limit reached; moving to next topic.");
      decisionAction = "next_topic";
    }

    const isCurrentMainQuestion = currentQuestion.questionType !== "follow_up";
    const mainQuestionsAnswered = sessionState.totalQuestionsAsked + (isCurrentMainQuestion ? 1 : 0);
    const shouldForceFinish = mainQuestionsAnswered >= MAX_TOTAL_QUESTIONS;

    if (shouldForceFinish) {
      decisionAction = "finish";
    }

    const evaluationPayload = {
      score: evaluation.score,
      summary: evaluation.summary,
      feedback: evaluation.feedback,
      strengths: evaluation.strengths,
      improvements: evaluation.improvements,
      missingConcepts: evaluation.missingConcepts,
      confidence: evaluation.confidence,
      source: evaluationSource,
    };

    if (decisionAction === "finish") {
      return {
        sessionId,
        evaluation: {
          ...evaluationPayload,
          isFinalQuestion: true,
          decisionAction,
        },
        currentQuestionNumber: mainQuestionsAnswered,
        totalQuestions: MAX_TOTAL_QUESTIONS,
        status: InterviewSessionStatus.Completed,
        sessionState: {
          ...sessionState,
          totalQuestionsAsked: mainQuestionsAnswered,
        },
      };
    }

    let nextQuestion: InterviewQuestion | undefined;
    let questionLabel: string | undefined;
    let updatedSessionState: AdaptiveSessionState = {
      ...sessionState,
      totalQuestionsAsked: mainQuestionsAnswered,
    };

    if (this.isFollowUpAction(decisionAction)) {
      const followUpNumber = answeredFollowUpCount + 1;
      const prompt = decisionPrompt || this.buildFollowUpFallbackPrompt(currentQuestion, evaluation);

      try {
        nextQuestion = questionGenerationService.buildAdaptiveQuestion({
          candidate,
          curriculumDay: currentDay,
          prompt,
          difficulty: decisionDifficulty,
          mainQuestion,
          currentQuestion,
          evaluation,
          followUpNumber,
          previousQuestions: allPreviousQuestions,
          questionType: "follow_up",
          action: decisionAction,
        });
      } catch (error) {
        console.error("[InterviewService] Adaptive follow-up build failed; using generation fallback.", error);
        nextQuestion = await questionGenerationService.generateFollowUpQuestion({
          candidate,
          curriculumDay: currentDay,
          mainQuestion,
          currentQuestion,
          candidateAnswer: answer,
          evaluation,
          previousRecords: questionHistory,
          followUpNumber,
        });
      }

      updatedSessionState = {
        ...updatedSessionState,
        currentTopicIndex,
        followUpCountForCurrentTopic: followUpNumber,
      };
      questionLabel = "Follow-up question";
    } else if (decisionAction === "next_topic") {
      const nextTopicIndex = currentTopicIndex + 1;

      if (nextTopicIndex >= totalCurriculumTopics) {
        return {
          sessionId,
          evaluation: {
            ...evaluationPayload,
            isFinalQuestion: true,
            decisionAction: "finish",
          },
          currentQuestionNumber: mainQuestionsAnswered,
          totalQuestions: MAX_TOTAL_QUESTIONS,
          status: InterviewSessionStatus.Completed,
          sessionState: {
            ...updatedSessionState,
            mainTopicsCompleted: totalCurriculumTopics,
          },
        };
      }

      const nextDay = curriculum[nextTopicIndex];
      const nextMainCompleted = sessionState.mainTopicsCompleted + 1;

      try {
        if (decisionPrompt) {
          nextQuestion = questionGenerationService.buildAdaptiveQuestion({
            candidate,
            curriculumDay: nextDay,
            prompt: decisionPrompt,
            difficulty: decisionDifficulty,
            mainQuestion,
            currentQuestion,
            evaluation,
            followUpNumber: 0,
            previousQuestions: allPreviousQuestions,
            questionType: "main",
            action: decisionAction,
          });
        } else {
          nextQuestion = await questionGenerationService.generateQuestion(candidate, nextDay, allPreviousQuestions);
        }
      } catch (error) {
        console.error("[InterviewService] Adaptive next-topic generation failed; using safe fallback.", error);
        nextQuestion = questionGenerationService.generateFallbackQuestion(candidate, nextDay, allPreviousQuestions);
      }

      updatedSessionState = {
        ...updatedSessionState,
        currentTopicIndex: nextTopicIndex,
        followUpCountForCurrentTopic: 0,
        mainTopicsCompleted: nextMainCompleted,
      };
      questionLabel = "Next topic";
    }

    const followUp = nextQuestion?.questionType === "follow_up" ? nextQuestion : undefined;

    return {
      sessionId,
      evaluation: {
        ...evaluationPayload,
        followUp,
        isFinalQuestion: false,
        questionLabel,
        decisionAction,
      },
      nextQuestion,
      currentQuestionNumber: nextQuestion?.questionType === "follow_up"
        ? Math.max(1, mainQuestionsAnswered)
        : mainQuestionsAnswered + 1,
      totalQuestions: MAX_TOTAL_QUESTIONS,
      status: InterviewSessionStatus.Active,
      sessionState: updatedSessionState,
    };
  }

  async prepareInterviewSession(
    candidateId: string,
    sessionId?: string,
  ): Promise<StartInterviewResult> {
    const normalizedCandidateId = this.normalizeCandidateId(candidateId);
    const candidate = await this.loadCandidate(normalizedCandidateId);
    const curriculum = await this.loadCurriculum();

    if (curriculum.length === 0) {
      throw new Error("Curriculum is empty");
    }

    const firstCurriculumDay = curriculum[0];
    const firstQuestion = questionGenerationService.generateFallbackQuestion(
      candidate,
      firstCurriculumDay,
      [],
    );
    const sessionState: AdaptiveSessionState = {
      currentTopicIndex: 0,
      followUpCountForCurrentTopic: 0,
      totalQuestionsAsked: 0,
      mainTopicsCompleted: 0,
    };

    const resolvedSessionId = sessionId ?? `session-${normalizedCandidateId}-${Date.now()}`;
    this.createSession(normalizedCandidateId, candidate, firstQuestion);

    return {
      sessionId: resolvedSessionId,
      candidate,
      firstQuestion,
      currentQuestionNumber: 1,
      totalQuestions: MAX_TOTAL_QUESTIONS,
      sessionState,
    };
  }

  async startInterview(candidateId: string): Promise<StartInterviewResult> {
    return this.prepareInterviewSession(candidateId);
  }

  private resolveSessionState(
    sessionStateInput: AdaptiveSessionState | undefined,
    currentQuestion: InterviewQuestion | undefined,
    questionHistory: InterviewQuestionRecord[],
    curriculum: CurriculumDay[],
  ): AdaptiveSessionState {
    if (sessionStateInput) {
      return sessionStateInput;
    }

    const topicIndex = this.inferTopicIndex(currentQuestion, curriculum);
    const mainQuestion = currentQuestion ? this.findMainQuestion(currentQuestion, questionHistory) : undefined;
    const followUpCount = mainQuestion
      ? this.getAnsweredFollowUpCount(questionHistory, mainQuestion.id, currentQuestion)
      : 0;
    const answeredCount = questionHistory.filter(
      (record) => record.questionType !== "follow_up" &&
        (record.evaluation || typeof record.evaluatedScore === "number"),
    ).length;
    const mainTopicsCompleted = questionHistory.filter(
      (record) => record.questionType === "main" && (record.evaluation || typeof record.evaluatedScore === "number"),
    ).length;

    return {
      currentTopicIndex: topicIndex,
      followUpCountForCurrentTopic: followUpCount,
      totalQuestionsAsked: answeredCount,
      mainTopicsCompleted,
    };
  }

  private inferTopicIndex(currentQuestion: InterviewQuestion | undefined, curriculum: CurriculumDay[]): number {
    if (!currentQuestion) {
      return 0;
    }

    const topicIdMatch = currentQuestion.topic?.id?.match(/topic-(\d+)/);
    if (topicIdMatch) {
      const dayNumber = parseInt(topicIdMatch[1], 10);
      const index = curriculum.findIndex((day) => day.day === dayNumber);
      if (index >= 0) {
        return index;
      }
    }

    const topicName = currentQuestion.topic?.name?.toLowerCase();
    if (topicName) {
      const index = curriculum.findIndex((day) => day.topic.toLowerCase() === topicName);
      if (index >= 0) {
        return index;
      }
    }

    return 0;
  }

  private collectPreviousQuestions(
    previousQuestions: InterviewQuestion[],
    questionHistory: InterviewQuestionRecord[],
    currentQuestion: InterviewQuestion,
  ): InterviewQuestion[] {
    const fromHistory = questionHistory
      .map((record) => record.question)
      .filter((question): question is InterviewQuestion => Boolean(question));

    const combined = [...fromHistory, ...previousQuestions, currentQuestion];
    const seen = new Set<string>();

    return combined.filter((question) => {
      if (seen.has(question.id)) {
        return false;
      }
      seen.add(question.id);
      return true;
    });
  }

  private isFollowUpAction(action: InterviewDecisionAction): boolean {
    return action === "follow_up" || action === "easier" || action === "harder";
  }

  private fallbackDecisionAction(
    evaluation: GeminiEvaluation,
    answeredFollowUpCount: number,
  ): InterviewDecisionAction {
    if (answeredFollowUpCount < MAX_FOLLOW_UPS_PER_MAIN_QUESTION &&
      (evaluation.score < 7 || evaluation.confidence < 0.55 || evaluation.improvements.length > 0)) {
      return evaluation.score >= 8 ? "harder" : "follow_up";
    }

    return "next_topic";
  }

  private buildFollowUpFallbackPrompt(currentQuestion: InterviewQuestion, evaluation: GeminiEvaluation): string {
    const improvement = evaluation.improvements[0];
    if (improvement) {
      return `Can you elaborate on ${improvement.toLowerCase()} in the context of ${currentQuestion.topic.name}?`;
    }

    return `Can you provide a more concrete example to support your answer about ${currentQuestion.topic.name}?`;
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
        currentTopicIndex: 0,
        followUpCountForCurrentTopic: 0,
        mainTopicsCompleted: 0,
        maxTotalQuestions: MAX_TOTAL_QUESTIONS,
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
    questionHistory: InterviewQuestionRecord[],
    mainQuestionId: string,
    currentQuestion?: InterviewQuestion,
  ): number {
    const previousAnsweredCount = questionHistory.filter((record) => (
      record.questionType === "follow_up" &&
      record.parentQuestionId === mainQuestionId &&
      (record.evaluation || typeof record.evaluatedScore === "number")
    )).length;

    if (currentQuestion?.questionType === "follow_up" && currentQuestion.parentQuestionId === mainQuestionId) {
      return Math.max(previousAnsweredCount, currentQuestion.followUpCount ?? previousAnsweredCount + 1);
    }

    return previousAnsweredCount;
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
