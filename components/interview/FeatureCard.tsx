"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

type FeatureCardProps = {
  title: string;
  description: string;
  icon: ReactNode;
  gradient: string;
  delay: number;
};

export function FeatureCard({
  title,
  description,
  icon,
  gradient,
  delay,
}: FeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.8,
        ease: "easeOut",
        delay,
      }}
      whileHover={{
        y: -8,
        scale: 1.025,
      }}
      className="relative mx-auto flex w-full max-w-[260px] flex-col items-start justify-start group md:max-w-[300px]"
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
        className="relative z-10 h-[260px] w-full self-stretch overflow-hidden rounded-[40px] border-[8px] border-transparent transition-all duration-500 group-hover:shadow-[0_20px_80px_rgba(255,255,255,0.08)] md:h-[300px]"
        style={{
          background: `linear-gradient(#1A1A1C, #1A1A1C) padding-box, ${gradient} border-box`,
        }}
      >
        {/* SUBTLE LIGHT */}
        <div
          className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full opacity-20 blur-3xl transition-opacity duration-500 group-hover:opacity-40"
          style={{ background: gradient }}
        />

        {/* CONTENT */}
        <div className="relative flex h-full w-full flex-col justify-between p-7">
          {/* ICON */}
          <div className="text-white/90 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
            {icon}
          </div>

          {/* TEXT */}
          <div>
            <h3 className="mb-3 text-xl font-medium tracking-tight text-white">
              {title}
            </h3>

            <p className="text-[14px] font-normal leading-[1.6] text-gray-400 selection:bg-white/20">
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