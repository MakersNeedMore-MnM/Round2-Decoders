"use client";

import { useEffect, useState } from "react";
import { Building2, TrendingUp, ShieldCheck, Users, Loader2 } from "lucide-react";
import { StatCard } from "@/components/common/stat-card";
import { ResearchStatusDonut } from "@/components/accounts/research-status-donut";
import { PainPointsBarChart } from "@/components/accounts/pain-points-bar";
import { ResearchActivityLineChart } from "@/components/accounts/research-activity-line";
import { TrustDistributionChart } from "@/components/accounts/trust-distribution-chart";
import { AccountsTable } from "@/components/accounts/accounts-table";
import { workspaceService, type WorkspaceStats } from "@/services/workspace.service";
import { ApiError } from "@/services/api-client";
import { fetchWithCache, getCached } from "@/lib/data-cache";

const STATS_CACHE_KEY = "workspace:stats";

function formatDelta(value: number | null, suffix: string): string | undefined {
  if (value === null || value === undefined) return undefined;
  if (value === 0) return `0${suffix}`;
  return `${value > 0 ? "+" : ""}${value}${suffix}`;
}

export default function AccountsPage() {
  // Seed from cache synchronously so a repeat visit paints instantly
  // instead of flashing a loading state for data we already have.
  const [stats, setStats] = useState<WorkspaceStats | null>(() => getCached<WorkspaceStats>(STATS_CACHE_KEY) ?? null);
  const [loading, setLoading] = useState(() => getCached<WorkspaceStats>(STATS_CACHE_KEY) === undefined);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await fetchWithCache(STATS_CACHE_KEY, () => workspaceService.getStats(), {
          onRevalidate: (fresh) => {
            if (!cancelled) setStats(fresh);
          },
        });
        if (!cancelled) {
          setStats(data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : "Could not reach the backend to load account stats.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total accounts"
          value={loading ? "—" : String(stats?.total_accounts ?? 0)}
          delta={loading ? undefined : formatDelta(stats?.new_accounts_this_week ?? 0, " this week")}
          deltaTone={(stats?.new_accounts_this_week ?? 0) > 0 ? "positive" : "neutral"}
          icon={Building2}
        />
        <StatCard
          label="Avg. trust score"
          value={loading ? "—" : String(stats?.avg_trust_score ?? 0)}
          delta={loading ? undefined : formatDelta(stats?.trust_score_delta ?? null, "")}
          deltaTone={
            stats?.trust_score_delta == null
              ? "neutral"
              : stats.trust_score_delta > 0
                ? "positive"
                : stats.trust_score_delta < 0
                  ? "negative"
                  : "neutral"
          }
          icon={TrendingUp}
        />
        <StatCard
          label="Guardrail catches"
          value={loading ? "—" : String(stats?.guardrail_catches ?? 0)}
          delta={
            loading
              ? undefined
              : `${stats?.guardrail_catches_this_week ?? 0} this week`
          }
          icon={ShieldCheck}
        />
        <StatCard
          label="Stakeholders mapped"
          value={loading ? "—" : String(stats?.stakeholders_mapped ?? 0)}
          icon={Users}
        />
      </div>

      {!loading && error && (
        <p className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
          {error}
        </p>
      )}

      {loading && (
        <div className="flex items-center gap-2 px-1 py-8 text-sm text-white/40">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading account stats…
        </div>
      )}

      {!loading && !error && stats && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <ResearchStatusDonut data={stats.research_status} />
          <PainPointsBarChart data={stats.pain_points_by_industry} />
          <ResearchActivityLineChart data={stats.research_activity} />
          <TrustDistributionChart data={stats.trust_distribution} />
        </div>
      )}

      <AccountsTable />
    </div>
  );
}