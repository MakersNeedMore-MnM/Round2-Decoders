"use client";

import { motion } from "framer-motion";
import { Check, X } from "lucide-react";

const ROWS = [
  { feature: "Account data", crm: "Static fields, manually updated", iq: "Continuously synthesized from live sources" },
  { feature: "Personalization", crm: "Mail-merge tokens", iq: "Evidence-grounded, per-stakeholder reasoning" },
  { feature: "Hallucination risk", crm: "No safeguard", iq: "Guardrail agent blocks unsupported claims" },
  { feature: "Explainability", crm: "None — output is opaque", iq: "Every claim traces to a source" },
  { feature: "Send control", crm: "Auto-send or manual only", iq: "Confidence-scored human approval queue" },
];

export function ComparisonSection() {
  return (
    <section id="comparison" className="relative mx-auto max-w-4xl px-6 py-28">
      <div className="mb-12 text-center">
        <p className="text-xs uppercase tracking-widest text-white/35">Why ProspectIQ</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Not another AI email generator.
        </h2>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="overflow-hidden rounded-2xl border border-white/8 bg-[#111111]"
      >
        <div className="grid grid-cols-3 border-b border-white/8 bg-white/[0.02] text-[11px] uppercase tracking-widest text-white/35">
          <div className="p-4">Capability</div>
          <div className="p-4">Traditional CRM tooling</div>
          <div className="p-4 text-white/70">ProspectIQ</div>
        </div>
        {ROWS.map((row, i) => (
          <div
            key={row.feature}
            className={`grid grid-cols-3 text-sm ${i !== ROWS.length - 1 ? "border-b border-white/6" : ""}`}
          >
            <div className="p-4 font-medium text-white/80">{row.feature}</div>
            <div className="flex items-start gap-2 p-4 text-white/35">
              <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/20" />
              {row.crm}
            </div>
            <div className="flex items-start gap-2 p-4 text-white/85">
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
              {row.iq}
            </div>
          </div>
        ))}
      </motion.div>
    </section>
  );
}
