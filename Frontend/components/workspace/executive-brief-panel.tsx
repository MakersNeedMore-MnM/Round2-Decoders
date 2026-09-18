"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScoreRing } from "@/components/common/score-ring";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GuardrailVerdict } from "@/components/workspace/guardrail-verdict";
import { accountsService } from "@/services/accounts.service";
import { fetchWithCache, getCached } from "@/lib/data-cache";
import type { Company } from "@/types";
import type { OverallAssessment, KnowledgeData } from "@/services/workspace.service";

interface ExecutiveBriefPanelProps {
  assessment: OverallAssessment | null;
  knowledge: KnowledgeData | null;
  /** Raw guardrail agent output (unsupported_claims, supported_claims, confidence, reasoning). */
  guardrail?: Record<string, unknown> | null;
}

export function ExecutiveBriefPanel({ assessment, knowledge, guardrail }: ExecutiveBriefPanelProps) {
  if (!assessment) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-[15px]">Executive Brief</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-[14px] leading-relaxed text-white/40">
            No analysis yet. Send a company brief or notes in the chat and the executive summary will
            appear here once the pipeline finishes.
          </p>
        </CardContent>
      </Card>
    );
  }

  const score = Math.round((assessment.intent_score ?? 0) * (assessment.intent_score <= 1 ? 100 : 1));
  const unsupportedClaims = (guardrail?.unsupported_claims as string[] | undefined) ?? [];
  const supportedClaims = (guardrail?.supported_claims as string[] | undefined) ?? [];
  const guardrailConfidence = guardrail?.confidence as number | undefined;
  const guardrailReasoning = guardrail?.reasoning as string | undefined;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-[15px]">
            Executive Brief — {assessment.company || knowledge?.company || "Unknown"}
          </CardTitle>
          <ScoreRing score={score} size={54} label="" />
        </CardHeader>
        <CardContent className="space-y-3.5">
          <p className="text-[14px] leading-relaxed text-white/55">
            {assessment.overall_recommendation || "No recommendation returned by the guardrail agent."}
          </p>
          <div className="flex flex-wrap gap-2">
            {assessment.risk_level && (
              <Badge variant={assessment.risk_level.toLowerCase() === "high" ? "danger" : "outline"}>
                {assessment.risk_level} risk
              </Badge>
            )}
            {assessment.approved ? (
              <Badge variant="success">Approved</Badge>
            ) : (
              <Badge variant="danger">Needs review</Badge>
            )}
            {assessment.buying_stage && <Badge variant="outline">{assessment.buying_stage}</Badge>}
            {assessment.decision_maker && <Badge variant="outline">{assessment.decision_maker}</Badge>}
          </div>
          {assessment.next_action && (
            <p className="text-[13px] text-white/45">
              Next action: <span className="text-white/75">{assessment.next_action}</span>
            </p>
          )}
        </CardContent>
      </Card>

      <GuardrailVerdict
        approved={assessment.approved}
        riskLevel={assessment.risk_level}
        unsupportedClaims={unsupportedClaims}
        supportedClaims={supportedClaims}
        confidence={guardrailConfidence}
        reasoning={guardrailReasoning}
      />
    </div>
  );
}

const SESSIONS_CACHE_KEY = "workspace:recent-sessions";

export function HistorySidebar({
  onSelectCompany,
  activeCompanyId,
}: {
  onSelectCompany?: (companyId: string) => void;
  activeCompanyId?: string | null;
}) {
  const [companies, setCompanies] = useState<Company[]>(
    () => getCached<Company[]>(SESSIONS_CACHE_KEY) ?? [],
  );
  const [loading, setLoading] = useState(
    () => getCached<Company[]>(SESSIONS_CACHE_KEY) === undefined,
  );

  useEffect(() => {
    let cancelled = false;

    fetchWithCache(SESSIONS_CACHE_KEY, () => accountsService.list(), {
      onRevalidate: (fresh) => {
        if (!cancelled) setCompanies(fresh);
      },
    })
      .then((data) => {
        if (!cancelled) setCompanies(data);
      })
      .catch(() => {
        // Keep the sidebar empty rather than surfacing an error here —
        // it's a secondary panel, not the primary action on this page.
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Card className="flex h-full min-h-0 flex-col">
      <CardHeader>
        <CardTitle className="text-[15px]">Recent Sessions</CardTitle>
      </CardHeader>
      <ScrollArea className="min-h-0 flex-1 px-2 pb-4">
        <div className="space-y-1 px-3">
          {loading && <p className="px-2 py-2 text-[13px] text-white/30">Loading…</p>}

          {!loading && companies.length === 0 && (
            <p className="px-2 py-2 text-[13px] leading-relaxed text-white/30">
              Nothing analyzed yet — send a brief in the chat to start your first session.
            </p>
          )}

          {companies.map((company) => (
            <button
              key={company.id}
              type="button"
              onClick={() => onSelectCompany?.(company.id)}
              className={`flex w-full items-center justify-between rounded-lg px-2 py-2.5 text-left text-[13.5px] transition-colors ${
                activeCompanyId === company.id
                  ? "bg-white/[0.06] text-white/85"
                  : "text-white/45 hover:bg-white/[0.04] hover:text-white/80"
              }`}
            >
              <span className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white/[0.06] text-[10px] text-white/60">
                  {company.logoInitial}
                </span>
                <span className="font-semibold">{company.name}</span>
              </span>
              <span className="text-[11px] font-semibold text-white/25">{company.score}</span>
            </button>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
}