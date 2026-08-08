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

    if (!link.reportData) {
      return NextResponse.json(
        { success: false, error: "Report not available yet." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      report: link.reportData,
      candidateName: link.candidateName,
    });
  } catch (error) {
    console.error("[Interview Report API] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load report" },
      { status: 500 },
    );
  }
}
