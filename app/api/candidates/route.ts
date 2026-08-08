import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "data", "candidates.json");
    const file = await readFile(filePath, "utf8");
    const data = JSON.parse(file);

    const candidates = data.candidates.map((candidate: any) => ({
      id: candidate.id,
      fullName: candidate.profile?.fullName ?? candidate.name,
      role: candidate.profile?.role ?? "Candidate",
    }));

    return NextResponse.json(candidates);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to load candidates" },
      { status: 500 }
    );
  }
}