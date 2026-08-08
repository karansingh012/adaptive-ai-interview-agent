"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  BrainCircuit,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  LayoutDashboard,
  Sparkles,
  Users,
} from "lucide-react";
import { toast } from "@/lib/toast";
import candidatesData from "@/data/candidates.json";
import curriculumData from "@/data/curriculum.json";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/Container";
import { Loader } from "@/components/common/Loader";
import { EmptyState } from "@/components/common/EmptyState";
import { ProgressBar } from "@/components/interview/ProgressBar";

type InterviewLinkInfo = {
  token: string;
  candidateId: string;
  candidateName: string;
  status: "sent" | "in_progress" | "completed";
  createdAt: string;
  completedAt?: string;
  hasReport: boolean;
};

type CreatedInterview = {
  token: string;
  interviewUrl: string;
  candidateName: string;
};

const TOTAL_CURRICULUM_DAYS = curriculumData.curriculum.length;

const emptySubscribe = () => () => {};

const getClientSnapshot = () => true;

const getServerSnapshot = () => false;

type RawCandidate = (typeof candidatesData.candidates)[number];

type DashboardCandidate = {
  id: string;
  fullName: string;
  role: string;
  experienceYears: number;
  completedDays: number;
  progressPercent: number;
  skills: { area: string; level: string; confidence: number }[];
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatLevel(level: string) {
  return level.charAt(0).toUpperCase() + level.slice(1);
}

function formatConfidence(confidence: number) {
  return `${Math.round(confidence * 100)}%`;
}

function getRecommendedDifficulty(skills: { level: string }[]): "Easy" | "Medium" | "Hard" {
  if (skills.length === 0) return "Medium";

  const counts = { beginner: 0, intermediate: 0, advanced: 0 };
  for (const skill of skills) {
    if (skill.level in counts) {
      counts[skill.level as keyof typeof counts]++;
    }
  }

  const max = Math.max(counts.beginner, counts.intermediate, counts.advanced);
  const dominant = Object.entries(counts)
    .filter(([, count]) => count === max)
    .map(([level]) => level);

  if (dominant.length > 1) return "Medium";
  if (dominant[0] === "beginner") return "Easy";
  if (dominant[0] === "intermediate") return "Medium";
  return "Hard";
}

function mapCandidate(candidate: RawCandidate): DashboardCandidate {
  const completedDays = candidate.completedCurriculumDays?.length ?? 0;
  const progressPercent = Math.round((completedDays / TOTAL_CURRICULUM_DAYS) * 100);

  return {
    id: candidate.id,
    fullName: candidate.profile?.fullName ?? candidate.name,
    role: candidate.profile?.role ?? "Candidate",
    experienceYears: candidate.profile?.experienceYears ?? 0,
    completedDays,
    progressPercent,
    skills: candidate.skills ?? [],
  };
}

function levelStyles(level: string) {
  switch (level) {
    case "advanced":
      return "bg-indigo-500/15 text-indigo-300 border-indigo-500/25";
    case "intermediate":
      return "bg-violet-500/15 text-violet-300 border-violet-500/25";
    default:
      return "bg-zinc-500/15 text-zinc-400 border-zinc-500/25";
  }
}

export default function DashboardPage() {
  const [selectedCandidate, setSelectedCandidate] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createdInterview, setCreatedInterview] = useState<CreatedInterview | null>(null);
  const [interviewLink, setInterviewLink] = useState<InterviewLinkInfo | null>(null);

  const candidates = useMemo(
    () => candidatesData.candidates.map(mapCandidate),
    [],
  );

  const isHydrated = useSyncExternalStore(
    emptySubscribe,
    getClientSnapshot,
    getServerSnapshot,
  );

  const effectiveSelectedCandidate =
    candidates.some((candidate) => candidate.id === selectedCandidate)
      ? selectedCandidate
      : candidates[0]?.id ?? "";

  const selected = candidates.find((c) => c.id === effectiveSelectedCandidate) ?? null;

  const stats = useMemo(() => {
    if (candidates.length === 0) {
      return { total: 0, avgProgress: 0, interviewCandidates: 0, avgExperience: 0 };
    }

    const avgProgress = Math.round(
      candidates.reduce((sum, c) => sum + c.progressPercent, 0) / candidates.length,
    );
    const avgExperience =
      Math.round(
        (candidates.reduce((sum, c) => sum + c.experienceYears, 0) / candidates.length) * 10,
      ) / 10;

    return {
      total: candidates.length,
      avgProgress,
      interviewCandidates: candidates.length,
      avgExperience,
    };
  }, [candidates]);

useEffect(() => {
    if (!selectedCandidate) return;

    fetch(`/api/interview/links?candidateId=${encodeURIComponent(selectedCandidate)}`)
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          setInterviewLink(data.link ?? null);
        }
      })
      .catch(console.error);
  }, [selectedCandidate, createdInterview]);

  const handleCreateInterview = async () => {
    if (!selectedCandidate || !selected) return;

    setIsCreating(true);
    setCreatedInterview(null);

    try {
      const response = await fetch("/api/interview/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateId: selectedCandidate }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        toast.error(data.error ?? "Failed to create interview");
        return;
      }

      setCreatedInterview({
        token: data.token,
        interviewUrl: data.interviewUrl,
        candidateName: data.candidateName,
      });
      setInterviewLink(data.link);
    } catch (error) {
      console.error("Create interview failed:", error);
      toast.error("Failed to create interview");
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Interview link copied.");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const getStatusLabel = (status?: InterviewLinkInfo["status"]) => {
    switch (status) {
      case "sent":
        return "Interview Sent";
      case "in_progress":
        return "In Progress";
      case "completed":
        return "Completed";
      default:
        return "No interview yet";
    }
  };

  return (
    <div className="min-h-screen bg-[#09090B] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.18),_transparent_40%)]" />

      <header className="relative border-b border-white/10 bg-[#09090B]/80 backdrop-blur-md">
        <Container className="flex items-center justify-between py-3">
          <Link href="/" className="flex items-center gap-2.5 text-sm font-semibold text-zinc-100">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-300">
              <Sparkles className="h-4 w-4" />
            </span>
            Intervu AI
          </Link>
          <nav className="flex items-center gap-6 text-sm">
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 font-medium text-white"
            >
              <LayoutDashboard className="h-4 w-4 text-indigo-400" />
              Dashboard
            </Link>
            <Link href="/" className="text-zinc-400 transition hover:text-white">
              Home
            </Link>
          </nav>
        </Container>
      </header>

      <main className="relative px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <Container>
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-300">Recruiter Console</p>
            <h1 className="mt-1 text-2xl font-semibold text-white sm:text-3xl">Interview Dashboard</h1>
            <p className="mt-2 text-sm text-zinc-400">
              AI understands each candidate&apos;s learning history and prepares an adaptive interview.
            </p>
          </div>

          {!isHydrated ? (
            <div className="flex min-h-64 items-center justify-center rounded-2xl border border-white/10 bg-zinc-950/80">
              <Loader label="Loading candidates…" />
            </div>
          ) : candidates.length === 0 ? (
            <EmptyState
              title="No candidates found"
              description="There are no candidates available to interview at this time."
              action={
                <Link href="/">
                  <Button variant="outline" className="border-white/15 bg-white/5 text-zinc-100 hover:bg-white/10">
                    Back to Home
                  </Button>
                </Link>
              }
            />
          ) : (
            <>
              <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: "Total Candidates", value: stats.total, icon: Users },
                  { label: "Avg. Learning Progress", value: `${stats.avgProgress}%`, icon: BookOpen },
                  { label: "Interview Candidates", value: stats.interviewCandidates, icon: BrainCircuit },
                  { label: "Avg. Experience", value: `${stats.avgExperience} yrs`, icon: Clock },
                ].map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="rounded-xl border border-white/10 bg-zinc-950/80 p-4"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-zinc-500">{stat.label}</p>
                        <Icon className="h-4 w-4 text-indigo-400" />
                      </div>
                      <p className="mt-2 text-2xl font-semibold tabular-nums text-white">{stat.value}</p>
                    </motion.div>
                  );
                })}
              </div>

              <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
                <section>
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-white">Candidate Overview</h2>
                    <span className="text-xs text-zinc-500">{candidates.length} candidates</span>
                  </div>
                  <div className="space-y-3">
                    {candidates.map((candidate, index) => {
                      const isSelected = candidate.id === selectedCandidate;
                      return (
                        <motion.button
                          key={candidate.id}
                          type="button"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.04 }}
                          onClick={() => {
                            setSelectedCandidate(candidate.id);
                            setCreatedInterview(null);
                          }}
                          className={`w-full rounded-xl border p-4 text-left transition ${
                            isSelected
                              ? "border-indigo-500/50 bg-indigo-500/10 ring-1 ring-indigo-500/30"
                              : "border-white/10 bg-zinc-950/80 hover:border-white/20 hover:bg-zinc-900/80"
                          }`}
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex min-w-0 items-center gap-3">
                              <div
                                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                                  isSelected ? "bg-indigo-500/30 text-indigo-200" : "bg-indigo-500/15 text-indigo-300"
                                }`}
                              >
                                {getInitials(candidate.fullName)}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate font-medium text-white">{candidate.fullName}</p>
                                <p className="truncate text-sm text-zinc-400">{candidate.role}</p>
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                              <span className="text-xs text-zinc-500">{candidate.experienceYears} yrs exp</span>
                            </div>
                          </div>

                          <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
                            <div>
                              <div className="mb-1 flex items-center justify-between text-xs text-zinc-500">
                                <span>Learning Progress</span>
                                <span>{candidate.progressPercent}%</span>
                              </div>
                              <ProgressBar
                                current={candidate.completedDays}
                                total={TOTAL_CURRICULUM_DAYS}
                              />
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {candidate.skills.slice(0, 2).map((skill) => (
                                <span
                                  key={skill.area}
                                  className={`rounded-md border px-2 py-0.5 text-xs capitalize ${levelStyles(skill.level)}`}
                                >
                                  {skill.area}
                                </span>
                              ))}
                            </div>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </section>

                <aside className="xl:sticky xl:top-6 xl:self-start">
                  {selected ? (
                    <motion.div
                      key={selected.id}
                      initial={{ opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                      className="rounded-2xl border border-indigo-500/25 bg-zinc-950/80 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.3)]"
                    >
                      <p className="text-xs font-semibold uppercase tracking-wider text-indigo-300">Selected Candidate</p>

                      <div className="mt-4 flex items-center gap-3">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-500/20 text-lg font-semibold text-indigo-300">
                          {getInitials(selected.fullName)}
                        </div>
                        <div className="min-w-0">
                          <h3 className="truncate text-lg font-semibold text-white">{selected.fullName}</h3>
                          <p className="truncate text-sm text-zinc-400">{selected.role}</p>
                        </div>
                      </div>

                      <div className="mt-5 space-y-4">
                        <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                          <p className="text-xs text-zinc-500">Experience</p>
                          <p className="mt-1 text-sm font-semibold text-white">{selected.experienceYears} years</p>
                        </div>

                        <div>
                          <div className="mb-2 flex items-center justify-between text-xs text-zinc-500">
                            <span>Learning Progress</span>
                            <span>
                              {selected.completedDays}/{TOTAL_CURRICULUM_DAYS} days · {selected.progressPercent}%
                            </span>
                          </div>
                          <ProgressBar current={selected.completedDays} total={TOTAL_CURRICULUM_DAYS} />
                        </div>

                        {selected.skills.length > 0 && (
                          <div>
                            <p className="mb-2 text-xs font-medium text-zinc-500">Skills</p>
                            <div className="flex flex-wrap gap-1.5">
                              {selected.skills.map((skill) => (
                                <span
                                  key={skill.area}
                                  className={`rounded-md border px-2 py-1 text-xs capitalize ${levelStyles(skill.level)}`}
                                >
                                  {skill.area} · {formatLevel(skill.level)}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="rounded-lg border border-indigo-500/20 bg-indigo-500/5 p-3">
                          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-300">
                            AI Interview Focus
                          </p>
                          {selected.skills.length > 0 ? (
                            <ul className="mt-2 space-y-1.5">
                              {selected.skills.map((skill) => (
                                <li key={skill.area} className="text-xs leading-relaxed text-zinc-300">
                                  {skill.area} — {formatLevel(skill.level)} · {formatConfidence(skill.confidence)} confidence
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="mt-2 text-xs text-zinc-500">No skill data available.</p>
                          )}

                          <div className="mt-3 border-t border-white/10 pt-3">
                            <p className="text-xs text-zinc-500">Recommended Difficulty</p>
                            <p className="mt-0.5 text-sm font-semibold text-white">
                              {getRecommendedDifficulty(selected.skills)}
                            </p>
                          </div>

                          <p className="mt-3 text-[11px] leading-relaxed text-zinc-500">
                            Interview questions are personalized using curriculum progress, skills, and learning signals.
                          </p>
                        </div>
                      </div>

                      {interviewLink ? (
                        <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                          <p className="text-xs text-zinc-500">Interview Status</p>
                          <p className="mt-1 text-sm font-semibold text-white">{getStatusLabel(interviewLink.status)}</p>
                          {interviewLink.status === "completed" && interviewLink.hasReport ? (
                            <Link
                              href={`/report?token=${interviewLink.token}`}
                              className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-indigo-300 transition hover:text-indigo-200"
                            >
                              View Report
                              <ArrowRight className="h-3 w-3" />
                            </Link>
                          ) : null}
                        </div>
                      ) : null}

                      {createdInterview ? (
                        <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/5 p-4">
                          <div className="flex items-center gap-2 text-sm font-semibold text-emerald-300">
                            <CheckCircle2 className="h-4 w-4" />
                            Interview Created
                          </div>
                          <p className="mt-2 text-xs text-zinc-400">
                            Candidate: <span className="text-zinc-200">{createdInterview.candidateName}</span>
                          </p>
                          <p className="mt-3 text-xs font-medium text-zinc-500">Interview Link</p>
                          <p className="mt-1 break-all rounded-md border border-white/10 bg-zinc-900/80 px-2 py-1.5 text-[11px] text-zinc-300">
                            {createdInterview.interviewUrl}
                          </p>
                          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => handleCopyLink(createdInterview.interviewUrl)}
                              className="flex-1 rounded-lg border-white/15 bg-white/5 text-zinc-100 hover:bg-white/10"
                            >
                              <Copy className="h-4 w-4" />
                              Copy Link
                            </Button>
                            <Button
                              asChild
                              className="flex-1 rounded-lg bg-indigo-500 text-white hover:bg-indigo-400"
                            >
                              <a href={createdInterview.interviewUrl} target="_blank" rel="noreferrer">
                                <ExternalLink className="h-4 w-4" />
                                Open Interview
                              </a>
                            </Button>
                          </div>
                        </div>
                      ) : null}

                      <Button
                        onClick={handleCreateInterview}
                        disabled={isCreating || !selectedCandidate}
                        className="mt-2 w-full rounded-xl bg-indigo-500 py-3 text-sm font-semibold text-white hover:bg-indigo-400"
                      >
                        {isCreating ? "Creating…" : "Create Interview"}
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  ) : (
                    <div className="rounded-2xl border border-white/10 bg-zinc-950/80 p-5">
                      <EmptyState
                        title="No candidate selected"
                        description="Select a candidate from the list to view details and start an interview."
                      />
                    </div>
                  )}
                </aside>
              </div>
            </>
          )}
        </Container>
      </main>
    </div>
  );
}
