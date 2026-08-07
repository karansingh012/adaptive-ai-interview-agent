import { NextRequest, NextResponse } from "next/server";
import { interviewService } from "../../../../lib/services/interview.service";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as { candidateId?: string } | null;

    if (!body || typeof body.candidateId !== "string" || body.candidateId.trim() === "") {
      return NextResponse.json(
        {
          success: false,
          error: "candidateId is required",
        },
        { status: 400 },
      );
    }

    const response = await interviewService.startInterview(body.candidateId);

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
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
