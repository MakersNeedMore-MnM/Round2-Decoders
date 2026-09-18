"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { FileCheck2, Eye, Sparkles, Network, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { queueService } from "@/services/queue.service";
import { ApiError } from "@/services/api-client";
import type { WorkspaceReportCompletion } from "@/types";

interface ReportReadyCardProps {
  report: WorkspaceReportCompletion;
  onPreview?: () => void;
}

export function ReportReadyCard({ report, onPreview }: ReportReadyCardProps) {
  const router = useRouter();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handlePreview() {
    setPreviewOpen((v) => !v);
    onPreview?.();
  }

  async function handleGenerateDraft() {
    if (!report.analysisId || generating || generated) return;
    setGenerating(true);
    setError(null);
    try {
      const draft = await queueService.generate(report.analysisId);
      setGenerated(draft.id);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message || "Could not generate the outreach draft."
          : "Could not reach the backend. Make sure the FastAPI server is running.",
      );
    } finally {
      setGenerating(false);
    }
  }

  function handleViewGraph() {
    if (!report.companyId) return;
    router.push(`/graph?company=${report.companyId}`);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mt-1 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.05] p-3.5"
    >
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/15 text-emerald-400">
          <FileCheck2 className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-white/90">Executive Report Ready</p>
          {report.company && <p className="truncate text-[11px] text-white/40">{report.company}</p>}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" onClick={handlePreview} className="gap-1.5">
          <Eye className="h-3.5 w-3.5" />
          {previewOpen ? "Hide preview" : "Preview Report"}
        </Button>

        {report.approved ? (
          <Button
            size="sm"
            variant="outline"
            onClick={handleGenerateDraft}
            disabled={!report.analysisId || generating || !!generated}
            className="gap-1.5"
          >
            {generating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : generated ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            {generated ? "Draft added to Queue" : generating ? "Generating…" : "Generate Outreach Draft"}
          </Button>
        ) : (
          <Badge variant="danger" className="self-center">
            Needs Guardrail approval before outreach can be drafted
          </Badge>
        )}

        <Button size="sm" variant="outline" onClick={handleViewGraph} disabled={!report.companyId} className="gap-1.5">
          <Network className="h-3.5 w-3.5" />
          View Relationship Graph
        </Button>
      </div>

      <AnimatePresence initial={false}>
        {previewOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="mt-3 space-y-2 rounded-xl border border-white/6 bg-white/[0.02] p-3">
              {report.recommendation && (
                <p className="text-[12px] leading-relaxed text-white/60">{report.recommendation}</p>
              )}
              <div className="flex flex-wrap gap-1.5">
                {report.riskLevel && (
                  <Badge variant={report.riskLevel.toLowerCase() === "high" ? "danger" : "outline"}>
                    {report.riskLevel} risk
                  </Badge>
                )}
                {typeof report.approved === "boolean" && (
                  <Badge variant={report.approved ? "success" : "danger"}>
                    {report.approved ? "Approved" : "Needs review"}
                  </Badge>
                )}
                {report.buyingStage && <Badge variant="outline">{report.buyingStage}</Badge>}
              </div>
              {report.nextAction && (
                <p className="text-[11px] text-white/35">
                  Next action: <span className="text-white/65">{report.nextAction}</span>
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && <p className="mt-2 text-[11px] text-red-400">{error}</p>}
      {generated && !error && (
        <p className="mt-2 text-[11px] text-white/35">
          Draft #{generated} is now pending in the{" "}
          <button
            type="button"
            onClick={() => router.push("/queue")}
            className="text-emerald-400 underline underline-offset-2 hover:text-emerald-300"
          >
            Outreach Queue
          </button>
          .
        </p>
      )}
    </motion.div>
  );
}