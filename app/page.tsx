"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BrainCircuit,
  ChartNoAxesCombined,
  Cpu,
  GitBranch,
  LayoutDashboard,
  Lightbulb,
  MessageSquareText,
  Play,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    title: "Adaptive Interview",
    description: "Dynamic conversation paths that respond to each answer in real time.",
    icon: BrainCircuit,
  },
  {
    title: "AI Evaluation",
    description: "Structured scoring and coaching feedback built for technical interviews.",
    icon: Cpu,
  },
  {
    title: "Follow-up Questions",
    description: "Deeper probing prompts that uncover confidence and reasoning quality.",
    icon: MessageSquareText,
  },
  {
    title: "Personalized Report",
    description: "A polished summary of strengths, gaps, and next-step recommendations.",
    icon: ChartNoAxesCombined,
  },
  {
    title: "Curriculum Based",
    description: "Structured interview flows aligned with modern AI engineering topics.",
    icon: GitBranch,
  },
  {
    title: "Gemini Powered",
    description: "Intelligent feedback experiences powered by advanced language models.",
    icon: Sparkles,
  },
];

const steps = [
  "Select Candidate",
  "AI Starts Interview",
  "Answer Questions",
  "Receive AI Evaluation",
  "Generate Report",
];

const reasons = [
  {
    title: "Adaptive Difficulty",
    description: "Experience interview pacing that adjusts to the candidate’s level.",
  },
  {
    title: "Real-time Feedback",
    description: "Get immediate guidance that keeps momentum high and learning sharp.",
  },
  {
    title: "Technical Evaluation",
    description: "Assess clarity, depth, and correctness across critical concepts.",
  },
  {
    title: "Professional Reports",
    description: "Deliver polished insights that feel enterprise-ready and polished.",
  },
  {
    title: "Interview Analytics",
    description: "Track progress, confidence, and progression over time with ease.",
  },
  {
    title: "Modern AI Experience",
    description: "Enjoy a premium interface designed for speed and clarity.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[#09090B] text-white">
      <main className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.28),_transparent_35%),radial-gradient(circle_at_80%_20%,_rgba(34,197,94,0.16),_transparent_28%)]" />

        <header className="relative border-b border-white/10 bg-[#09090B]/80 backdrop-blur-md">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
            <Link href="/" className="flex items-center gap-2.5 text-sm font-semibold text-zinc-100">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-300">
                <Sparkles className="h-4 w-4" />
              </span>
              Intervu AI
            </Link>
            <nav className="hidden items-center gap-8 text-sm text-zinc-400 md:flex">
              <Link href="/dashboard" className="transition hover:text-white">
                Dashboard
              </Link>
              <a href="#features" className="transition hover:text-white">
                Features
              </a>
              <a href="#how-it-works" className="transition hover:text-white">
                How it works
              </a>
              <a href="#why" className="transition hover:text-white">
                Why Intervu AI
              </a>
            </nav>
            <Button
              asChild
              size="sm"
              className="rounded-lg bg-indigo-500 px-4 text-sm font-medium text-white hover:bg-indigo-400"
            >
              <Link href="/dashboard">
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>
            </Button>
          </div>
        </header>

        <section className="relative px-4 py-10 sm:px-8 sm:py-14 lg:px-8 lg:py-16">
          <div className="mx-auto grid max-w-7xl items-center gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="max-w-2xl"
            >
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-200">
                <ShieldCheck className="h-3.5 w-3.5" />
                Premium AI interview experience
              </div>
              <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl">
                Adaptive AI Interview Agent
              </h1>
              <p className="mt-4 text-base leading-7 text-zinc-400 sm:text-lg">
                Practice technical interviews powered by AI. Receive adaptive follow-up questions, instant evaluation, personalized feedback, and a complete interview report.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button
                  asChild
                  className="rounded-xl bg-indigo-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400"
                >
                  <Link href="/dashboard">
                    Open Interview Dashboard
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <button
                  type="button"
                  onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-zinc-300 transition hover:bg-white/10"
                >
                  <Play className="h-3.5 w-3.5" />
                  Learn how it works
                </button>
              </div>

              <div className="mt-6 flex flex-wrap gap-2 text-xs text-zinc-400">
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Adaptive follow-ups</span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Instant scoring</span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Structured reports</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
              className="relative"
            >
              <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-indigo-500/30 via-transparent to-emerald-400/20 blur-3xl" />
              <div className="relative rounded-[2rem] border border-white/10 bg-zinc-950/80 p-4 shadow-[0_30px_80px_rgba(0,0,0,0.4)] backdrop-blur-xl sm:p-6">
                <div className="absolute left-6 top-6 h-20 w-20 rounded-full bg-indigo-500/25 blur-2xl" />
                <div className="absolute bottom-8 right-10 h-24 w-24 rounded-full bg-emerald-400/20 blur-2xl" />
                <div className="relative rounded-[1.75rem] border border-white/10 bg-gradient-to-br from-zinc-900 to-zinc-950 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-zinc-400">Live interview session</p>
                      <p className="mt-1 text-lg font-semibold text-white">AI assistant ready</p>
                    </div>
                    <div className="rounded-full bg-emerald-500/15 px-3 py-1 text-sm text-emerald-300">
                      Online
                    </div>
                  </div>

                  <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-300">
                        <BrainCircuit className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">Prompt engineering</p>
                        <p className="text-sm text-zinc-400">Explain your reasoning clearly.</p>
                      </div>
                    </div>
                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xl border border-white/10 bg-zinc-900/70 p-3 text-sm text-zinc-300">
                        <p className="font-medium text-white">Adaptive depth</p>
                        <p className="mt-1 text-zinc-400">Probing follow-ups when needed</p>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-zinc-900/70 p-3 text-sm text-zinc-300">
                        <p className="font-medium text-white">Instant synthesis</p>
                        <p className="mt-1 text-zinc-400">Feedback and next steps</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section id="features" className="relative px-4 py-12 sm:px-8 sm:py-16 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-indigo-300">Features</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Built for modern AI interview preparation.
              </h2>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <motion.article
                    key={feature.title}
                    initial={{ opacity: 0, y: 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.4, delay: index * 0.06 }}
                    whileHover={{ y: -6, scale: 1.01 }}
                    className="flex h-full flex-col rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.2)]"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-300">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-white">{feature.title}</h3>
                    <p className="mt-2 flex-1 text-sm leading-6 text-zinc-400">{feature.description}</p>
                  </motion.article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="relative px-4 py-12 sm:px-8 sm:py-16 lg:px-8">
          <div className="mx-auto max-w-7xl rounded-[2rem] border border-white/10 bg-zinc-950/60 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.25)] sm:p-10 lg:p-12">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-300">How it works</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                A simple journey from interview kickoff to insight.
              </h2>
            </div>
            <div className="mt-10 grid gap-4 lg:grid-cols-5">
              {steps.map((step, index) => (
                <div key={step} className="flex items-center gap-4 lg:flex-col lg:items-start">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-sm font-semibold text-indigo-200">
                    {index + 1}
                  </div>
                  <div className="flex-1 lg:flex-none">
                    <p className="text-base font-semibold text-white">{step}</p>
                    {index < steps.length - 1 ? <p className="mt-2 text-sm text-zinc-500">↓</p> : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="why" className="relative px-4 py-12 sm:px-8 sm:py-16 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-indigo-300">Why Intervu AI</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Designed to make practice feel premium, focused, and insightful.
              </h2>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {reasons.map((reason, index) => (
                <motion.div
                  key={reason.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  className="flex h-full flex-col rounded-2xl border border-white/10 bg-zinc-900/70 p-5"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300">
                    <Lightbulb className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-white">{reason.title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-6 text-zinc-400">{reason.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section id="cta" className="relative px-4 pb-16 sm:px-8 sm:pb-20 lg:px-8">
          <div className="mx-auto max-w-7xl rounded-[2rem] border border-indigo-400/20 bg-gradient-to-br from-indigo-500/15 via-zinc-900/80 to-emerald-500/10 p-6 shadow-[0_20px_80px_rgba(99,102,241,0.16)] sm:p-10 lg:p-12">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-indigo-200">Ready to begin</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                  Ready to test your skills?
                </h2>
                <p className="mt-4 text-lg text-zinc-400">
                  Step into an experience crafted to feel sharp, modern, and genuinely useful.
                </p>
              </div>
              <Button
                asChild
                className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-100"
              >
                <Link href="/dashboard">
                  Open Dashboard
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-[#09090B] px-4 py-8 sm:px-8 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-300">
              <Sparkles className="h-4 w-4" />
            </span>
            <div>
              <p className="font-semibold text-white">Intervu AI</p>
              <p className="text-sm text-zinc-500">Made for Hackathon</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-5 text-sm text-zinc-400">
            <a href="https://github.com" target="_blank" rel="noreferrer" className="flex items-center gap-2 transition hover:text-white">
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true"><path d="M12 .5C5.65.5.5 5.65 5.65 0 12 0c5.65 0 10.25 4.6 10.25 10.25 0 4.55-2.95 8.4-7.03 9.76-.52.1-.72-.22-.72-.49v-1.7c0-.66-.02-1.24-.03-1.76-2.86.62-3.46-1.23-3.46-1.23-.47-1.2-1.15-1.52-1.15-1.52-.94-.64.07-.63.07-.63 1.04.07 1.58 1.06 1.58 1.06.92 1.58 2.42 1.12 3.01.86.09-.67.36-1.12.66-1.38-2.28-.26-4.68-1.14-4.68-5.08 0-1.12.4-2.03 1.06-2.75-.11-.26-.46-1.31.1-2.73 0 0 .87-.28 2.84 1.05a9.89 9.89 0 0 1 5.17 0c1.97-1.33 2.84-1.05 2.84-1.05.56 1.42.21 2.47.1 2.73.66.72 1.06 1.63 1.06 2.75 0 3.95-2.41 4.82-4.71 5.07.37.32.7.95.7 1.92v2.84c0 .27-.2.6-.72.49A10.26 10.26 0 0 1 1.75 12.75C1.75 5.65 6.35.5 12 .5Z"/></svg>
              GitHub
            </a>
            <a href="#" className="transition hover:text-white">
              Privacy
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
