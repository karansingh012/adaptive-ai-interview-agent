import { get, put } from "@vercel/blob";
import { readFile, writeFile } from "fs/promises";
import path from "path";
import type { InterviewLinkRecord, InterviewLinkStatus } from "@/types/interview";

type InterviewLinksFile = {
  links: InterviewLinkRecord[];
};

const LOCAL_DATA_FILE = path.join(process.cwd(), "data", "interview-links.json");
const BLOB_PATHNAME = "interview-data/interview-links.json";

function generateToken(): string {
  return `interview-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function shouldUseBlobStorage(): boolean {
  // Vercel's filesystem is read-only. Any Vercel deployment must use Blob
  // storage rather than the local JSON file, regardless of which Vercel
  // runtime environment variables are exposed to the function.
  if (process.env.VERCEL === "1" || process.env.VERCEL_ENV) {
    return true;
  }

  return Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);
}

async function readLocalLinksFile(): Promise<InterviewLinkRecord[]> {
  if (shouldUseBlobStorage()) {
    throw new Error("Local interview-link storage cannot be used on Vercel; configure Vercel Blob.");
  }
  try {
    const raw = await readFile(LOCAL_DATA_FILE, "utf8");
    const parsed = JSON.parse(raw) as InterviewLinksFile;
    return Array.isArray(parsed.links) ? parsed.links : [];
  } catch {
    return [];
  }
}

async function writeLocalLinksFile(links: InterviewLinkRecord[]): Promise<void> {
  if (shouldUseBlobStorage()) {
    throw new Error("Local interview-link storage cannot be used on Vercel; configure Vercel Blob.");
  }
  await writeFile(
    LOCAL_DATA_FILE,
    JSON.stringify({ links }, null, 2),
    "utf8",
  );
}

async function readLinksFile(): Promise<InterviewLinkRecord[]> {
  if (!shouldUseBlobStorage()) {
    return readLocalLinksFile();
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error(
      "Vercel Blob is required on Vercel, but BLOB_READ_WRITE_TOKEN is missing. Reconnect the Blob store to this project for Production and redeploy.",
    );
  }

  try {
    const result = await get(BLOB_PATHNAME, {
      access: "private",
      useCache: false,
    });

    if (!result) {
      return [];
    }

    const text = await new Response(result.stream).text();
    const parsed = JSON.parse(text) as InterviewLinksFile;

    return Array.isArray(parsed.links) ? parsed.links : [];
  } catch (error) {
    // A missing Blob object is normal on first use. Other errors should be
    // surfaced so production failures are not silently converted to empty data.
    const message = error instanceof Error ? error.message.toLowerCase() : "";
    const isMissingBlob =
      message.includes("not found") ||
      message.includes("does not exist") ||
      message.includes("404");

    if (isMissingBlob) {
      return [];
    }

    throw error;
  }
}

async function writeLinksFile(links: InterviewLinkRecord[]): Promise<void> {
  if (!shouldUseBlobStorage()) {
    await writeLocalLinksFile(links);
    return;
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error(
      "Vercel Blob is required on Vercel, but BLOB_READ_WRITE_TOKEN is missing. Reconnect the Blob store to this project for Production and redeploy.",
    );
  }

  await put(BLOB_PATHNAME, JSON.stringify({ links }, null, 2), {
    access: "private",
    allowOverwrite: true,
    contentType: "application/json",
  });
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
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

    return candidateLinks[0] ?? null;
  }

  async updateLink(
    token: string,
    updates: Partial<
      Pick<
        InterviewLinkRecord,
        "status" | "sessionId" | "activeSession" | "reportData" | "completedAt"
      >
    >,
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

  async markInProgress(
    token: string,
    sessionId: string,
    activeSession: Record<string, unknown>,
  ): Promise<InterviewLinkRecord | null> {
    return this.updateLink(token, {
      status: "in_progress",
      sessionId,
      activeSession,
    });
  }

  async saveActiveSession(
    token: string,
    activeSession: Record<string, unknown>,
  ): Promise<InterviewLinkRecord | null> {
    return this.updateLink(token, { activeSession });
  }

  async markCompleted(
    token: string,
    reportData: Record<string, unknown>,
  ): Promise<InterviewLinkRecord | null> {
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
    const activeSession =
      link.activeSession && typeof link.activeSession === "object"
        ? link.activeSession
        : {};
  
    const reportData =
      link.reportData && typeof link.reportData === "object"
        ? link.reportData
        : {};
  
    const currentQuestionNumber = Number(
      reportData.currentQuestionNumber ??
        activeSession.currentQuestionNumber ??
        0,
    );
  
    const totalQuestions = Number(
      reportData.totalQuestions ??
        activeSession.totalQuestions ??
        8,
    );
  
    return {
      token: link.token,
      sessionId: link.sessionId,
      candidateId: link.candidateId,
      candidateName: link.candidateName,
      status: link.status,
      createdAt: link.createdAt,
      completedAt: link.completedAt,
      hasReport: Boolean(link.reportData),
      currentQuestionNumber,
      totalQuestions,
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
