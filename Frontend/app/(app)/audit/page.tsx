"use client";

import { useEffect, useState } from "react";
import { AuditTimeline } from "@/components/audit/audit-timeline";
import { workspaceService } from "@/services/workspace.service";
import { fetchWithCache, getCached } from "@/lib/data-cache";

const HISTORY_CACHE_KEY = "audit:history";

function analysisCacheKey(id: number) {
  return `audit:analysis:${id}`;
}

export default function AuditPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [analysis, setAnalysis] = useState<any>(null);
  const [history, setHistory] = useState<any[]>(() => getCached<any[]>(HISTORY_CACHE_KEY) ?? []);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Load the user's analysis history first, then default to the most
  // recent analysis instead of a hardcoded id that may not exist (or
  // may belong to a different user, since GET /analysis/{id} scopes by
  // current_user.id and returns a plain { error: "..." } body for a miss).
  useEffect(() => {
    let cancelled = false;

    fetchWithCache(HISTORY_CACHE_KEY, () => workspaceService.getAnalysisHistory(), {
      onRevalidate: (fresh) => {
        if (!cancelled) setHistory(fresh);
      },
    }).then((data) => {
      if (cancelled) return;
      setHistory(data);
      setSelectedId((current) => {
        if (current !== null) return current;
        return data.length > 0 ? data[0].analysis_id : current;
      });
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedId === null) return;

    let cancelled = false;
    const key = analysisCacheKey(selectedId);

    function applyResponse(response: any) {
      if (!response || "error" in response) {
        setAnalysis(null);
        setEvents([]);
        setLoadError((response as any)?.error || "Analysis not found.");
        return;
      }

      setAnalysis(response);
      setLoadError(null);

      const timeline = Array.isArray(response.timeline) ? response.timeline : [];

      const mapped = timeline.map((item: any, index: number) => ({
        id: String(index + 1),
        event: item.agent,
        agent: item.agent,
        status:
          item.status === "completed"
            ? "success"
            : item.status === "saved"
            ? "success"
            : "info",
        detail: `${item.agent} finished in ${((item.duration_ms ?? 0) / 1000).toFixed(
          2
        )} sec`,
        time: `${((item.duration_ms ?? 0) / 1000).toFixed(1)} s`,
      }));

      setEvents(mapped);
    }

    async function load() {
      setLoadError(null);

      try {
        const response = await fetchWithCache(
          key,
          () => workspaceService.getAnalysis(selectedId as number),
          {
            onRevalidate: (fresh) => {
              if (!cancelled) applyResponse(fresh);
            },
          },
        );

        if (!cancelled) applyResponse(response);
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setAnalysis(null);
          setEvents([]);
          setLoadError("Could not reach the backend. Make sure the FastAPI server is running.");
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  return (
    <div className="max-w-3xl space-y-5">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Audit Trail
          </h1>

          <p className="mt-1 text-sm text-white/45">
            Enterprise execution trace for every AI agent.
          </p>
        </div>

        {loadError && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-sm text-white/50">
            {loadError}
          </div>
        )}

        {!loadError && history.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-sm text-white/50">
            No analyses yet — run one from the AI Workspace and it'll show up here.
          </div>
        )}

        {analysis && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-semibold">
                  {analysis.overall_assessment?.company || "Unknown Company"}
                </h2>

                <p className="mt-1 text-sm text-white/45">
                  Analysis #{analysis.analysis_id}
                </p>

                <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-green-500/10 px-3 py-1 text-xs text-green-400">
                  ● Completed Successfully
                </div>
              </div>

              <div className="relative">
                <button
                  onClick={() => setOpen(!open)}
                  className="rounded-lg border border-white/10 px-4 py-2 text-sm transition hover:bg-white/5"
                >
                  Change Analysis ▼
                </button>

                {open && (
                  <div className="absolute right-0 z-50 mt-2 w-72 rounded-xl border border-white/10 bg-[#111] shadow-xl">
                    <div className="max-h-80 overflow-y-auto">
                      {history.map((item: any) => (
                        <button
                          key={item.analysis_id}
                          onClick={() => {
                            setSelectedId(item.analysis_id);
                            setOpen(false);
                          }}
                          className="flex w-full flex-col border-b border-white/5 px-4 py-3 text-left hover:bg-white/5"
                        >
                          <span className="font-medium">
                            {item.overall_assessment?.company || "Unknown Company"}
                          </span>

                          <span className="text-xs text-white/40">
                            Analysis #{item.analysis_id}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
              <div className="rounded-xl bg-white/[0.03] p-4">
                <p className="text-xs text-white/40">Execution Time</p>
                <p className="mt-2 text-xl font-semibold">
                  {((analysis.execution?.total_time_ms ?? 0) / 1000).toFixed(1)} s
                </p>
              </div>

              <div className="rounded-xl bg-white/[0.03] p-4">
                <p className="text-xs text-white/40">Agents</p>
                <p className="mt-2 text-xl font-semibold">
                  {analysis.execution?.agents_executed ?? 0}
                </p>
              </div>

              <div className="rounded-xl bg-white/[0.03] p-4">
                <p className="text-xs text-white/40">Knowledge</p>
                <p className="mt-2 text-xl font-semibold text-green-400">
                  {analysis.execution?.knowledge_saved ? "Saved" : "No"}
                </p>
              </div>

              <div className="rounded-xl bg-white/[0.03] p-4">
                <p className="text-xs text-white/40">Created</p>
                <p className="mt-2 text-sm">
                  {analysis.created_at
                    ? new Date(analysis.created_at).toLocaleString()
                    : "N/A"}
                </p>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
              <div>
                <p className="text-xs text-white/40">Intent Score</p>
                <p className="mt-1 text-lg font-semibold">
                  {analysis.overall_assessment?.intent_score ?? "N/A"}
                </p>
              </div>

              <div>
                <p className="text-xs text-white/40">Buying Stage</p>
                <p className="mt-1">
                  {analysis.overall_assessment?.buying_stage || "N/A"}
                </p>
              </div>

              <div>
                <p className="text-xs text-white/40">Decision Maker</p>
                <p className="mt-1">
                  {analysis.overall_assessment?.decision_maker || "N/A"}
                </p>
              </div>

              <div>
                <p className="text-xs text-white/40">Risk</p>
                <p className="mt-1">
                  {analysis.overall_assessment?.risk_level || "N/A"}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {analysis && <AuditTimeline events={events} analysis={analysis} />}
    </div>
  );
}