"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { PainPoint, Stakeholder } from "@/types";
import { SEVERITY_COLOR } from "@/lib/constants";

const INFLUENCE_VARIANT: Record<string, "silver" | "success" | "warning" | "outline"> = {
  "Decision Maker": "silver",
  Champion: "success",
  "Budget Holder": "warning",
  Influencer: "outline",
  Blocker: "outline",
};

export function StakeholderCard({ stakeholder }: { stakeholder: Stakeholder }) {
  return (
    <Card className="p-4 transition-colors hover:border-white/12">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback>
              {stakeholder.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium text-white/90">{stakeholder.name}</p>
            <p className="text-xs text-white/40">{stakeholder.title}</p>
          </div>
        </div>
        <span className="text-xs text-white/40">{stakeholder.score}</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <Badge variant={INFLUENCE_VARIANT[stakeholder.influence] ?? "outline"}>{stakeholder.influence}</Badge>
        <Badge variant="outline">{stakeholder.dept}</Badge>
      </div>
    </Card>
  );
}

export function PainPointCard({ painPoint }: { painPoint: PainPoint }) {
  return (
    <Card className="p-4 transition-colors hover:border-white/12">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-white/85">{painPoint.title}</p>
        <span
          className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide"
          style={{
            color: SEVERITY_COLOR[painPoint.severity],
            backgroundColor: `${SEVERITY_COLOR[painPoint.severity]}1a`,
          }}
        >
          {painPoint.severity}
        </span>
      </div>
      <p className="mt-2 text-[13px] leading-relaxed text-white/40">{painPoint.excerpt}</p>
      <div className="mt-3 flex items-center gap-3 text-[11px] text-white/30">
        <span>{painPoint.confidence}% confidence</span>
        <span>·</span>
        <span>{painPoint.sources} sources</span>
      </div>
    </Card>
  );
}
