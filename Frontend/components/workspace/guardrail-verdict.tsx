"use client";

import { motion } from "framer-motion";
import { ShieldCheck, ShieldAlert, ArrowDown, XCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface GuardrailVerdictProps {
  approved?: boolean;
  riskLevel?: string;
  unsupportedClaims?: string[];
  supportedClaims?: string[];
  confidence?: number;
  reasoning?: string;
  /** Compact mode drops the step-by-step flow for tight spaces (e.g. inline chat card). */
  compact?: boolean;
}

export function GuardrailVerdict({
  approved,
  riskLevel,
  unsupportedClaims = [],
  supportedClaims = [],
  confidence,
  reasoning,
  compact = false,
}: GuardrailVerdictProps) {
  // No guardrail data yet — nothing to show.
  if (approved === undefined && riskLevel === undefined && unsupportedClaims.length === 0) {
    return null;
  }

  const isHighRisk = (riskLevel ?? "").toLowerCase() === "high";
  const blocked = approved === false;

  if (blocked) {
    return (
      <div
        className={cn(
          "rounded-2xl border-2 border-red-500/40 bg-red-500/[0.07] p-4",
          compact ? "space-y-2.5" : "space-y-3",
        )}
      >
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 shrink-0 text-red-400" />
          <span className="text-[12px] font-bold uppercase tracking-wider text-red-400">
            Guardrail Verification
          </span>
        </div>

        {!compact && (
          <div className="flex flex-col items-start gap-1 pl-0.5">
            <FlowLine text="AI Strategy" />
            <FlowArrow />
            <FlowLine text="Unsupported claim detected" tone="warn" />
            <FlowArrow />
            <FlowLine
              text={`Source evidence: ${unsupportedClaims.length > 0 ? "Not found" : "Insufficient"}`}
              tone="warn"
            />
            <FlowArrow />
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <motion.span
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/40 bg-red-500/15 px-2.5 py-1 text-[13px] font-bold text-red-400"
          >
            RISK: {(riskLevel || "HIGH").toUpperCase()}
          </motion.span>
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2.5">
          <XCircle className="h-5 w-5 shrink-0 text-red-400" />
          <span className="text-[14px] font-extrabold tracking-tight text-red-300">
            BLOCKED — HUMAN REVIEW REQUIRED
          </span>
        </div>

        {unsupportedClaims.length > 0 && (
          <ul className="space-y-1 pl-0.5">
            {unsupportedClaims.slice(0, compact ? 2 : 5).map((claim, i) => (
              <li key={i} className="flex gap-2 text-[12.5px] leading-relaxed text-white/55">
                <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-red-400" />
                <span>{claim}</span>
              </li>
            ))}
          </ul>
        )}

        {reasoning && !compact && (
          <p className="border-t border-red-500/15 pt-2.5 text-[12px] leading-relaxed text-white/40">{reasoning}</p>
        )}
      </div>
    );
  }

  // Approved / verified state — calm and confident, not alarming.
  return (
    <div
      className={cn(
        "rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.05] p-4",
        compact ? "space-y-2" : "space-y-2.5",
      )}
    >
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-400" />
        <span className="text-[12px] font-bold uppercase tracking-wider text-emerald-400">
          Guardrail Verified
        </span>
      </div>

      <div className="flex items-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-2.5">
        <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
        <span className="text-[14px] font-bold tracking-tight text-emerald-300">
          All claims supported — approved for outreach
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-0.5">
        {riskLevel && (
          <span
            className={cn(
              "rounded-lg border px-2 py-0.5 text-[11px] font-semibold",
              isHighRisk
                ? "border-red-500/30 bg-red-500/10 text-red-400"
                : "border-emerald-500/25 bg-emerald-500/10 text-emerald-400",
            )}
          >
            Risk: {riskLevel}
          </span>
        )}
        {typeof confidence === "number" && (
          <span className="text-[11px] text-white/35">{Math.round(confidence)}% confidence</span>
        )}
        {supportedClaims.length > 0 && (
          <span className="text-[11px] text-white/35">{supportedClaims.length} claims verified</span>
        )}
      </div>
    </div>
  );
}

function FlowLine({ text, tone = "default" }: { text: string; tone?: "default" | "warn" }) {
  return (
    <span
      className={cn(
        "text-[13px] font-semibold",
        tone === "warn" ? "text-amber-400" : "text-white/70",
      )}
    >
      {text}
    </span>
  );
}

function FlowArrow() {
  return <ArrowDown className="h-3.5 w-3.5 text-white/20" />;
}
