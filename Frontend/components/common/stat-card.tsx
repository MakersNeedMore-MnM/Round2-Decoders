"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  delta?: string;
  deltaTone?: "positive" | "negative" | "neutral";
  icon?: LucideIcon;
  className?: string;
}

export function StatCard({ label, value, delta, deltaTone = "neutral", icon: Icon, className }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
    >
      <Card
        className={cn(
          "p-5 transition-colors hover:border-white/12 hover:bg-white/[0.015]",
          className,
        )}
      >
        <div className="flex items-start justify-between">
          <span className="text-xs text-white/40 tracking-wide">{label}</span>
          {Icon && (
            <div className="rounded-lg border border-white/8 bg-white/[0.03] p-1.5 text-white/50">
              <Icon className="h-3.5 w-3.5" />
            </div>
          )}
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-semibold text-white tracking-tight">{value}</span>
          {delta && (
            <span
              className={cn(
                "text-xs font-medium",
                deltaTone === "positive" && "text-emerald-400",
                deltaTone === "negative" && "text-red-400",
                deltaTone === "neutral" && "text-white/40",
              )}
            >
              {delta}
            </span>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
