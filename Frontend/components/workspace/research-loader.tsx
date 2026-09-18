"use client";

import { motion } from "framer-motion";

interface ResearchLoaderProps {
  label?: string;
}

/**
 * Brief transitional loader shown the instant a research request starts,
 * before the step-by-step stream takes over. Lives entirely inside the
 * assistant's chat bubble so it feels like part of the conversation
 * rather than a separate dashboard widget.
 */
export function ResearchLoader({ label = "Warming up the research pipeline…" }: ResearchLoaderProps) {
  return (
    <div className="flex items-center gap-3 py-0.5">
      <div className="relative flex h-6 w-6 shrink-0 items-center justify-center">
        <motion.span
          className="absolute h-6 w-6 rounded-full border border-white/20"
          animate={{ scale: [1, 1.6], opacity: [0.5, 0] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut" }}
        />
        <motion.span
          className="absolute h-6 w-6 rounded-full border border-white/20"
          animate={{ scale: [1, 1.6], opacity: [0.5, 0] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut", delay: 0.5 }}
        />
        <motion.span
          className="h-2 w-2 rounded-full bg-white/80"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
      <motion.span
        className="text-[13px] text-gradient-silver"
        animate={{ opacity: [0.55, 1, 0.55] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
      >
        {label}
      </motion.span>
    </div>
  );
}
