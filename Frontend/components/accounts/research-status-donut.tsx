"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ResearchStatusSlice } from "@/types";

const COLORS: Record<string, string> = {
  analyzed: "#06b6d4", // Vibrant Cyan
  "in-review": "#a855f7", // Vibrant Purple
  queued: "#f59e0b", // Vibrant Amber
};

const LABELS: Record<string, string> = {
  analyzed: "Analyzed",
  "in-review": "In Review",
  queued: "Queued",
};

export function ResearchStatusDonut({ data }: { data: ResearchStatusSlice[] }) {
  const total = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <Card className="border border-white/10 bg-gradient-to-br from-[#121212] via-[#161618] to-[#121212] shadow-xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold tracking-wide text-white/90">
          Research Status Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <p className="flex h-[200px] items-center justify-center text-xs text-white/30">
            No accounts yet — run a company brief through the AI Workspace chat.
          </p>
        ) : (
          <>
            <div className="relative h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    dataKey="count"
                    nameKey="status"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={4}
                    strokeWidth={0}
                  >
                    {data.map((entry) => (
                      <Cell
                        key={entry.status}
                        fill={COLORS[entry.status] || "#3b82f6"}
                        style={{ filter: "drop-shadow(0px 0px 6px rgba(6, 182, 212, 0.3))" }}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "rgba(18, 18, 18, 0.95)",
                      border: "1px solid rgba(255,255,255,0.15)",
                      borderRadius: 12,
                      fontSize: 12,
                      color: "#fff",
                      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)",
                    }}
                    formatter={(value: number, name: string) => [value, LABELS[name] ?? name]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold tracking-tight text-white">{total}</span>
                <span className="text-[10px] font-medium uppercase tracking-wider text-cyan-400/80">Accounts</span>
              </div>
            </div>
            <div className="mt-2 flex justify-center gap-6">
              {data.map((entry) => (
                <div key={entry.status} className="flex items-center gap-2 text-xs font-medium text-white/70">
                  <span
                    className="h-2.5 w-2.5 rounded-full shadow-sm"
                    style={{ background: COLORS[entry.status] || "#3b82f6" }}
                  />
                  <span>{LABELS[entry.status] ?? entry.status}</span>
                  <span className="text-white/40">({entry.count})</span>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
