"use client";

import { motion } from "framer-motion";
import { ScoreRing } from "@/components/common/score-ring";
import { Badge } from "@/components/ui/badge";

export function ProductShowcase() {
  return (
    <section id="showcase" className="relative mx-auto max-w-5xl px-6 py-28">
      <div className="mb-14 text-center">
        <p className="text-xs uppercase tracking-widest text-white/35">Product</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          One workspace, from research to a sent message.
        </h2>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden rounded-2xl border border-white/8 bg-[#0c0c0c] shadow-premium"
      >
        <div className="flex items-center gap-2 border-b border-white/6 bg-white/[0.02] px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
          <span className="ml-3 text-[11px] text-white/30">app.prospectiq.ai/accounts/anthropic</span>
        </div>

        <div className="grid gap-6 p-8 sm:grid-cols-3">
          <div className="sm:col-span-2 space-y-4">
            <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium text-white/70">Executive Brief — Anthropic</span>
                <Badge variant="success">91% confidence</Badge>
              </div>
              <p className="text-[13px] leading-relaxed text-white/40">
                Engineering leadership has publicly flagged fragmented tooling as a
                platform-strategy blocker. Budget was approved for FY26 infra tooling.
                Recommended motion: lead with a platform-consolidation angle to the CTO.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {["Data Silos Across Engineering", "Slow Time-to-Insight"].map((p) => (
                <div key={p} className="rounded-xl border border-white/8 bg-white/[0.02] p-3">
                  <p className="text-[11px] text-white/30">Pain point</p>
                  <p className="mt-1 text-xs text-white/70">{p}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-white/8 bg-white/[0.02] p-4">
            <ScoreRing score={94} size={90} label="trust score" />
            <p className="text-center text-[11px] text-white/30">
              Grounded in 3 independent public sources
            </p>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
