import { apiFetch, API_BASE_URL, ApiError, getToken } from "./api-client";

export interface KnowledgeData {
  company?: string;
  website?: string;
  industry?: string;
  decision_makers?: string[];
  [key: string]: unknown;
}

export interface TimelineEntry {
  step: number;
  agent: string;
  status: string;
  duration_ms: number;
}

export interface OverallAssessment {
  company: string;
  decision_maker: string;
  intent_score: number;
  buying_stage: string;
  priority: string;
  risk_level: string;
  approved: boolean;
  next_action: string;
  overall_recommendation: string;
}

export interface ExecutionMetrics {
  total_time_ms: number;
  agents_executed: number;
  knowledge_saved: boolean;
}

export interface AnalyzeResponse {
  analysis_id: number;
  company_id: number;
  overall_assessment: OverallAssessment;
  knowledge_id: number;
  knowledge: KnowledgeData;
  persona: Record<string, unknown>;
  intent: Record<string, unknown>;
  strategy: Record<string, unknown>;
  guardrail: Record<string, unknown>;
  timeline: TimelineEntry[];
  execution: ExecutionMetrics;
}

export interface WorkspaceCompanySummary {
  company_id: number;
  company: string;
  website: string;
  industry: string;
  total_analyses: number;
  last_analysis: string;
  latest_intent: number;
  priority: string;
}

export interface CompanyDashboardCompany {
  id: number;
  name: string;
  website: string;
  industry: string;
}

export interface CompanyDashboard {
  company: CompanyDashboardCompany;
  summary: string;
  health_score: number;
  latest_intent_score: number;
  priority: string;
  buying_stage: string;
  risk_level: string;
  decision_maker: string;
  recommended_action: string;
  communication_style: string;
  confidence: number;
  analyses_count: number;
  latest_analysis: {
    analysis_id: number;
    created_at: string;
  };
}

/**
 * The backend returns 200 with an { error: "..." } body instead of a 404
 * for missing companies, so callers need to check for that shape rather
 * than relying on apiFetch to throw.
 */
export interface CompanyDashboardError {
  error: string;
}

/** Shape returned when the Supervisor routed to the sales_analysis agent. */
export interface SalesAnalysisAgentResult {
  agent: "sales_analysis";
  response: AnalyzeResponse;
}

/** Shape returned when the Supervisor routed to the research agent. */
export interface ResearchAgentResult {
  agent: "research";
  tool_used: string | null;
  response: { content?: string } | Record<string, unknown>;
  search_results?: Record<string, unknown>;
}

export interface SupervisorMemoryEntry {
  role: "user" | "assistant";
  content: string;
}

export interface SupervisorResponse {
  task: string;
  plan: unknown;
  agent: "sales_analysis" | "research";
  result: SalesAnalysisAgentResult | ResearchAgentResult;
  memory: SupervisorMemoryEntry[];
}

export interface StakeholderApiResult {
  id: string;
  name: string;
  title: string;
  dept: string;
  influence: "Decision Maker" | "Champion" | "Budget Holder" | "Influencer" | "Blocker";
  score: number;
  linkedin: boolean;
  email: string;
  companyId: string;
  evidence: string[];
  painPoints: string[];
  buyingSignals: string[];
}

export interface PainPointApiResult {
  id: string;
  title: string;
  severity: "critical" | "high" | "medium" | "low";
  confidence: number;
  sources: number;
  excerpt: string;
  companyId: string;
}

export interface BuyingSignalApiResult {
  id: string;
  title: string;
  strength: "strong" | "moderate" | "weak";
  detectedAt: string;
  source: string;
}

export interface GraphNodeApiResult {
  id: string;
  name: string;
  title: string;
  influence: "Decision Maker" | "Champion" | "Budget Holder" | "Influencer" | "Blocker";
  confidence: number;
  evidence: string[];
  painPoints: string[];
  buyingSignals: string[];
}

