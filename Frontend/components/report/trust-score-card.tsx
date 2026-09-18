"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScoreRing } from "@/components/common/score-ring";
import { Progress } from "@/components/ui/progress";
import { FileText } from "lucide-react";

export function TrustScoreCard({ score }: { score: number }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Trust Score</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center gap-5">
        <ScoreRing score={score} size={84} label="overall" />
        <div className="space-y-2 text-xs text-white/40">
          <p>Grounded in 3 independent public sources.</p>
          <p>No unsupported claims detected in this brief.</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function ConfidenceMeter({ label, value }: { label: string; value: number }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-white/60">{label}</span>
        <span className="text-white/40">{value}%</span>
      </div>
      <Progress value={value} />
    </div>
  );
}

export function EvidenceList({ items }: { items: string[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Evidence</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2.5">
        {items.map((item, index) => (
          <div
            key={`${index}-${item}`}
            className="flex items-start gap-2.5 rounded-lg border border-white/6 bg-white/[0.02] p-3"
          >
            <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/30" />
            <span className="text-[13px] text-white/55">{item}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}