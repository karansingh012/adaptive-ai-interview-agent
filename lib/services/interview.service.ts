import { readFile } from "fs/promises";
import path from "path";
import {
  CurriculumDayStatus,
  LearningSignalType,
  SkillProficiencyLevel,
  type CandidateProfile,
} from "../../types/candidate";
import type { InterviewQuestion } from "../../types/question";
import { QuestionDifficulty } from "../../types/question";
import { InterviewSessionStatus, type InterviewSession } from "../../types/interview";

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

type CurriculumDay = {
  day: number;
  topic: string;
  learningObjectives: string[];
  toolsUsed: string[];
  difficulty: string;
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
  async startInterview(candidateId: string): Promise<StartInterviewResult> {
    const normalizedCandidateId = this.normalizeCandidateId(candidateId);
    const candidate = await this.loadCandidate(normalizedCandidateId);
    const curriculum = await this.loadCurriculum();

    if (curriculum.length === 0) {
      throw new Error("Curriculum is empty");
    }

    const firstCurriculumDay = curriculum[0];
    const firstQuestion = this.buildFirstQuestion(firstCurriculumDay);

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

  private buildFirstQuestion(curriculumDay: CurriculumDay): InterviewQuestion {
    return {
      id: `question-${curriculumDay.day}`,
      prompt: `Explain ${curriculumDay.topic}.`,
      difficulty: this.mapDifficulty(curriculumDay.difficulty),
      topic: {
        id: `topic-${curriculumDay.day}`,
        name: curriculumDay.topic,
        category: "ai-engineering",
        description: curriculumDay.learningObjectives[0],
      },
      expectedConcepts: curriculumDay.learningObjectives.map((objective, index) => ({
        id: `concept-${curriculumDay.day}-${index + 1}`,
        name: objective,
      })),
      followUpSupport: {
        enabled: true,
        maxFollowUps: 2,
        allowClarification: true,
      },
      isAdaptive: true,
      createdAt: new Date().toISOString(),
    };
  }

  private createSession(
    candidateId: string,
    candidate: CandidateProfile,
    firstQuestion: InterviewQuestion,
  ): InterviewSession {
    const now = new Date().toISOString();

    return {
      id: `session-${Date.now()}`,
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

  private mapDifficulty(difficulty: string): QuestionDifficulty {
    switch (difficulty.toLowerCase()) {
      case "advanced":
        return QuestionDifficulty.Hard;
      case "intermediate":
        return QuestionDifficulty.Medium;
      default:
        return QuestionDifficulty.Easy;
    }
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
      skillLevels: (profile?.skillLevels ?? []).map((skill) => ({
        area: skill.area,
        level: this.mapSkillLevel(skill.level),
        confidence: skill.confidence,
        lastAssessedAt: skill.lastAssessedAt,
      })),
      createdAt: profile?.createdAt,
      updatedAt: profile?.updatedAt,
    };
  }
}

export const interviewService = new InterviewService();
