"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowDown,
  ArrowRight,
  BrainCircuit,
  Check,
  ChevronRight,
  Cpu,
  MessageSquareText,
  Monitor,
  Palette,
  Play,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";

const features = [
  {
    number: "01",
    title: "Adaptive",
    description:
      "The AI changes the next question based on how you answer.",
    icon: BrainCircuit,
  },
  {
    number: "02",
    title: "Intelligent",
    description:
      "Evaluate technical depth, reasoning, confidence and clarity.",
    icon: Cpu,
  },
  {
    number: "03",
    title: "Personal",
    description:
      "Every interview is shaped around the candidate's learning history.",
    icon: Target,
  },
];

const steps = [
  "Select a candidate",
  "AI analyzes their profile",
  "Interview begins",
  "Questions adapt in real time",
  "Receive your evaluation",
];
function FeatureCard({
  title,
  description,
  icon,
  gradient,
  delay,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{
        duration: 0.8,
        ease: "easeOut",
        delay,
      }}
      whileHover={{
        y: -8,
        scale: 1.02,
      }}
      className="group relative mx-auto flex w-full max-w-[260px] flex-col items-start justify-start md:max-w-[300px]"
    >
      {/* GLOW */}
      <div
        className="pointer-events-none absolute h-[260px] w-full rounded-[40px] opacity-60 md:h-[300px]"
        style={{
          background: gradient,
          filter: "blur(45px)",
        }}
      />

      {/* CARD */}
      <div
        className="relative z-10 h-[260px] w-full overflow-hidden rounded-[40px] border-[8px] border-transparent shadow-[0_20px_80px_rgba(0,0,0,0.35)] transition-all duration-500 group-hover:shadow-[0_25px_100px_rgba(255,255,255,0.08)] md:h-[300px]"
        style={{
          background: `linear-gradient(#1A1A1C, #1A1A1C) padding-box, ${gradient} border-box`,
        }}
      >
        {/* INNER GLOW */}
        <div
          className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full opacity-20 blur-3xl transition-opacity duration-500 group-hover:opacity-40"
          style={{
            background: gradient,
          }}
        />

        {/* CONTENT */}
        <div className="relative flex h-full w-full flex-col justify-between p-7">
          <div className="text-white/90 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
            {icon}
          </div>

          <div>
            <h3 className="mb-3 text-xl font-medium tracking-tight text-white">
              {title}
            </h3>

            <p className="text-[14px] font-normal leading-[1.6] text-gray-400">
              {description}
            </p>
          </div>
        </div>

        {/* SHINE */}
        <div className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
      </div>
    </motion.div>
  );
}

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#070707] text-[#f4f3ee]">
      {/* BACKGROUND */}

      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[#070707]" />

        <div className="absolute -left-60 -top-60 h-[650px] w-[650px] rounded-full bg-lime-400/10 blur-[160px]" />

        <div className="absolute right-[-250px] top-[25%] h-[650px] w-[650px] rounded-full bg-lime-300/10 blur-[180px]" />

        <div className="absolute left-[40%] top-[70%] h-[300px] w-[300px] rounded-full bg-yellow-300/10 blur-[120px]" />
      </div>

      {/* NAVBAR */}

      <header className="relative z-50 border-b border-white/10 bg-black/40 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5">
              <Sparkles className="h-4 w-4 text-lime-300" />
            </div>

            <span className="display-font text-sm font-bold uppercase tracking-tight">
              Intervu AI
            </span>
          </Link>

          <nav className="hidden items-center gap-8 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 md:flex">
            <a href="#features" className="transition hover:text-white">
              Features
            </a>

            <a href="#process" className="transition hover:text-white">
              Process
            </a>

            <a href="#why" className="transition hover:text-white">
              Why AI
            </a>
          </nav>

          <Link
            href="/dashboard"
            className="cursor-glow flex items-center gap-2 rounded-full bg-lime-300 px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-black transition hover:bg-lime-200"
          >
            Start Interview
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </header>

      {/* HERO */}

      <section className="relative z-10 flex min-h-[calc(100vh-64px)] items-center px-5 py-20 sm:px-8">
        <div className="mx-auto grid w-full max-w-[1400px] items-center gap-16 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
            >
              <div className="mb-8 flex items-center gap-3">
                <span className="h-px w-10 bg-lime-300" />

                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-lime-300">
                  Adaptive AI Interview Agent
                </span>
              </div>

              <h1 className="display-font text-[16vw] font-bold uppercase leading-[0.75] tracking-[-0.09em] sm:text-[12vw] lg:text-[9.3rem]">
                Prepare.
                <br />

                <span className="gradient-text">Perform.</span>
                <br />

                <span
                  className="text-transparent"
                  style={{
                    WebkitTextStroke: "1px rgba(244,243,238,.8)",
                  }}
                >
                  Improve.
                </span>
              </h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.7 }}
                className="mt-10 max-w-xl text-base leading-7 text-zinc-500 sm:text-lg"
              >
                Technical interviews that think with you. Practice with an AI
                agent that adapts questions to your knowledge, reasoning and
                confidence.
              </motion.p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/dashboard"
                  className="cursor-glow group inline-flex items-center justify-center gap-3 bg-lime-300 px-7 py-4 text-xs font-black uppercase tracking-[0.15em] text-black transition hover:bg-lime-200"
                >
                  Start Interview
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>

                <a
                  href="#process"
                  className="inline-flex items-center justify-center gap-3 border border-white/10 bg-white/[0.03] px-7 py-4 text-xs font-bold uppercase tracking-[0.15em] text-zinc-300 transition hover:bg-white/[0.07]"
                >
                  <Play className="h-3.5 w-3.5" />
                  See how it works
                </a>
              </div>
            </motion.div>
          </div>

          {/* HERO AI OBJECT */}

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="relative mx-auto w-full max-w-[500px]"
          >
            <div className="float-card relative aspect-square">
              <div className="absolute inset-[12%] rounded-full bg-lime-400/10 blur-[70px]" />

              <div className="absolute inset-[17%] rounded-full border border-white/10 bg-white/[0.02] backdrop-blur-3xl" />

              <div className="absolute inset-[25%] rounded-full border border-lime-400/20 bg-lime-400/[0.04]" />

              <motion.div
                animate={{
                  rotate: 360,
                }}
                transition={{
                  duration: 20,
                  repeat: Infinity,
                  ease: "linear",
                }}
                className="absolute inset-[10%] rounded-full border border-dashed border-lime-300/20"
              />

              <motion.div
                animate={{
                  rotate: -360,
                }}
                transition={{
                  duration: 14,
                  repeat: Infinity,
                  ease: "linear",
                }}
                className="absolute inset-[31%] rounded-full border border-dashed border-yellow-300/20"
              />

              <div className="absolute left-1/2 top-1/2 flex h-28 w-28 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-gradient-to-br from-lime-300 to-lime-500 shadow-[0_0_100px_rgba(190,242,100,.35)]">
                <BrainCircuit className="h-12 w-12 text-black" />
              </div>

              <div className="absolute left-[5%] top-[30%] border border-white/10 bg-black/60 px-4 py-3 backdrop-blur-xl">
                <p className="text-[8px] uppercase tracking-widest text-zinc-600">
                  Adaptive
                </p>
                <p className="mt-1 text-xs font-bold">Difficulty ↑</p>
              </div>

              <div className="absolute bottom-[22%] right-[2%] border border-white/10 bg-black/60 px-4 py-3 backdrop-blur-xl">
                <p className="text-[8px] uppercase tracking-widest text-zinc-600">
                  AI Score
                </p>
                <p className="mt-1 text-xs font-bold text-lime-300">
                  92 / 100
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        <a
          href="#features"
          className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 text-[8px] font-bold uppercase tracking-[0.25em] text-zinc-600"
        >
          Scroll
          <ArrowDown className="h-4 w-4 animate-bounce" />
        </a>
      </section>

      {/* MARQUEE */}

      <div className="relative z-10 overflow-hidden border-y border-white/10 py-5">
        <div className="marquee">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex items-center">
              {[
                "ADAPTIVE INTERVIEWS",
                "AI EVALUATION",
                "REAL-TIME FOLLOW UPS",
                "PERSONALIZED FEEDBACK",
              ].map((text) => (
                <div key={text} className="mx-8 flex items-center gap-8">
                  <span className="display-font text-xl font-bold uppercase tracking-tight text-zinc-700 sm:text-3xl">
                    {text}
                  </span>
                  <span className="text-lime-300">✦</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* FEATURES */}

      <section
        id="features"
        className="relative z-10 px-5 py-28 sm:px-8 lg:py-40"
      >
        <div className="mx-auto max-w-[1400px]">
          <div className="mb-16 grid gap-8 lg:grid-cols-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-lime-300">
                01 — Intelligence
              </p>

              <h2 className="display-font mt-5 text-5xl font-bold uppercase leading-[0.85] tracking-[-0.07em] sm:text-7xl">
                Interviews
                <br />
                that <span className="gradient-text">adapt.</span>
              </h2>
            </div>

            <p className="max-w-md self-end text-sm leading-7 text-zinc-500">
              Forget static question lists. Intervu AI analyzes the candidate
              and continuously adjusts the conversation.
            </p>
          </div>

          <div className="relative grid w-full grid-cols-1 gap-10 md:grid-cols-3 md:gap-3 lg:gap-3">
  <FeatureCard
    title="Adaptive AI"
    description="Every answer changes what comes next. Your interview adapts to your knowledge, confidence, and reasoning."
    icon={<Monitor size={32} strokeWidth={2.5} />}
    delay={0.1}
    gradient="linear-gradient(137deg, #84CC16 0%, #BEF264 45%, #FDE047 100%)"
  />

  <FeatureCard
    title="Smart Evaluation"
    description="AI evaluates your technical answers, communication, reasoning, and depth with structured feedback."
    icon={<Palette size={32} strokeWidth={2.5} />}
    delay={0.2}
    gradient="linear-gradient(137deg, #FFFFFF 0%, #D9F99D 45%, #A3E635 100%)"
  />

  <FeatureCard
    title="Live Insights"
    description="Turn every interview into actionable insights with personalized reports and recommendations."
    icon={<Zap size={32} strokeWidth={2.5} />}
    delay={0.3}
    gradient="linear-gradient(137deg, #365314 0%, #BEF264 45%, #FDE047 100%)"
            />
          </div>
        </div>
      </section>

      {/* PROCESS */}

      <section
        id="process"
        className="relative z-10 border-y border-white/10 px-5 py-28 sm:px-8 lg:py-40"
      >
        <div className="mx-auto max-w-[1400px]">
          <div className="mb-20">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-lime-300">
              02 — Process
            </p>

            <h2 className="display-font mt-5 max-w-4xl text-5xl font-bold uppercase leading-[0.85] tracking-[-0.07em] sm:text-7xl">
              From candidate
              <br />
              to <span className="gradient-text">insight.</span>
            </h2>
          </div>

          <div>
            {steps.map((step, index) => (
              <motion.div
                key={step}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                className="group flex items-center gap-6 border-t border-white/10 py-7"
              >
                <span className="text-xs font-bold text-lime-300">
                  0{index + 1}
                </span>

                <h3 className="display-font text-2xl font-bold uppercase tracking-[-0.04em] transition group-hover:translate-x-3 sm:text-4xl">
                  {step}
                </h3>

                <ArrowRight className="ml-auto h-5 w-5 text-zinc-700 transition group-hover:translate-x-2 group-hover:text-lime-300" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY */}

      <section
        id="why"
        className="relative z-10 px-5 py-28 sm:px-8 lg:py-40"
      >
        <div className="mx-auto max-w-[1400px]">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-lime-300">
                03 — Why Intervu
              </p>

              <h2 className="display-font mt-6 text-6xl font-bold uppercase leading-[0.8] tracking-[-0.08em] sm:text-8xl">
                Not just
                <br />
                another
                <br />
                <span className="gradient-text">quiz.</span>
              </h2>
            </div>

            <div className="space-y-4">
              {[
                "Questions respond to candidate answers.",
                "Difficulty adjusts automatically.",
                "Technical reasoning is evaluated.",
                "Every session generates actionable feedback.",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-4 border-b border-white/10 py-5"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-lime-400/10">
                    <Check className="h-3.5 w-3.5 text-lime-300" />
                  </div>

                  <span className="text-sm text-zinc-400">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}

      <section className="relative z-10 px-5 pb-24 sm:px-8 lg:pb-32">
        <div className="mx-auto max-w-[1400px] overflow-hidden border border-white/10 bg-[#f4f3ee] text-black">
          <div className="relative p-8 sm:p-14 lg:p-20">
            <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-lime-300/30 blur-[100px]" />

            <div className="relative max-w-4xl">
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500">
                Ready?
              </p>

              <h2 className="display-font mt-5 text-6xl font-bold uppercase leading-[0.8] tracking-[-0.08em] sm:text-8xl lg:text-[9rem]">
                Start
                <br />
                interviewing.
              </h2>

              <Link
                href="/dashboard"
                className="cursor-glow mt-10 inline-flex items-center gap-3 bg-black px-7 py-4 text-xs font-black uppercase tracking-[0.15em] text-white transition hover:bg-lime-300 hover:text-black"
              >
                Open Dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}

      <footer className="relative z-10 border-t border-white/10 px-5 py-8 sm:px-8">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="h-4 w-4 text-lime-300" />

            <span className="text-xs font-bold uppercase tracking-widest">
              Intervu AI
            </span>
          </div>

          <p className="text-[9px] uppercase tracking-widest text-zinc-700">
            Adaptive AI Interview Agent · 2026
          </p>
        </div>
      </footer>
    </main>
  );
}
