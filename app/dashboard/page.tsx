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
  currentQuestionNumber: number;
  totalQuestions: number;
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
  skills: {
    area: string;
    level: string;
    confidence: number;
  }[];
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

function getRecommendedDifficulty(
  skills: { level: string }[],
): "Easy" | "Medium" | "Hard" {
  if (skills.length === 0) return "Medium";

  const counts = {
    beginner: 0,
    intermediate: 0,
    advanced: 0,
  };

  for (const skill of skills) {
    if (skill.level in counts) {
      counts[skill.level as keyof typeof counts]++;
    }
  }

  const max = Math.max(
    counts.beginner,
    counts.intermediate,
    counts.advanced,
  );

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

  const progressPercent = Math.round(
    (completedDays / TOTAL_CURRICULUM_DAYS) * 100,
  );

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
      return "bg-lime-400/15 text-lime-300 border-lime-400/25";

    case "intermediate":
      return "bg-lime-500/10 text-lime-400/90 border-lime-500/20";

    default:
      return "bg-zinc-500/15 text-zinc-400 border-zinc-500/25";
  }
}

export default function DashboardPage() {
  const [selectedCandidate, setSelectedCandidate] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createdInterview, setCreatedInterview] =
    useState<CreatedInterview | null>(null);

  const [interviewLink, setInterviewLink] =
    useState<InterviewLinkInfo | null>(null);

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

  const selected =
    candidates.find(
      (candidate) => candidate.id === effectiveSelectedCandidate,
    ) ?? null;

  const stats = useMemo(() => {
    if (candidates.length === 0) {
      return {
        total: 0,
        avgProgress: 0,
        interviewCandidates: 0,
        avgExperience: 0,
      };
    }

    const avgProgress = Math.round(
      candidates.reduce((sum, candidate) => {
        return sum + candidate.progressPercent;
      }, 0) / candidates.length,
    );

    const avgExperience =
      Math.round(
        (candidates.reduce((sum, candidate) => {
          return sum + candidate.experienceYears;
        }, 0) /
          candidates.length) *
          10,
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

    fetch(
      `/api/interview/links?candidateId=${encodeURIComponent(
        selectedCandidate,
      )}`,
    )
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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          candidateId: selectedCandidate,
        }),
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
    <div className="noise relative min-h-screen overflow-hidden bg-[#070707] text-[#f4f3ee]">
      {/* BACKGROUND */}

      <div className="pointer-events-none fixed inset-0">
        <div className="animated-grid absolute inset-0" />

        <div className="gradient-orb absolute -left-60 -top-60 h-[600px] w-[600px] rounded-full bg-lime-400/10 blur-[150px]" />

        <div className="gradient-orb-two absolute right-[-200px] top-[30%] h-[600px] w-[600px] rounded-full bg-lime-300/10 blur-[160px]" />
      </div>

      {/* HEADER */}

      <header className="relative z-30 border-b border-white/10 bg-black/40 backdrop-blur-xl">
        <Container className="flex h-16 items-center justify-between px-4 sm:px-6">
          <Link href="/" className="group flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5">
              <Sparkles className="h-4 w-4 text-lime-300" />
            </span>

            <span className="display-font text-sm font-bold uppercase tracking-tight">
              Intervu AI
            </span>
          </Link>

          <nav className="flex items-center gap-6 text-[10px] font-bold uppercase tracking-[0.18em]">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-white"
            >
              <LayoutDashboard className="h-3.5 w-3.5 text-lime-300" />
              Dashboard
            </Link>

            <Link
              href="/"
              className="text-zinc-600 transition hover:text-white"
            >
              Home
            </Link>
          </nav>
        </Container>
      </header>

      {/* MAIN */}

      <main className="relative z-10 px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
        <Container>
          {/* HERO */}

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="mb-12 grid gap-8 lg:grid-cols-[1fr_360px] lg:items-end"
          >
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-lime-300">
                001 — Candidate Workspace
              </p>

              <h1 className="display-font mt-5 text-6xl font-bold uppercase leading-[0.78] tracking-[-0.08em] sm:text-8xl lg:text-[8rem]">
                Interview
                <br />

                <span
                  className="text-transparent"
                  style={{
                    WebkitTextStroke: "1px rgba(244,243,238,.8)",
                  }}
                >
                  Dashboard
                </span>
              </h1>
            </div>

            <p className="max-w-sm text-sm leading-7 text-zinc-500 lg:pb-2">
              Build an adaptive interview using candidate learning history,
              skills, confidence and progression.
            </p>
          </motion.div>

          {!isHydrated ? (
            <div className="flex min-h-64 items-center justify-center border border-white/10 bg-white/[0.02]">
              <Loader label="Loading candidates…" />
            </div>
          ) : candidates.length === 0 ? (
            <EmptyState
              title="No candidates found"
              description="There are no candidates available to interview at this time."
              action={
                <Link href="/">
                  <Button
                    variant="outline"
                    className="border-white/15 bg-white/5 text-zinc-100 hover:bg-white/10"
                  >
                    Back to Home
                  </Button>
                </Link>
              }
            />
          ) : (
            <>
              {/* STATS */}

              <div className="mb-10 grid gap-px overflow-hidden border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
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
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        delay: index * 0.07,
                      }}
                      className="bg-[#0c0c0c] p-5 transition hover:bg-[#111]"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-zinc-600">
                          {stat.label}
                        </p>

                        <Icon className="h-4 w-4 text-lime-300" />
                      </div>

                      <p className="display-font mt-4 text-4xl font-bold tracking-[-0.06em]">
                        {stat.value}
                      </p>
                    </motion.div>
                  );
                })}
              </div>

              {/* CONTENT */}

              <div className="grid gap-8 xl:grid-cols-[1fr_390px]">
                {/* CANDIDATES */}

                <section>
                  <div className="mb-5 flex items-end justify-between border-b border-white/10 pb-4">
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-zinc-600">
                        002 — Candidates
                      </p>

                      <h2 className="display-font mt-2 text-3xl font-bold uppercase tracking-[-0.05em]">
                        Candidate Overview
                      </h2>
                    </div>

                    <span className="text-[9px] uppercase tracking-widest text-zinc-600">
                      {candidates.length} candidates
                    </span>
                  </div>

                  <div className="space-y-2">
                    {candidates.map((candidate, index) => {
                      const isSelected =
                        candidate.id === effectiveSelectedCandidate;

                      return (
                        <motion.button
                          key={candidate.id}
                          type="button"
                          initial={{
                            opacity: 0,
                            x: -20,
                          }}
                          animate={{
                            opacity: 1,
                            x: 0,
                          }}
                          transition={{
                            delay: index * 0.05,
                          }}
                          onClick={() => {
                            setSelectedCandidate(candidate.id);
                            setCreatedInterview(null);
                          }}
                          className={`group w-full border p-5 text-left transition ${
                            isSelected
                              ? "border-lime-400/50 bg-lime-400/[0.08] shadow-[0_0_40px_rgba(163,230,53,.12)]"
                              : "border-white/10 bg-[#0c0c0c] hover:border-white/20 hover:bg-[#111]"
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div
                              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-black ${
                                isSelected
                                  ? "bg-lime-300 text-black"
                                  : "bg-white/5 text-zinc-300"
                              }`}
                            >
                              {getInitials(candidate.fullName)}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <p className="truncate font-bold uppercase tracking-tight">
                                  {candidate.fullName}
                                </p>

                                <span className="text-[9px] uppercase tracking-wider text-zinc-600">
                                  {candidate.experienceYears} yrs exp
                                </span>
                              </div>

                              <p className="mt-1 truncate text-xs text-zinc-500">
                                {candidate.role}
                              </p>

                              <div className="mt-4 flex items-center gap-3">
                                <div className="h-1.5 flex-1 overflow-hidden bg-white/10">
                                  <motion.div
                                    initial={{
                                      width: 0,
                                    }}
                                    animate={{
                                      width: `${candidate.progressPercent}%`,
                                    }}
                                    transition={{
                                      duration: 1,
                                      delay: index * 0.08,
                                    }}
                                    className="h-full bg-lime-300"
                                  />
                                </div>

                                <span className="text-[9px] font-bold text-zinc-500">
                                  {candidate.progressPercent}%
                                </span>
                              </div>
                            </div>

                            <ArrowRight
                              className={`hidden h-4 w-4 transition sm:block ${
                                isSelected
                                  ? "translate-x-1 text-lime-300"
                                  : "text-zinc-700 group-hover:text-zinc-300"
                              }`}
                            />
                          </div>

                          <div className="mt-4 flex flex-wrap gap-1.5 pl-16">
                            {candidate.skills.slice(0, 3).map((skill) => (
                              <span
                                key={skill.area}
                                className={`rounded-full border px-2.5 py-1 text-[9px] uppercase tracking-wider ${levelStyles(
                                  skill.level,
                                )}`}
                              >
                                {skill.area}
                              </span>
                            ))}
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </section>

                {/* SIDEBAR */}

                <aside className="xl:sticky xl:top-6 xl:self-start">
                  {selected ? (
                    <motion.div
                      key={selected.id}
                      initial={{
                        opacity: 0,
                        x: 20,
                      }}
                      animate={{
                        opacity: 1,
                        x: 0,
                      }}
                      className="overflow-hidden border border-lime-400/25 bg-[#0c0c0c] shadow-[0_30px_100px_rgba(0,0,0,.4)]"
                    >
                      <div className="border-b border-white/10 bg-gradient-to-br from-lime-400/15 to-transparent p-6">
                        <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-lime-300">
                          003 — Selected Candidate
                        </p>

                        <div className="mt-5 flex items-center gap-4">
                          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-lime-300 text-lg font-black text-black">
                            {getInitials(selected.fullName)}
                          </div>

                          <div className="min-w-0">
                            <h3 className="display-font truncate text-xl font-bold uppercase tracking-tight">
                              {selected.fullName}
                            </h3>

                            <p className="mt-1 truncate text-xs text-zinc-500">
                              {selected.role}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-5 p-6">
                        <div className="grid grid-cols-2 gap-px border border-white/10 bg-white/10">
                          <div className="bg-[#111] p-4">
                            <p className="text-[9px] uppercase tracking-widest text-zinc-600">
                              Experience
                            </p>

                            <p className="mt-2 text-lg font-black">
                              {selected.experienceYears} yrs
                            </p>
                          </div>

                          <div className="bg-[#111] p-4">
                            <p className="text-[9px] uppercase tracking-widest text-zinc-600">
                              Progress
                            </p>

                            <p className="mt-2 text-lg font-black">
                              {selected.progressPercent}%
                            </p>
                          </div>
                        </div>

                        <div>
                          <div className="mb-2 flex justify-between text-[9px] uppercase tracking-widest text-zinc-600">
                            <span>Learning progression</span>

                            <span>
                              {selected.completedDays}/
                              {TOTAL_CURRICULUM_DAYS}
                            </span>
                          </div>

                          <ProgressBar
                            current={selected.completedDays}
                            total={TOTAL_CURRICULUM_DAYS}
                          />
                        </div>

                        {interviewLink ? (
                          <div>
                            <div className="mb-2 flex items-center justify-between text-xs text-zinc-500">
                              <span>Interview Progress</span>
                              <span>
                                {interviewLink.currentQuestionNumber}/{interviewLink.totalQuestions} questions
                              </span>
                            </div>
                            <ProgressBar
                              current={interviewLink.currentQuestionNumber}
                              total={interviewLink.totalQuestions}
                            />
                            <p className="mt-2 text-xs text-zinc-500">
                              {getStatusLabel(interviewLink.status)}
                            </p>
                          </div>
                        ) : null}

                        {selected.skills.length > 0 && (
                          <div>
                            <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-600">
                              Skills
                            </p>

                            <div className="flex flex-wrap gap-1.5">
                              {selected.skills.map((skill) => (
                                <span
                                  key={skill.area}
                                  className={`rounded-full border px-2.5 py-1 text-[9px] uppercase tracking-wider ${levelStyles(
                                    skill.level,
                                  )}`}
                                >
                                  {skill.area} ·{" "}
                                  {formatLevel(skill.level)}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* AI FOCUS */}

                        <div className="border border-lime-400/20 bg-lime-400/[0.06] p-4">
                          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-lime-300">
                            AI Interview Focus
                          </p>

                          {selected.skills.length > 0 ? (
                            <ul className="mt-4 space-y-2">
                              {selected.skills.map((skill) => (
                                <li
                                  key={skill.area}
                                  className="flex justify-between gap-3 text-xs text-zinc-300"
                                >
                                  <span>{skill.area}</span>

                                  <span className="text-zinc-600">
                                    {formatLevel(skill.level)} ·{" "}
                                    {formatConfidence(skill.confidence)}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="mt-3 text-xs text-zinc-500">
                              No skill data available.
                            </p>
                          )}

                          <div className="mt-4 border-t border-white/10 pt-4">
                            <p className="text-[9px] uppercase tracking-widest text-zinc-600">
                              Recommended Difficulty
                            </p>

                            <p className="mt-1 font-bold">
                              {getRecommendedDifficulty(
                                selected.skills,
                              )}
                            </p>
                          </div>
                        </div>

                        {/* INTERVIEW STATUS */}

                        {interviewLink ? (
                          <div className="border border-white/10 bg-white/[0.03] p-4">
                            <p className="text-[9px] uppercase tracking-widest text-zinc-600">
                              Interview Status
                            </p>

                            <p className="mt-2 text-sm font-bold">
                              {getStatusLabel(interviewLink.status)}
                            </p>

                            {interviewLink.status === "completed" &&
                            interviewLink.hasReport ? (
                              <Link
                                href={`/report?token=${interviewLink.token}`}
                                className="mt-3 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-lime-300"
                              >
                                View Report
                                <ArrowRight className="h-3 w-3" />
                              </Link>
                            ) : null}
                          </div>
                        ) : null}

                        {/* CREATED INTERVIEW */}

                        {createdInterview ? (
                          <div className="border border-emerald-400/20 bg-emerald-400/[0.05] p-4">
                            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-300">
                              <CheckCircle2 className="h-4 w-4" />
                              Interview Created
                            </div>

                            <p className="mt-3 text-xs text-zinc-500">
                              Candidate:{" "}
                              <span className="text-zinc-200">
                                {createdInterview.candidateName}
                              </span>
                            </p>

                            <p className="mt-3 break-all border border-white/10 bg-black/30 p-2 text-[10px] text-zinc-400">
                              {createdInterview.interviewUrl}
                            </p>

                            <div className="mt-3 grid grid-cols-2 gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() =>
                                  handleCopyLink(
                                    createdInterview.interviewUrl,
                                  )
                                }
                                className="border-white/15 bg-white/5 text-[10px] uppercase tracking-wider text-zinc-100 hover:bg-white/10"
                              >
                                <Copy className="h-3.5 w-3.5" />
                                Copy
                              </Button>

                              <Button
                                asChild
                                className="bg-lime-400 text-[10px] uppercase tracking-wider text-black hover:bg-lime-300"
                              >
                                <a
                                  href={createdInterview.interviewUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  <ExternalLink className="h-3.5 w-3.5" />
                                  Open
                                </a>
                              </Button>
                            </div>
                          </div>
                        ) : null}

                        {/* CREATE */}

                        <Button
                          onClick={handleCreateInterview}
                          disabled={isCreating || !selectedCandidate}
                          className="group h-14 w-full rounded-none bg-lime-300 text-xs font-black uppercase tracking-[0.16em] text-black hover:bg-lime-200"
                        >
                          {isCreating
                            ? "Creating…"
                            : "Create Interview"}

                          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </Button>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="border border-white/10 bg-[#0c0c0c] p-6">
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
