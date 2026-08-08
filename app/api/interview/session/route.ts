import { NextRequest, NextResponse } from "next/server";
import { interviewLinkService } from "@/lib/services/interview-link.service";

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.nextUrl.searchParams.get("sessionId")?.trim();

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired interview link." },
        { status: 400 },
      );
    }

    const link = await interviewLinkService.getBySessionId(sessionId);

    if (!link) {
      return NextResponse.json(
        { success: false, error: "Candidate or session not found." },
        { status: 404 },
      );
    }

    if (link.status === "completed") {
      return NextResponse.json(
        { success: false, error: "Invalid or expired interview link." },
        { status: 410 },
      );
    }

    if (!link.activeSession) {
      return NextResponse.json(
        { success: false, error: "Candidate or session not found." },
        { status: 404 },
      );
    }

    if (link.status === "sent") {
      await interviewLinkService.markInProgress(link.token, sessionId, link.activeSession);
    }

    return NextResponse.json({
      success: true,
      ...link.activeSession,
      sessionId,
      interviewToken: link.token,
      mode: "candidate",
    });
  } catch (error) {
    console.error("[Interview Session API] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load interview session." },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as {
      sessionId?: string;
      session?: Record<string, unknown>;
      completed?: boolean;
      reportData?: Record<string, unknown>;
    } | null;

    if (!body || typeof body.sessionId !== "string" || body.sessionId.trim() === "") {
      return NextResponse.json(
        { success: false, error: "sessionId is required." },
        { status: 400 },
      );
    }

    const link = await interviewLinkService.getBySessionId(body.sessionId.trim());

    if (!link) {
      return NextResponse.json(
        { success: false, error: "Candidate or session not found." },
        { status: 404 },
      );
    }

    if (body.completed) {
      await interviewLinkService.markCompleted(
        link.token,
        body.reportData ?? body.session ?? {},
      );
    } else if (body.session) {
      await interviewLinkService.saveActiveSession(link.token, body.session);
    } else {
      return NextResponse.json(
        { success: false, error: "session payload is required." },
        { status: 400 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Interview Session API] Save error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to save interview session." },
      { status: 500 },
    );
  }
}
