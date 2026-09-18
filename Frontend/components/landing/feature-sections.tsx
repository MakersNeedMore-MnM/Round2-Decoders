"use client";

import { motion } from "framer-motion";
import { Database, Fingerprint, ShieldCheck, GitBranch, Gauge, Lock } from "lucide-react";
import { Card } from "@/components/ui/card";

const FEATURES = [
  { icon: Database, title: "Multi-source grounding", desc: "CRM records, call transcripts, and public sources merge into one structured account view." },
  { icon: Fingerprint, title: "Stakeholder intelligence", desc: "Roles, influence, and buying signals mapped automatically per account." },
  { icon: ShieldCheck, title: "Guardrailed generation", desc: "Every draft is checked against source evidence before it reaches a human." },
  { icon: GitBranch, title: "Multi-agent orchestration", desc: "Research, persona, intent, and strategy agents hand off work in sequence." },
  { icon: Gauge, title: "Confidence scoring", desc: "Every recommendation ships with a transparent trust score, not a black box." },
  { icon: Lock, title: "Human-in-the-loop", desc: "Nothing reaches a prospect without explicit approval from your team." },
];

export function FeatureSections() {
  return (
    <section id="platform" className="relative mx-auto max-w-6xl px-6 py-28">
      <div className="mb-14 text-center">
        <p className="text-xs uppercase tracking-widest text-white/35">Platform</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Built for revenue teams who need to trust the machine.
        </h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature, i) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.4, delay: i * 0.06 }}
          >
            <Card className="h-full p-6 hover:border-white/15 hover:bg-white/[0.015] transition-colors">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03]">
                <feature.icon className="h-5 w-5 text-white/75" strokeWidth={1.5} />
              </div>
              <h3 className="text-sm font-semibold text-white">{feature.title}</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-white/40">{feature.desc}</p>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
