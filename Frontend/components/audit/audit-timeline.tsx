"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  ChevronDown,
  Globe,
  Users,
  Brain,
  ShieldAlert,
  ListChecks,
  GitBranch,
  Sparkles,
  Database,
  Search,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { AuditEvent } from "@/types";
import { cn } from "@/lib/utils";
import AuditAgentRenderer from "./cards/AuditAgentRenderer";

const AGENT_ICON: Record<string, React.ElementType> = {
  Orchestrator: GitBranch,
  "Research Agent": Search,
  ResearchAgent: Search,
  WebCrawler: Globe,
  "Knowledge Ingestion": Database,
  KnowledgeIngestion: Database,
  "Knowledge Repository": Database,
  "Persona Agent": Users,
  PersonaAgent: Users,
  "Intent Agent": Brain,
  IntentAgent: Brain,
  "Strategy Agent": Sparkles,
  StrategyAgent: Sparkles,
  StrategyAI: Sparkles,
  "Guardrail Agent": ShieldAlert,
  GuardrailAgent: ShieldAlert,
  QueueManager: ListChecks,
};

export function AuditTimeline({
  events,
  analysis,
}: {
  events: AuditEvent[];
  analysis: any;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(
    events[0]?.id ?? null
  );

  return (
    <div className="relative pl-8">
      <div className="absolute left-[15px] top-2 bottom-2 w-px bg-white/10" />
      <div className="space-y-4">
        {events.map((event, i) => {
          const Icon = AGENT_ICON[event.agent] ?? GitBranch;
          const isOpen = expandedId === event.id;

          return (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="relative"
            >
              <div
                className={cn(
                  "absolute -left-8 top-3.5 flex h-8 w-8 items-center justify-center rounded-full border bg-[#111111] shadow-md",
                  event.status === "success" && "border-emerald-500/40 text-emerald-400 bg-emerald-950/20",
                  event.status === "warning" && "border-amber-500/40 text-amber-400 bg-amber-950/20",
                  event.status === "info" && "border-cyan-500/40 text-cyan-400 bg-cyan-950/20"
                )}
              >
                <Icon className="h-4 w-4" />
              </div>

              <Card
                className={cn(
                  "cursor-pointer overflow-hidden border transition-all duration-200",
                  isOpen
                    ? "border-white/20 bg-white/[0.04] shadow-xl"
                    : "border-white/8 bg-white/[0.015] hover:border-white/15 hover:bg-white/[0.03]"
                )}
                onClick={() => setExpandedId(isOpen ? null : event.id)}
              >
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-sm font-semibold text-white tracking-wide">
                      {event.agent}
                    </span>

                    <Badge
                      variant={
                        event.status === "success"
                          ? "success"
                          : event.status === "warning"
                          ? "warning"
                          : "outline"
                      }
                      className="text-[10px]"
                    >
                      {event.status === "success"
                        ? "Completed"
                        : event.status === "warning"
                        ? "Flagged"
                        : "Executed"}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs font-mono text-white/40">{event.time}</span>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 text-white/40 transition-transform duration-200",
                        isOpen && "rotate-180 text-white"
                      )}
                    />
                  </div>
                </div>

                {event.detail && (
                  <div className="px-4 pb-3 -mt-1 text-xs text-white/50 leading-relaxed">
                    {event.detail}
                  </div>
                )}

                {isOpen && (
                  <div className="border-t border-white/8 p-4 bg-black/20">
                    <AuditAgentRenderer
                      agent={event.agent}
                      analysis={analysis}
                      event={event}
                    />
                  </div>
                )}
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
