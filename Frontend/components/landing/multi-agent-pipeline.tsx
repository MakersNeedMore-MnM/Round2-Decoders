"use client";

import { motion } from "framer-motion";
import { Globe, Users, Brain, ShieldAlert, Gauge, CheckCircle2 } from "lucide-react";

const STAGES = [
  { icon: Globe, label: "Research", desc: "CRM, web, transcripts ingested" },
  { icon: Users, label: "Stakeholder Mapping", desc: "Roles & influence identified" },
  { icon: Brain, label: "Strategy AI", desc: "Messaging & next actions drafted" },
  { icon: ShieldAlert, label: "Guardrails", desc: "Unsupported claims rejected" },
  { icon: Gauge, label: "Confidence Score", desc: "Every output scored & sourced" },
  { icon: CheckCircle2, label: "Human Approval", desc: "Nothing external without sign-off" },
];

export function MultiAgentPipeline() {
  return (
    <section id="pipeline" className="relative mx-auto max-w-5xl px-6 py-28">
      <div className="mb-14 text-center">
        <p className="text-xs uppercase tracking-widest text-white/35">How it reasons</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          A visible chain of reasoning,
          <br className="hidden sm:block" /> not a black box.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-sm text-white/45">
          Every account moves through the same six-stage pipeline. You can trace any
          recommendation back to the evidence and the agent that produced it.
        </p>
      </div>

      <div className="relative grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <div className="absolute left-0 right-0 top-[38px] hidden h-px bg-gradient-to-r from-transparent via-white/10 to-transparent lg:block" />
        {STAGES.map((stage, i) => (
          <motion.div
            key={stage.label}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
            className="relative flex flex-col items-center text-center"
          >
            <div className="relative z-10 flex h-[76px] w-[76px] items-center justify-center rounded-2xl border border-white/10 bg-[#111111] shadow-premium">
              <motion.div
                className="absolute inset-0 rounded-2xl border border-white/20"
                animate={{ opacity: [0.15, 0.4, 0.15] }}
                transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.3 }}
              />
              <stage.icon className="h-6 w-6 text-white/80" strokeWidth={1.5} />
            </div>
            <p className="mt-3 text-xs font-medium text-white/85">{stage.label}</p>
            <p className="mt-1 text-[11px] leading-snug text-white/35">{stage.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
