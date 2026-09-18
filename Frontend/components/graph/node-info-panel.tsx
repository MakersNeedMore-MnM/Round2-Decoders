"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { RelationshipNode } from "@/types";

export function NodeInfoPanel({
  node,
  onClose,
}: {
  node: RelationshipNode | null;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {node && (
        <motion.div
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 24 }}
          transition={{ duration: 0.25 }}
          className="absolute right-4 top-4 w-[280px] rounded-2xl border border-white/10 bg-[#111111] p-4 shadow-premium"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-white">{node.name}</p>
              <p className="text-xs text-white/40">{node.title}</p>
            </div>
            <button onClick={onClose} className="rounded-lg p-1 text-white/30 hover:text-white hover:bg-white/[0.06]">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <Badge variant="silver">{node.influence}</Badge>
            <Badge variant="outline">{node.confidence}% confidence</Badge>
          </div>

          <div className="mt-4 space-y-3">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-white/30">Evidence</p>
              <ul className="mt-1.5 space-y-1">
                {node.evidence.map((e, index) => (
                  <li key={`${index}-${e}`} className="text-[12px] leading-relaxed text-white/55">
                    · {e}
                  </li>
                ))}
              </ul>
            </div>

            {node.painPoints.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-wider text-white/30">Pain Points</p>
                <ul className="mt-1.5 space-y-1">
                  {node.painPoints.map((p, index) => (
                    <li key={`${index}-${p}`} className="text-[12px] leading-relaxed text-white/55">
                      · {p}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {node.buyingSignals.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-wider text-white/30">Buying Signals</p>
                <ul className="mt-1.5 space-y-1">
                  {node.buyingSignals.map((s, index) => (
                    <li key={`${index}-${s}`} className="text-[12px] leading-relaxed text-white/55">
                      · {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}