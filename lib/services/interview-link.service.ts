import { readFile, writeFile } from "fs/promises";
import path from "path";
import type { InterviewLinkRecord, InterviewLinkStatus } from "@/types/interview";

type InterviewLinksFile = {
  links: InterviewLinkRecord[];
};

const DATA_FILE = path.join(process.cwd(), "data", "interview-links.json");

function generateToken(): string {
  return `interview-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

async function readLinksFile(): Promise<InterviewLinkRecord[]> {
  try {
    const raw = await readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw) as InterviewLinksFile;
    return Array.isArray(parsed.links) ? parsed.links : [];
  } catch {
    return [];
  }
}

async function writeLinksFile(links: InterviewLinkRecord[]): Promise<void> {
  await writeFile(DATA_FILE, JSON.stringify({ links }, null, 2), "utf8");
}

export class InterviewLinkService {
  async createLink(
    candidateId: string,
    candidateName: string,
    options?: {
      sessionId?: string;
      activeSession?: Record<string, unknown>;
    },
  ): Promise<InterviewLinkRecord> {
    const links = await readLinksFile();
    const now = new Date().toISOString();
    const link: InterviewLinkRecord = {
      token: generateToken(),
      candidateId,
      candidateName,
      status: "sent",
      sessionId: options?.sessionId,
      activeSession: options?.activeSession,
      createdAt: now,
      updatedAt: now,
    };

    links.push(link);
    await writeLinksFile(links);
    return link;
  }

  async getBySessionId(sessionId: string): Promise<InterviewLinkRecord | null> {
    const links = await readLinksFile();
    return links.find((link) => link.sessionId === sessionId) ?? null;
  }

  async getByToken(token: string): Promise<InterviewLinkRecord | null> {
    const links = await readLinksFile();
    return links.find((link) => link.token === token) ?? null;
  }

  async getLatestByCandidateId(candidateId: string): Promise<InterviewLinkRecord | null> {
    const links = await readLinksFile();
    const candidateLinks = links
      .filter((link) => link.candidateId === candidateId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return candidateLinks[0] ?? null;
  }

  async updateLink(
    token: string,
    updates: Partial<Pick<InterviewLinkRecord, "status" | "sessionId" | "activeSession" | "reportData" | "completedAt">>,
  ): Promise<InterviewLinkRecord | null> {
    const links = await readLinksFile();
    const index = links.findIndex((link) => link.token === token);

    if (index === -1) {
      return null;
    }

    const updated: InterviewLinkRecord = {
      ...links[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    links[index] = updated;
    await writeLinksFile(links);
    return updated;
  }

  async markInProgress(token: string, sessionId: string, activeSession: Record<string, unknown>): Promise<InterviewLinkRecord | null> {
    return this.updateLink(token, {
      status: "in_progress",
      sessionId,
      activeSession,
    });
  }

  async saveActiveSession(token: string, activeSession: Record<string, unknown>): Promise<InterviewLinkRecord | null> {
    return this.updateLink(token, { activeSession });
  }

  async markCompleted(token: string, reportData: Record<string, unknown>): Promise<InterviewLinkRecord | null> {
    return this.updateLink(token, {
      status: "completed",
      reportData,
      activeSession: undefined,
      completedAt: new Date().toISOString(),
    });
  }

  sanitizeForCandidate(link: InterviewLinkRecord) {
    return {
      token: link.token,
      candidateName: link.candidateName,
      status: link.status,
    };
  }

  sanitizeForRecruiter(link: InterviewLinkRecord) {
    return {
      token: link.token,
      sessionId: link.sessionId,
      candidateId: link.candidateId,
      candidateName: link.candidateName,
      status: link.status,
      createdAt: link.createdAt,
      completedAt: link.completedAt,
      hasReport: Boolean(link.reportData),
    };
  }

  getStatusLabel(status: InterviewLinkStatus): string {
    switch (status) {
      case "sent":
        return "Interview Sent";
      case "in_progress":
        return "In Progress";
      case "completed":
        return "Completed";
      default:
        return "Unknown";
    }
  }
}

export const interviewLinkService = new InterviewLinkService();
