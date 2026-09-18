"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, X, Mail, Linkedin, Phone, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import type { OutreachDraft } from "@/types";
import { cn } from "@/lib/utils";

const CHANNEL_ICON = { email: Mail, linkedin: Linkedin, "call-script": Phone };

export function OutreachCard({
  draft,
  onApprove,
  onReject,
}: {
  draft: OutreachDraft;
  onApprove?: (id: string) => Promise<void>;
  onReject?: (id: string) => Promise<void>;
}) {
  const [status, setStatus] = useState(draft.status);
  const [pendingAction, setPendingAction] = useState<"approve" | "reject" | null>(null);
  const ChannelIcon = CHANNEL_ICON[draft.channel];

  async function handleApprove() {
    setPendingAction("approve");
    try {
      if (onApprove) await onApprove(draft.id);
      setStatus("approved");
    } finally {
      setPendingAction(null);
    }
  }

  async function handleReject() {
    setPendingAction("reject");
    try {
      if (onReject) await onReject(draft.id);
      setStatus("rejected");
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <motion.div layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <Card className={cn("transition-colors", status === "approved" && "border-emerald-500/25", status === "rejected" && "opacity-50")}>
        <CardContent className="space-y-4 p-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9">
                <AvatarFallback>
                  {draft.stakeholderName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium text-white/90">{draft.stakeholderName}</p>
                <p className="text-xs text-white/40">{draft.companyName}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                <ChannelIcon className="h-3 w-3" /> {draft.channel}
              </Badge>
              <Badge variant={draft.confidence >= 85 ? "success" : draft.confidence >= 70 ? "warning" : "danger"}>
                {draft.confidence}% confidence
              </Badge>
            </div>
          </div>

          <div className="rounded-xl border border-white/6 bg-white/[0.02] p-4">
            <p className="text-[13px] font-medium text-white/85">{draft.subject}</p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-white/45">{draft.body}</p>
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-wider text-white/30">Reasoning</p>
            <p className="mt-1 text-[12px] leading-relaxed text-white/50">{draft.reasoning}</p>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {draft.evidence.map((e) => (
              <span key={e} className="rounded-full border border-white/8 bg-white/[0.02] px-2.5 py-1 text-[11px] text-white/40">
                {e}
              </span>
            ))}
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <span className="text-[11px] text-white/25">Queued for approval</span>
            {status === "pending" ? (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={handleReject} disabled={pendingAction !== null}>
                  {pendingAction === "reject" ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <X className="h-3.5 w-3.5" />
                  )}{" "}
                  Reject
                </Button>
                <Button size="sm" onClick={handleApprove} disabled={pendingAction !== null}>
                  {pendingAction === "approve" ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Check className="h-3.5 w-3.5" />
                  )}{" "}
                  Approve
                </Button>
              </div>
            ) : (
              <Badge variant={status === "approved" ? "success" : status === "edited" ? "outline" : "danger"}>
                {status === "approved" ? "Approved" : status === "edited" ? "Edited" : "Rejected"}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}