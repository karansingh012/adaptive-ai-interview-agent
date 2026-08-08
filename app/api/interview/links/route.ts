import { NextRequest, NextResponse } from "next/server";
import { interviewLinkService } from "@/lib/services/interview-link.service";

export async function GET(request: NextRequest) {
  try {
    const candidateId = request.nextUrl.searchParams.get("candidateId");

    if (!candidateId || candidateId.trim() === "") {
      return NextResponse.json({ success: false, error: "candidateId is required" }, { status: 400 });
    }

    const link = await interviewLinkService.getLatestByCandidateId(candidateId.trim());

    if (!link) {
      return NextResponse.json({ success: true, link: null });
    }

    return NextResponse.json({
      success: true,
      link: interviewLinkService.sanitizeForRecruiter(link),
      statusLabel: interviewLinkService.getStatusLabel(link.status),
    });
  } catch (error) {
    console.error("[Interview Links API] Error:", error);
    return NextResponse.json({ success: false, error: "Failed to load interview links" }, { status: 500 });
  }
}