export interface GraphEdgeApiResult {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export interface CompanyGraphResponse {
  nodes: GraphNodeApiResult[];
  edges: GraphEdgeApiResult[];
}

export interface ResearchStatusSliceApiResult {
  status: "analyzed" | "in-review" | "queued";
  count: number;
}

export interface PainPointsByIndustryApiResult {
  industry: string;
  count: number;
}

export interface ResearchActivityApiResult {
  date: string;
  analyses: number;
}

export interface TrustDistributionApiResult {
  bucket: string;
  count: number;
}

export interface WorkspaceStats {
  total_accounts: number;
  new_accounts_this_week: number;
  avg_trust_score: number;
  trust_score_delta: number | null;
  guardrail_catches: number;
  guardrail_catches_this_week: number;
  stakeholders_mapped: number;
  research_status: ResearchStatusSliceApiResult[];
  pain_points_by_industry: PainPointsByIndustryApiResult[];
  research_activity: ResearchActivityApiResult[];
  trust_distribution: TrustDistributionApiResult[];
}

/** One live orchestration frame from GET /executor/stream. */
export interface StreamStepEvent {
  id: string;
  label: string;
  status: "active" | "done" | "error";
  agent?: string;
  detail?: string;
}

export type StreamFrame =
  | { type: "step"; data: StreamStepEvent }
  | { type: "final"; data: SupervisorResponse }
  | { type: "error"; data: { message: string } };

export const workspaceService = {
  /**
   * Sends free-form text to the Supervisor, which plans the task, routes
   * it to the right agent (the sales-analysis pipeline for company
   * briefs/notes, or the research agent for general questions), and
   * returns whichever result that agent produced.
   *
   * This is the blocking version — prefer streamSupervisor() for the
   * Workspace chat so the person sees each agent's real progress live
   * instead of waiting on one request.
   */
  async runSupervisor(prompt: string): Promise<SupervisorResponse> {
    return apiFetch<SupervisorResponse>(
      `/supervisor/execute?prompt=${encodeURIComponent(prompt)}`,
      { method: "POST" },
    );
  },

  /**
   * Live version of runSupervisor(): opens GET /executor/stream and
   * calls `onFrame` for every Server-Sent Event the backend emits as
   * Planner -> Router -> Research/Sales-Analysis pipeline actually runs
   * (real emit_step() calls from the agents themselves, not a scripted
   * client-side animation). Resolves once the stream ends (after the
   * "final" or "error" frame).
   */
  async streamSupervisor(
    prompt: string,
    onFrame: (frame: StreamFrame) => void,
    signal?: AbortSignal,
  ): Promise<void> {
    const token = getToken();
    const headers: Record<string, string> = { Accept: "text/event-stream" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const response = await fetch(
      `${API_BASE_URL}/executor/stream?prompt=${encodeURIComponent(prompt)}`,
      { headers, signal },
    );

    if (!response.ok || !response.body) {
      const body = await response.text().catch(() => "");
      throw new ApiError(body || response.statusText, response.status);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      let boundary: number;
      while ((boundary = buffer.indexOf("\n\n")) !== -1) {
        const rawFrame = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 2);

        let eventType = "message";
        const dataLines: string[] = [];

        for (const line of rawFrame.split("\n")) {
          if (line.startsWith("event:")) eventType = line.slice(6).trim();
          else if (line.startsWith("data:")) dataLines.push(line.slice(5).trim());
        }

        if (dataLines.length === 0) continue;

        try {
          const data = JSON.parse(dataLines.join("\n"));
          onFrame({ type: eventType, data } as StreamFrame);
        } catch {
          // Malformed SSE frame — skip it rather than crash the stream.
        }
      }
    }
  },

  /**
   * Runs the full multi-agent pipeline (ingestion -> persona -> intent ->
   * strategy -> guardrail) against free-form text and returns the
   * executive summary + full agent outputs.
   *
   * Kept for any code that still needs to call the pipeline directly;
   * the workspace chat now goes through runSupervisor() instead so the
   * Supervisor/Router decide what runs.
   */
  async analyze(text: string): Promise<AnalyzeResponse> {
    return apiFetch<AnalyzeResponse>(
      `/assistant/analyze?text=${encodeURIComponent(text)}`,
      { method: "POST" },
    );
  },

  /** Every company the current user has run an analysis against. */
  async listCompanies(): Promise<WorkspaceCompanySummary[]> {
    return apiFetch<WorkspaceCompanySummary[]>("/workspace/");
  },

  /** Deletes all of this user's research (analyses, drafts, knowledge) for a company. */
  async deleteCompany(companyId: number | string): Promise<{ success: boolean; message: string }> {
    return apiFetch<{ success: boolean; message: string }>(
      `/workspace/company/${companyId}`,
      { method: "DELETE" },
    );
  },
  
  async getStats(): Promise<WorkspaceStats> {
    return apiFetch<WorkspaceStats>("/workspace/stats");
  },

  /** Full rollup for one company: latest intent/persona/strategy/guardrail. */
  async getCompanyDashboard(
    companyId: number | string,
  ): Promise<CompanyDashboard | CompanyDashboardError> {
    return apiFetch<CompanyDashboard | CompanyDashboardError>(
      `/workspace/company/${companyId}/dashboard`,
    );
  },

  /** Stakeholders derived from the company's most recent extracted knowledge. */
  async getStakeholders(companyId: number | string): Promise<StakeholderApiResult[]> {
    return apiFetch<StakeholderApiResult[]>(`/workspace/company/${companyId}/stakeholders`);
  },

  /** Pain points derived from the company's most recent extracted knowledge. */
  async getPainPoints(companyId: number | string): Promise<PainPointApiResult[]> {
    return apiFetch<PainPointApiResult[]>(`/workspace/company/${companyId}/pain-points`);
  },

  /** Buying signals derived from the company's most recent extracted knowledge. */
  async getBuyingSignals(companyId: number | string): Promise<BuyingSignalApiResult[]> {
    return apiFetch<BuyingSignalApiResult[]>(`/workspace/company/${companyId}/buying-signals`);
  },

  /** Relationship graph (nodes + edges) for the Relationship Graph screen. */
  async getGraph(companyId: number | string): Promise<CompanyGraphResponse> {
    return apiFetch<CompanyGraphResponse>(`/workspace/company/${companyId}/graph`);
  },

  /** Recent analysis history for the current user. */
  async getAnalysisHistory(): Promise<any[]> {
    return apiFetch<any[]>("/analysis/history");
  },

  async getAnalysis(id: number): Promise<AnalyzeResponse> {
    return apiFetch<AnalyzeResponse>(`/analysis/${id}`);
  },
};