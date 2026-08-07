import { NextRequest, NextResponse } from "next/server";
import { interviewService } from "@/lib/services/interview.service";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as {
      sessionId?: string;
      questionId?: string;
      answer?: string;
    } | null;

    if (
      !body ||
      typeof body.sessionId !== "string" ||
      body.sessionId.trim() === "" ||
      typeof body.questionId !== "string" ||
      body.questionId.trim() === "" ||
      typeof body.answer !== "string"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request",
        },
        { status: 400 },
      );
    }

    const response = await interviewService.submitAnswer(body.sessionId, body.questionId, body.answer);

    console.log("[Answer API] Response:", response);
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Submit Answer API Error:", error);

    if (error instanceof Error && error.message === "Invalid request") {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request",
        },
        { status: 400 },
      );
    }

    if (error instanceof Error && error.message === "Session not found") {
      return NextResponse.json(
        {
          success: false,
          error: "Session not found",
        },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to submit answer",
      },
      { status: 500 },
    );
  }
}
