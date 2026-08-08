import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { interviewLinkService } from "@/lib/services/interview-link.service";
import { interviewService } from "@/lib/services/interview.service";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as { candidateId?: string } | null;

    if (!body || typeof body.candidateId !== "string" || body.candidateId.trim() === "") {
      return NextResponse.json({ success: false, error: "candidateId is required" }, { status: 400 });
    }

    const candidateId = body.candidateId.trim();
    const candidateName = await resolveCandidateName(candidateId);

    if (!candidateName) {
      return NextResponse.json({ success: false, error: "Candidate not found" }, { status: 404 });
    }

    const sessionId = `session-${candidateId}-${Date.now()}`;
    const preparedSession = await interviewService.prepareInterviewSession(candidateId, sessionId);
    const sessionPayload = {
      sessionId: preparedSession.sessionId,
      candidate: {
        fullName: preparedSession.candidate.fullName,
        role: preparedSession.candidate.role,
      },
      firstQuestion: preparedSession.firstQuestion,
      currentQuestion: preparedSession.firstQuestion,
      currentQuestionNumber: preparedSession.currentQuestionNumber,
      totalQuestions: preparedSession.totalQuestions,
      sessionState: preparedSession.sessionState,
      evaluations: [],
      questionHistory: [],
      mode: "candidate",
    };

    const link = await interviewLinkService.createLink(candidateId, candidateName, {
      sessionId: preparedSession.sessionId,
      activeSession: sessionPayload,
    });
    const origin = request.nextUrl.origin;
    const interviewUrl = `${origin}/interview/session?token=${encodeURIComponent(link.token)}&sessionId=${encodeURIComponent(preparedSession.sessionId)}`;

    return NextResponse.json({
      success: true,
      token: link.token,
      sessionId: preparedSession.sessionId,
      interviewUrl,
      candidateName: link.candidateName,
      status: link.status,
      link: interviewLinkService.sanitizeForRecruiter(link),
    });
  } catch (error) {
    console.error("[Create Interview API] Error:", error);
    return NextResponse.json({ success: false, error: "Failed to create interview" }, { status: 500 });
  }
}

async function resolveCandidateName(candidateId: string): Promise<string | null> {
  try {
    const filePath = path.join(process.cwd(), "data", "candidates.json");
    const file = await readFile(filePath, "utf8");
    const data = JSON.parse(file) as {
      candidates: Array<{ id: string; name?: string; profile?: { fullName?: string } }>;
    };

    const candidate = data.candidates.find((item) => item.id === candidateId);
    if (!candidate) return null;

    return candidate.profile?.fullName ?? candidate.name ?? null;
  } catch {
    return null;
  }
}
