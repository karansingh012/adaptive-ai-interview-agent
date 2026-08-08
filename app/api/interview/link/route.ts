import { NextRequest, NextResponse } from "next/server";
import { interviewLinkService } from "@/lib/services/interview-link.service";

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token");

    if (!token || token.trim() === "") {
      return NextResponse.json(
        { success: false, error: "Interview link is required." },
        { status: 400 },
      );
    }

    const link = await interviewLinkService.getByToken(token.trim());

    if (!link) {
      return NextResponse.json(
        { success: false, error: "Invalid Interview Link" },
        { status: 404 },
      );
    }

    if (link.status === "completed") {
      return NextResponse.json(
        {
          success: false,
          error: "This interview has already been completed.",
          link: interviewLinkService.sanitizeForRecruiter(link),
        },
        { status: 410 },
      );
    }

    return NextResponse.json({
      success: true,
      link: interviewLinkService.sanitizeForRecruiter(link),
      candidate: interviewLinkService.sanitizeForCandidate(link),
    });
  } catch (error) {
    console.error("[Interview Link API] Error:", error);
    return NextResponse.json(
      { success: false, error: "This interview link is no longer available." },
      { status: 500 },
    );
  }
}
