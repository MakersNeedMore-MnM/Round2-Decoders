"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, Loader2, ArrowRight, Check, ExternalLink, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScoreRing } from "@/components/common/score-ring";
import { workspaceService } from "@/services/workspace.service";
import { queueService } from "@/services/queue.service";
import { recommendationsService } from "@/services/recommendations.service";
import { ApiError } from "@/services/api-client";
import type { Recommendation, Stakeholder, PurposeStrategy } from "@/types";
import { cn } from "@/lib/utils";

const PRIORITY_VARIANT: Record<string, "success" | "warning" | "danger" | "outline"> = {
  High: "danger",
  Medium: "warning",
  Low: "outline",
};

const INTENT_LEVEL_VARIANT: Record<string, "success" | "warning" | "outline"> = {
  HIGH: "success",
  MEDIUM: "warning",
  LOW: "outline",
};

export function RecommendationCard({
  recommendation,
  onExecuted,
}: {
  recommendation: Recommendation;
  onExecuted?: (companyId: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [stakeholders, setStakeholders] = useState<Stakeholder[] | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  const [executing, setExecuting] = useState(false);
  const [executed, setExecuted] = useState(false);
  const [executeError, setExecuteError] = useState<string | null>(null);

  // First applicable purpose is the account's real, evidence-backed
  // default (backend orders it that way) — everything else is an
  // equally valid alternative the user can switch to before approving.
  const recommendedPurpose = recommendation.availablePurposes[0];
  const otherPurposes = recommendation.availablePurposes.slice(1);

  // The purpose the user has selected — nothing is generated until they
  // confirm it via "Approve & Generate Draft". Defaults to the
  // recommended purpose so approving immediately still works.
  const [selectedPurpose, setSelectedPurpose] = useState<string | undefined>(
    recommendedPurpose?.key,
  );
  const [strategyByPurpose, setStrategyByPurpose] = useState<Record<string, PurposeStrategy | null>>(
    recommendation.purposeStrategy && recommendedPurpose
      ? { [recommendedPurpose.key]: recommendation.purposeStrategy }
      : {},
  );
  const [loadingPurpose, setLoadingPurpose] = useState(false);

  async function loadPurposeStrategy(key: string) {
    setLoadingPurpose(true);
    try {
      const [updated] = await recommendationsService.list(recommendation.companyId, key);
      setStrategyByPurpose((prev) => ({ ...prev, [key]: updated?.purposeStrategy ?? null }));
    } catch {
      setStrategyByPurpose((prev) => ({
        ...prev,
        [key]: {
          purpose: key,
          insufficientEvidence: true,
          message: "Could not load this outreach type — try again.",
        },
      }));
    } finally {
      setLoadingPurpose(false);
    }
  }

  async function handleSelectPurpose(key: string) {
    setSelectedPurpose(key);
    if (strategyByPurpose[key] === undefined) {
      await loadPurposeStrategy(key);
    }
  }

  async function handleExpand() {
    const next = !expanded;
    setExpanded(next);

    if (next && stakeholders === null && !loadingDetails) {
      setLoadingDetails(true);
      setDetailsError(null);
      try {
        const data = await workspaceService.getStakeholders(recommendation.companyId);
        setStakeholders(data as Stakeholder[]);
      } catch (err) {
        setDetailsError(
          err instanceof ApiError
            ? err.message || "Could not load supporting evidence."
            : "Could not reach the backend.",
        );
      } finally {
        setLoadingDetails(false);
      }
    }

    // Lazy-load the recommended purpose's strategy the first time the
    // card is expanded, so the selector isn't empty on first look.
    if (next && recommendedPurpose && strategyByPurpose[recommendedPurpose.key] === undefined) {
      loadPurposeStrategy(recommendedPurpose.key);
    }
  }

  async function handleExecute() {
    setExecuting(true);
    setExecuteError(null);
    try {
      await queueService.generate(recommendation.analysisId, selectedPurpose);
      setExecuted(true);
      onExecuted?.(recommendation.companyId);
    } catch (err) {
      setExecuteError(
        err instanceof ApiError
          ? err.message || "Could not create an outreach draft."
          : "Could not reach the backend.",
      );
    } finally {
      setExecuting(false);
    }
  }

  return (
    <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="overflow-hidden">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-medium text-white/90">{recommendation.company}</h3>
              <Badge variant={INTENT_LEVEL_VARIANT[recommendation.intentLevel] ?? "outline"}>
                {recommendation.intentLevel} INTENT — {recommendation.intentScore}/100
              </Badge>
              {recommendation.priority && (
                <Badge variant={PRIORITY_VARIANT[recommendation.priority] ?? "outline"}>
                  {recommendation.priority} Priority
                </Badge>
              )}
              {recommendation.buyingStage && <Badge variant="outline">{recommendation.buyingStage}</Badge>}
            </div>

            <p className="text-[13px] leading-relaxed text-white/60">
              {recommendation.whyThisRecommendation ||
                recommendation.nextAction ||
                "No recommended action available for this account yet."}
            </p>

            {/* Compact indicator only — the full selector lives in the expanded panel below. */}
            {recommendedPurpose && (
              <p className="flex items-center gap-1.5 pt-0.5 text-[11px] text-white/35">
                <span className="text-white/25">Recommended purpose:</span>
                <span className="text-white/60">
                  {recommendation.availablePurposes.find((p) => p.key === selectedPurpose)?.label ??
                    recommendedPurpose.label}
                </span>
              </p>
            )}

            {!recommendation.evidenceSufficient && (
              <div className="flex items-start gap-1.5 text-[12px] text-amber-400/90">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>Limited evidence found for this account — treat this recommendation cautiously.</span>
              </div>
            )}

            {recommendation.reasons.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {recommendation.reasons.map((r) => (
                  <span
                    key={r}
                    className="rounded-full border border-white/8 bg-white/[0.02] px-2.5 py-1 text-[11px] text-white/40"
                  >
                    {r}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-4">
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wider text-white/30">Confidence</p>
              <p className="text-lg font-semibold text-white/90">{recommendation.confidence}%</p>
            </div>

            {executed ? (
              <Badge variant="success">
                <Check className="h-3 w-3" /> Draft queued
              </Badge>
            ) : (
              <Button size="sm" onClick={handleExecute} disabled={executing}>
                {executing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                Approve &amp; Generate Draft
                {!executing && <ArrowRight className="h-3.5 w-3.5" />}
              </Button>
            )}

            <button
              onClick={handleExpand}
              className="rounded-lg border border-white/8 p-1.5 text-white/40 transition-colors hover:text-white/80"
              aria-label="Toggle details"
            >
              <ChevronDown className={cn("h-4 w-4 transition-transform", expanded && "rotate-180")} />
            </button>
          </div>
        </div>

        {executeError && (
          <p className="border-t border-white/6 px-5 py-2 text-[11px] text-red-400">{executeError}</p>
        )}

        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="border-t border-white/6 bg-white/[0.015] px-5 py-4"
          >
            {/* Outreach purpose selector — a choice, not an automatic action. Exactly
                one option is the AI's recommendation; the rest are equally valid
                alternatives given this account's real evidence. */}
            {recommendation.availablePurposes.length > 0 && recommendedPurpose && (
              <div className="mb-5">
                <p className="mb-2 text-[10px] uppercase tracking-wider text-white/30">
                  Outreach Purpose — select before approving
                </p>

                <div className="space-y-2">
                  <p className="text-[10px] uppercase tracking-wider text-white/25">Recommended</p>
                  <PurposeOptionCard
                    option={recommendedPurpose}
                    isSelected={selectedPurpose === recommendedPurpose.key}
                    strategy={strategyByPurpose[recommendedPurpose.key]}
                    loading={loadingPurpose && selectedPurpose === recommendedPurpose.key}
                    onSelect={() => handleSelectPurpose(recommendedPurpose.key)}
                    recommended
                  />
                </div>

                {otherPurposes.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="text-[10px] uppercase tracking-wider text-white/25">Other Valid Options</p>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {otherPurposes.map((option) => (
                        <PurposeOptionCard
                          key={option.key}
                          option={option}
                          isSelected={selectedPurpose === option.key}
                          strategy={strategyByPurpose[option.key]}
                          loading={loadingPurpose && selectedPurpose === option.key}
                          onSelect={() => handleSelectPurpose(option.key)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              <div>
                <p className="mb-2 text-[10px] uppercase tracking-wider text-white/30">Why AI Suggested This</p>
                <ul className="space-y-1.5 text-[12px] leading-relaxed text-white/55">
                  <li className="flex items-start gap-1.5">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-white/30" />
                    {recommendation.whyThisRecommendation}
                  </li>
                  {recommendation.reasons.map((r) => (
                    <li key={r} className="flex items-start gap-1.5">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-white/30" />
                      {r}
                    </li>
                  ))}
                  {recommendation.decisionMaker && (
                    <li className="flex items-start gap-1.5">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-white/30" />
                      Stakeholder: {recommendation.decisionMaker}
                    </li>
                  )}
                </ul>
              </div>

              <div>
                <p className="mb-2 text-[10px] uppercase tracking-wider text-white/30">Supporting Evidence</p>
                {!recommendation.evidenceSufficient && recommendation.evidence.length === 0 && (
                  <p className="text-[12px] text-white/30">
                    No source-level evidence extracted yet — evidence is insufficient for a strong claim.
                  </p>
                )}
                {recommendation.evidence.length > 0 && (
                  <ul className="space-y-1.5 text-[12px] leading-relaxed text-white/55">
                    {recommendation.evidence.slice(0, 5).map((e, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <ExternalLink className="mt-0.5 h-3 w-3 shrink-0 text-white/25" />
                        {e.url ? (
                          <a
                            href={e.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline decoration-white/20 underline-offset-2 hover:text-white/80 hover:decoration-white/40"
                          >
                            {e.title || e.url}
                          </a>
                        ) : (
                          <span>{e.title || "Untitled source"}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
                {recommendation.painPoints.length > 0 && (
                  <>
                    <p className="mb-1.5 mt-3 text-[10px] uppercase tracking-wider text-white/30">Pain Points</p>
                    <ul className="space-y-1 text-[12px] leading-relaxed text-white/55">
                      {recommendation.painPoints.slice(0, 3).map((p, i) => (
                        <li key={i}>· {p}</li>
                      ))}
                    </ul>
                  </>
                )}
              </div>

              <div>
                <p className="mb-2 text-[10px] uppercase tracking-wider text-white/30">Related Stakeholders</p>
                {loadingDetails && (
                  <div className="flex items-center gap-2 text-[12px] text-white/35">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading…
                  </div>
                )}
                {detailsError && <p className="text-[12px] text-red-400">{detailsError}</p>}
                {!loadingDetails && !detailsError && stakeholders?.length === 0 && (
                  <p className="text-[12px] text-white/30">No stakeholders extracted yet.</p>
                )}
                {!loadingDetails && stakeholders && stakeholders.length > 0 && (
                  <ul className="space-y-2">
                    {stakeholders.slice(0, 4).map((s) => (
                      <li key={s.id} className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-[12px] text-white/75">{s.name}</p>
                          <p className="truncate text-[11px] text-white/35">{s.title}</p>
                        </div>
                        <Badge variant="outline" className="shrink-0">
                          {s.influence}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-white/6 pt-3">
              <div className="flex items-center gap-3 text-[11px] text-white/30">
                <span>Risk: {recommendation.riskLevel || "—"}</span>
                <span>·</span>
                <span>Intent score: {recommendation.intentScore}</span>
                <span>·</span>
                <span>Overall score: {recommendation.score}/100</span>
              </div>
              <ScoreRing score={recommendation.confidence} size={44} label="" />
            </div>
          </motion.div>
        )}
      </Card>
    </motion.div>
  );
}

function PurposeOptionCard({
  option,
  isSelected,
  strategy,
  loading,
  onSelect,
  recommended = false,
}: {
  option: { key: string; label: string };
  isSelected: boolean;
  strategy: PurposeStrategy | null | undefined;
  loading: boolean;
  onSelect: () => void;
  recommended?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full rounded-lg border p-3 text-left transition-colors",
        isSelected
          ? "border-white/30 bg-white/[0.06]"
          : "border-white/8 bg-white/[0.015] hover:border-white/15",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-[12px] font-medium text-white/85">{option.label}</p>
        <div className="flex items-center gap-1.5">
          {recommended && (
            <Badge variant="outline" className="shrink-0 text-[10px]">
              AI pick
            </Badge>
          )}
          {isSelected && <Check className="h-3.5 w-3.5 shrink-0 text-white/50" />}
        </div>
      </div>

      {isSelected && (
        <div className="mt-1.5">
          {loading && (
            <p className="flex items-center gap-1.5 text-[11px] text-white/35">
              <Loader2 className="h-3 w-3 animate-spin" /> Matching strategy to this purpose…
            </p>
          )}
          {!loading && strategy?.insufficientEvidence && (
            <p className="flex items-start gap-1.5 text-[11px] text-amber-400/90">
              <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
              {strategy.message || "Insufficient evidence for this outreach type."}
            </p>
          )}
          {!loading && strategy && !strategy.insufficientEvidence && (
            <>
              <p className="text-[11px] font-semibold text-white/75">{strategy.name}</p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-white/50">{strategy.description}</p>
            </>
          )}
        </div>
      )}
    </button>
  );
}
