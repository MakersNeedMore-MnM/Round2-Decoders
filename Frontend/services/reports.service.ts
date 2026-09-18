import { apiFetch } from "./api-client";

export interface KnowledgeIngestResponse {
  id: number;
  status: string;
  data: Record<string, unknown>;
}

export interface PersonaResponse {
  primary_decision_maker: string;
  buyer_persona: string;
  decision_level: string;
  communication_style: string;
  key_interests: string[];
  recommended_approach: string;
}

export interface IntentResponse {
  intent_score: number;
  buying_stage: string;
  priority: string;
  confidence: number;
  positive_signals: string[];
  negative_signals: string[];
  recommended_next_action: string;
  reasoning: string;
}

/**
 * Mirrors today's backend surface: ingestion, persona analysis, and intent
 * analysis are three separate calls that must be chained by the client.
 * Once a single orchestrated endpoint exists (see review notes), replace
 * `runFullPipeline` with one call to it instead of three.
 */
export const reportsService = {
  async ingest(text: string): Promise<KnowledgeIngestResponse> {
    return apiFetch<KnowledgeIngestResponse>("/knowledge/ingest", {
      method: "POST",
      body: JSON.stringify({ text }),
    });
  },

  async analyzePersona(knowledgeId: number): Promise<PersonaResponse> {
    return apiFetch<PersonaResponse>(`/persona/analyze/${knowledgeId}`, {
      method: "POST",
    });
  },

  async analyzeIntent(knowledgeId: number): Promise<IntentResponse> {
    return apiFetch<IntentResponse>(`/intent/analyze/${knowledgeId}`, {
      method: "POST",
    });
  },

  async runFullPipeline(text: string) {
    const ingested = await this.ingest(text);
    const [persona, intent] = await Promise.all([
      this.analyzePersona(ingested.id),
      this.analyzeIntent(ingested.id),
    ]);
    return { ingested, persona, intent };
  },
};
