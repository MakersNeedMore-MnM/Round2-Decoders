"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check, X } from "lucide-react";
import type { WorkspaceStreamStep } from "@/types";
import { cn } from "@/lib/utils";

interface StreamStepsProps {
  steps: WorkspaceStreamStep[];
  chips?: string[];
}

/**
 * Renders the live "thinking out loud" trail inside the assistant's chat
 * bubble — one line per step, revealed progressively by the parent, plus
 * any resource chips (CRM, Website, Emails…) that have finished loading.
 */
export function StreamSteps({ steps, chips = [] }: StreamStepsProps) {
  return (
    <div className="space-y-2">
      <AnimatePresence initial={false}>
        {steps.map((step) => (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="flex items-center gap-2.5"
          >
            <span
              className={cn(
                "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors duration-300",
                step.status === "done"
                  ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-400"
                  : step.status === "error"
                    ? "border-red-500/40 bg-red-500/15 text-red-400"
                    : "border-white/20 bg-white/[0.04] text-transparent",
              )}
            >
              {step.status === "done" ? (
                <Check className="h-2.5 w-2.5" />
              ) : step.status === "error" ? (
                <X className="h-2.5 w-2.5" />
              ) : (
                <motion.span
                  className="h-1.5 w-1.5 rounded-full bg-white/70"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
                />
              )}
            </span>
            <span
              className={cn(
                "text-[13px] leading-relaxed transition-colors duration-300",
                step.status === "done"
                  ? "text-white/45"
                  : step.status === "error"
                    ? "text-red-400"
                    : "text-white/85",
              )}
            >
              {step.label}
              {step.agent && step.status === "active" && (
                <span className="ml-1.5 text-[10px] text-white/30">— {step.agent}</span>
              )}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>

      {chips.length > 0 && (
        <motion.div
          layout
          className="flex flex-wrap gap-1.5 pt-1"
        >
          <AnimatePresence initial={false}>
            {chips.map((chip) => (
              <motion.span
                key={chip}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25 }}
                className="inline-flex items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-500/[0.08] px-2.5 py-1 text-[11px] font-medium text-emerald-300/90"
              >
                <Check className="h-2.5 w-2.5" />
                {chip}
              </motion.span>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}