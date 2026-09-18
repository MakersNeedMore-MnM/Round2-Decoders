"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrustScoreCard, ConfidenceMeter, EvidenceList } from "@/components/report/trust-score-card";
import { StakeholderCard, PainPointCard } from "@/components/report/stakeholder-card";
import { accountsService } from "@/services/accounts.service";
import type { BuyingSignal, PainPoint, Stakeholder } from "@/types";
import {
  workspaceService,
  type CompanyDashboard,
  type CompanyDashboardError,
} from "@/services/workspace.service";
import { ApiError } from "@/services/api-client";

function isDashboardError(
  data: CompanyDashboard | CompanyDashboardError,
): data is CompanyDashboardError {
  return "error" in data;
}

export default function ExecutiveReportPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [dashboard, setDashboard] = useState<CompanyDashboard | null>(null);
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>([]);
  const [painPoints, setPainPoints] = useState<PainPoint[]>([]);
  const [buyingSignals, setBuyingSignals] = useState<BuyingSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFoundMsg, setNotFoundMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setNotFoundMsg(null);

    Promise.all([
      workspaceService.getCompanyDashboard(id),
      accountsService.getStakeholders(id).catch(() => []),
      accountsService.getPainPoints(id).catch(() => []),
      accountsService.getBuyingSignals(id).catch(() => []),
    ])
      .then(([dashboardData, stakeholderData, painPointData, buyingSignalData]) => {
        if (cancelled) return;
        if (isDashboardError(dashboardData)) {
          setNotFoundMsg(dashboardData.error);
          setDashboard(null);
        } else {
          setDashboard(dashboardData);
        }
        setStakeholders(stakeholderData);
        setPainPoints(painPointData);
        setBuyingSignals(buyingSignalData);
      })
      .catch((err) => {
        if (cancelled) return;
        setNotFoundMsg(
          err instanceof ApiError
            ? err.message || "Could not load this account."
            : "Could not reach the backend. Make sure the FastAPI server is running.",
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return <p className="px-2 py-6 text-sm text-white/40">Loading account…</p>;
  }

  if (notFoundMsg || !dashboard) {
    return (
      <div className="space-y-3 px-2 py-6">
        <h2 className="text-lg font-semibold text-white">Account not found</h2>
        <p className="text-sm text-white/40">
          {notFoundMsg || "This account doesn't exist or you don't have any analyses for it yet."}
        </p>
      </div>
    );
  }

  const evidence =
    stakeholders.flatMap((s) => s.evidence ?? []).slice(0, 6) ||
    [];

  const company = dashboard.company;
  const logoInitial = company.name?.[0]?.toUpperCase() ?? "?";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarFallback className="text-base">{logoInitial}</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-lg font-semibold text-white">{company.name}</h2>
            <p className="text-xs text-white/40">
              {company.industry || "Unknown industry"} · {company.website || "no website on file"}
            </p>
          </div>
        </div>
        <Badge variant="silver">Executive Report</Badge>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <TrustScoreCard score={Math.round(dashboard.health_score ?? 0)} />

        <Card>
          <CardHeader>
            <CardTitle>Confidence Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ConfidenceMeter label="Intent score" value={Math.round(dashboard.latest_intent_score ?? 0)} />
            <ConfidenceMeter label="Guardrail confidence" value={Math.round(dashboard.confidence ?? 0)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            <p className="text-[13px] leading-relaxed text-white/55">
              {dashboard.summary || "No account summary available yet."}
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {dashboard.priority && <Badge variant="outline">{dashboard.priority} priority</Badge>}
              {dashboard.buying_stage && <Badge variant="outline">{dashboard.buying_stage}</Badge>}
              {dashboard.risk_level && (
                <Badge variant={dashboard.risk_level.toLowerCase() === "high" ? "danger" : "outline"}>
                  {dashboard.risk_level} risk
                </Badge>
              )}
            </div>
            {dashboard.decision_maker && (
              <p className="text-xs text-white/40">
                Decision maker: <span className="text-white/70">{dashboard.decision_maker}</span>
              </p>
            )}
            {dashboard.recommended_action && (
              <p className="text-xs text-white/40">
                Next action: <span className="text-white/70">{dashboard.recommended_action}</span>
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-white/70">Stakeholders</h3>
          <div className="space-y-3">
            {stakeholders.length === 0 && (
              <p className="text-xs text-white/30">
                No stakeholders extracted yet — run this company&apos;s notes through the AI
                Workspace with named contacts to populate this section.
              </p>
            )}
            {stakeholders.map((s) => (
              <StakeholderCard key={s.id} stakeholder={s} />
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-white/70">Pain Points</h3>
          <div className="space-y-3">
            {painPoints.length === 0 && (
              <p className="text-xs text-white/30">
                No pain points extracted yet from this company&apos;s ingested knowledge.
              </p>
            )}
            {painPoints.map((p) => (
              <PainPointCard key={p.id} painPoint={p} />
            ))}
          </div>
        </div>
      </div>

      {evidence.length > 0 && <EvidenceList items={evidence} />}

      {buyingSignals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Buying Signals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {buyingSignals.map((signal, i) => (
              <div key={`${signal.title}-${i}`} className="rounded-lg border border-white/6 bg-white/[0.02] p-3">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-white/70">{signal.title}</span>
                  <Badge variant={signal.strength === "strong" ? "success" : "outline"}>{signal.strength}</Badge>
                </div>
                <p className="mt-1 text-[11px] text-white/30">
                  {signal.source} · {signal.detectedAt}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}