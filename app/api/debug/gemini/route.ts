import { NextResponse } from "next/server";
import { geminiService, getErrorDiagnostics } from "@/lib/services/gemini.service";

export async function GET() {
  try {
    const response = await geminiService.debugSayHello();

    return NextResponse.json(
      {
        success: true,
        model: response.model,
        rawResponse: response.rawResponse,
        text: response.text,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[Debug Gemini API] Error:", error);
    if (error instanceof Error && error.stack) {
      console.error("[Debug Gemini API] Stack:", error.stack);
    }

    const diagnostics = getErrorDiagnostics(error);
    return NextResponse.json(
      {
        success: false,
        rawResponse: diagnostics.originalSdkResponse ?? null,
        error: error instanceof Error ? error.message : "Unknown Gemini debug error",
        diagnostics,
      },
      { status: getDebugStatusCode(diagnostics) },
    );
  }
}

function getDebugStatusCode(diagnostics: ReturnType<typeof getErrorDiagnostics>) {
  if (typeof diagnostics.httpStatus === "number") {
    return diagnostics.httpStatus;
  }

  if (typeof diagnostics.googleErrorCode === "number") {
    return diagnostics.googleErrorCode;
  }

  return 500;
}
