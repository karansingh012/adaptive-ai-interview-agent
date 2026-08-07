import { NextRequest, NextResponse } from "next/server";
import { interviewService } from "../../../../lib/services/interview.service";

export async function POST(request: NextRequest) {
  try {
    let body: { candidateId?: string } | null;

    try {
      body = (await request.json()) as { candidateId?: string };
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid JSON request body",
        },
        { status: 400 },
      );
    }

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
