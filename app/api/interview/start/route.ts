import { NextRequest, NextResponse } from "next/server";
import { interviewService } from "../../../../lib/services/interview.service";
import { interviewLinkService } from "@/lib/services/interview-link.service";

export async function POST(request: NextRequest) {
  try {
    let body: { candidateId?: string; token?: string } | null;

    try {
      body = (await request.json()) as { candidateId?: string; token?: string };
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid JSON request body",
        },
        { status: 400 },
      );
    }

    if (!body) {
      return NextResponse.json(
        { success: false, error: "Invalid request" },
        { status: 400 },
      );
    }

    if (typeof body.token === "string" && body.token.trim() !== "") {
      const token = body.token.trim();
      const link = await interviewLinkService.getByToken(token);

      if (!link) {
        return NextResponse.json(
          { success: false, error: "Invalid Interview Link" },
          { status: 404 },
        );
      }

      if (link.status === "completed") {
        return NextResponse.json(
          { success: false, error: "This interview has already been completed." },
          { status: 410 },
        );
      }

      if (link.status === "in_progress" && link.activeSession) {
        return NextResponse.json(
          {
            ...link.activeSession,
            interviewToken: token,
            mode: "candidate",
          },
          { status: 200 },
        );
      }

      const response = await interviewService.prepareInterviewSession(link.candidateId, link.sessionId);
      const sessionPayload = {
        ...response,
        candidate: {
          fullName: response.candidate.fullName,
          role: response.candidate.role,
        },
        interviewToken: token,
        mode: "candidate",
        evaluations: [],
        currentQuestion: response.firstQuestion,
        questionHistory: [],
      };

      await interviewLinkService.markInProgress(token, response.sessionId, sessionPayload);

      console.log("[Start Interview API] Response (token):", response);
      return NextResponse.json(sessionPayload, { status: 200 });
    }

    if (typeof body.candidateId !== "string" || body.candidateId.trim() === "") {
      return NextResponse.json(
        {
          success: false,
          error: "candidateId or token is required",
        },
        { status: 400 },
      );
    }

    const response = await interviewService.startInterview(body.candidateId);
    console.log("[Start Interview API] Response:", response);
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Start Interview API Error:", error);
    if (error instanceof Error && error.message === "Candidate not found") {
      return NextResponse.json(
        {
          success: false,
          error: "Candidate not found",
        },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to start interview",
      },
      { status: 500 },
    );
  }
}
