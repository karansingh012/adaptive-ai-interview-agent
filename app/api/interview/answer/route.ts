import { NextRequest, NextResponse } from "next/server";
import { interviewService } from "@/lib/services/interview.service";
import { getErrorDiagnostics } from "@/lib/services/gemini.service";

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

    console.log("========== STEP 2 ==========");
    console.log("API request body", body);
    console.log("Received:", body.questionId);
    const response = await interviewService.submitAnswer(body.sessionId, body.questionId, body.answer);

    console.log("[Answer API] Response:", response);
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Submit Answer API Error:", error);
    if (error instanceof Error && error.stack) {
      console.error("Submit Answer API Stack:", error.stack);
    }
    console.error("Submit Answer API Diagnostics:", getErrorDiagnostics(error));

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

    const errorMessage = error instanceof Error ? error.message : "Failed to submit answer";

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        diagnostics: getErrorDiagnostics(error),
      },
      { status: getStatusCode(errorMessage) },
    );
  }
}

function getStatusCode(message: string) {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes("missing api key")) {
    return 500;
  }

  if (lowerMessage.includes("authentication")) {
    return 401;
  }

  if (lowerMessage.includes("rate limit") || lowerMessage.includes("quota")) {
    return 429;
  }

  if (lowerMessage.includes("model not found")) {
    return 404;
  }

  if (lowerMessage.includes("invalid json") || lowerMessage.includes("invalid gemini response")) {
    return 502;
  }

  if (lowerMessage.includes("network error")) {
    return 503;
  }

  return 500;
}
