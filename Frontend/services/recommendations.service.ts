import { apiFetch } from "./api-client";
import type { Recommendation, StrategyOption, OutreachPurposeOption, PurposeStrategy } from "@/types";


interface StrategyOptionApi {
  key: string;
  name: string;
  description: string;
  recommended: boolean;
}

interface PurposeStrategyApi {
  purpose: string;
  purpose_label?: string;
  insufficient_evidence: boolean;
  message?: string;
  name?: string;
  description?: string;
}

interface RecommendationApiResult {
  analysis_id: number;
  company_id: number;
  company: string;
  website: string;
  industry: string;
  score: number;
  priority: string;
  intent: number;
  intent_score: number;
  intent_level: "HIGH" | "MEDIUM" | "LOW";
  buying_stage: string;
  risk_level: string;
  decision_maker: string;
  confidence: number;
  knowledge_confidence: number;
  next_action: string;
  reason: string[];
  why_this_recommendation: string;
  strategy_options: StrategyOptionApi[];
  recommended_strategy: StrategyOptionApi | null;
  pain_points: string[];
  buying_signals: string[];
  evidence: Array<{ title: string; url: string }>;
  evidence_sufficient: boolean;
  available_purposes: OutreachPurposeOption[];
  purpose_strategy: PurposeStrategyApi | null;
  created_at: string;
}

function toRecommendation(raw: RecommendationApiResult): Recommendation {
  return {
    analysisId: String(raw.analysis_id),
    companyId: String(raw.company_id),
    company: raw.company,
    website: raw.website || "",
    industry: raw.industry || "",
    score: raw.score ?? 0,
    priority: raw.priority || "",
    intent: raw.intent ?? 0,
    intentScore: raw.intent_score ?? raw.intent ?? 0,
    intentLevel: raw.intent_level || "LOW",
    buyingStage: raw.buying_stage || "",
    riskLevel: raw.risk_level || "",
    decisionMaker: raw.decision_maker || "",
    confidence: raw.confidence ?? 0,
    knowledgeConfidence: raw.knowledge_confidence ?? 0,
    nextAction: raw.next_action || "",
    reasons: raw.reason || [],
    whyThisRecommendation: raw.why_this_recommendation || "",
    strategyOptions: (raw.strategy_options || []) as StrategyOption[],
    recommendedStrategy: (raw.recommended_strategy as StrategyOption | null) ?? null,
    painPoints: raw.pain_points || [],
    buyingSignals: raw.buying_signals || [],
    evidence: raw.evidence || [],
    evidenceSufficient: raw.evidence_sufficient ?? false,
    availablePurposes: raw.available_purposes || [],
    purposeStrategy: raw.purpose_strategy
      ? ({
          purpose: raw.purpose_strategy.purpose,
          purposeLabel: raw.purpose_strategy.purpose_label,
          insufficientEvidence: raw.purpose_strategy.insufficient_evidence,
          message: raw.purpose_strategy.message,
          name: raw.purpose_strategy.name,
          description: raw.purpose_strategy.description,
        } as PurposeStrategy)
      : null,
    createdAt: raw.created_at,
  };
}

export const recommendationsService = {
 
  async list(companyId?: string | number, purpose?: string): Promise<Recommendation[]> {
    const params = new URLSearchParams();
    if (companyId) params.set("company_id", String(companyId));
    if (purpose) params.set("purpose", purpose);
    const qs = params.toString() ? `?${params.toString()}` : "";
    const data = await apiFetch<{ recommended_companies: RecommendationApiResult[] }>(
      `/workspace/recommendations${qs}`,
    );
    return (data.recommended_companies || []).map(toRecommendation);
  },
};
