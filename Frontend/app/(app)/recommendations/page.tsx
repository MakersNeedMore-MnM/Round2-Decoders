"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { RecommendationCard } from "@/components/recommendations/recommendation-card";
import { recommendationsService } from "@/services/recommendations.service";
import { accountsService } from "@/services/accounts.service";
import { ApiError } from "@/services/api-client";
import { fetchWithCache, getCached } from "@/lib/data-cache";
import type { Company, Recommendation } from "@/types";

const COMPANIES_CACHE_KEY = "recommendations:companies";

function recCacheKey(company: string) {
  return `recommendations:list:${company}`;
}

export default function RecommendationsPage() {
  const [companies, setCompanies] = useState<Company[]>(
    () => getCached<Company[]>(COMPANIES_CACHE_KEY) ?? [],
  );
  const [selectedCompany, setSelectedCompany] = useState<string>("all");
  const [recommendations, setRecommendations] = useState<Recommendation[]>(
    () => getCached<Recommendation[]>(recCacheKey("all")) ?? [],
  );
  const [loading, setLoading] = useState(
    () => getCached<Recommendation[]>(recCacheKey("all")) === undefined,
  );
  const [error, setError] = useState<string | null>(null);

  // Company list for the filter dropdown — loaded once (cached across visits).
  useEffect(() => {
    let cancelled = false;
    fetchWithCache(COMPANIES_CACHE_KEY, () => accountsService.list(), {
      onRevalidate: (fresh) => {
        if (!cancelled) setCompanies(fresh);
      },
    })
      .then((data) => {
        if (!cancelled) setCompanies(data);
      })
      .catch(() => {
        /* filter just won't populate; the feed still loads */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const key = recCacheKey(selectedCompany);
    const cached = getCached<Recommendation[]>(key);

    setLoading(cached === undefined);
    setError(null);

    fetchWithCache(
      key,
      () => recommendationsService.list(selectedCompany === "all" ? undefined : selectedCompany),
      {
        onRevalidate: (fresh) => {
          if (!cancelled) setRecommendations(fresh);
        },
      },
    )
      .then((data) => {
        if (!cancelled) setRecommendations(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message || "Could not load recommendations."
              : "Could not reach the backend. Make sure the FastAPI server is running.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedCompany]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-medium text-white/70">Recommendation Center</h2>
          <p className="text-xs text-white/35">
            AI-ranked next actions across every analysed account, grounded in your actual research.
          </p>
        </div>

        {companies.length > 0 && (
          <select
            value={selectedCompany}
            onChange={(e) => setSelectedCompany(e.target.value)}
            className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-white/70 outline-none"
          >
            <option value="all" className="bg-[#111]">
              All Companies
            </option>
            {companies.map((c) => (
              <option key={c.id} value={c.id} className="bg-[#111]">
                {c.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {loading && (
        <div className="flex items-center gap-2 py-10 text-sm text-white/40">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading recommendations…
        </div>
      )}

      {!loading && error && <p className="py-10 text-sm text-red-400">{error}</p>}

      {!loading && !error && recommendations.length === 0 && (
        <p className="py-10 text-sm text-white/40">
          No recommendations yet — run a company brief through the AI Workspace chat so the
          Guardrail-approved analysis can be scored here.
        </p>
      )}

      {!loading && !error && recommendations.length > 0 && (
        <div className="space-y-4">
          {recommendations.map((r) => (
            <RecommendationCard key={r.analysisId} recommendation={r} />
          ))}
        </div>
      )}
    </div>
  );
}