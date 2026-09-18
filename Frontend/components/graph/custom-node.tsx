"use client";

import { Handle, Position, type NodeProps } from "reactflow";
import { cn } from "@/lib/utils";

const RING_COLOR: Record<string, string> = {
  "Decision Maker": "border-white/50",
  Champion: "border-emerald-400/50",
  "Budget Holder": "border-amber-400/50",
  Influencer: "border-white/25",
  Blocker: "border-red-400/50",
};

export interface StakeholderNodeData {
  name: string;
  title: string;
  influence: string;
  confidence: number;
}

export function StakeholderNode({ data, selected }: NodeProps<StakeholderNodeData>) {
  const initials = data.name
    .split(" ")
    .map((n) => n[0])
    .join("");

  return (
    <div
      className={cn(
        "flex w-[168px] flex-col items-center gap-1.5 rounded-2xl border bg-[#111111] px-3 py-3 shadow-premium transition-all",
        RING_COLOR[data.influence] ?? "border-white/15",
        selected ? "ring-2 ring-white/40 scale-105" : "hover:scale-[1.03]",
      )}
    >
      <Handle type="target" position={Position.Top} className="!bg-white/20 !border-0 !h-1.5 !w-1.5" />
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-b from-white/25 to-white/5 text-xs font-semibold text-white">
        {initials}
      </div>
      <p className="text-center text-[12px] font-medium text-white/90">{data.name}</p>
      <p className="text-center text-[10px] text-white/40">{data.title}</p>
      <span className="text-[10px] text-white/30">{data.confidence}% confidence</span>
      <Handle type="source" position={Position.Bottom} className="!bg-white/20 !border-0 !h-1.5 !w-1.5" />
    </div>
  );
}
