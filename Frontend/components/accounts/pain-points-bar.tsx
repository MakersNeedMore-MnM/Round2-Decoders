"use client";

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PainPointsByIndustryPoint } from "@/types";

const BAR_COLORS = [
  "#3b82f6", // Blue
  "#8b5cf6", // Violet
  "#ec4899", // Pink
  "#06b6d4", // Cyan
  "#10b981", // Emerald
  "#f59e0b", // Amber
];

export function PainPointsBarChart({ data }: { data: PainPointsByIndustryPoint[] }) {
  return (
    <Card className="border border-white/10 bg-gradient-to-br from-[#121212] via-[#161618] to-[#121212] shadow-xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold tracking-wide text-white/90">
          Pain Points by Industry
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[210px]">
          {data.length === 0 ? (
            <p className="flex h-full items-center justify-center text-xs text-white/30">
              No pain points extracted yet.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ left: -20, right: 10, top: 10 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis
                  dataKey="industry"
                  tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 10 }}
                  axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  cursor={{ fill: "rgba(255,255,255,0.05)" }}
                  contentStyle={{
                    background: "rgba(18, 18, 18, 0.95)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    borderRadius: 12,
                    fontSize: 12,
                    color: "#fff",
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)",
                  }}
                  formatter={(value: number) => [`${value} pain points`, "Volume"]}
                />
                <Bar dataKey="count" radius={[8, 8, 0, 0]} maxBarSize={38}>
                  {data.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={BAR_COLORS[index % BAR_COLORS.length]}
                      style={{ filter: "drop-shadow(0px 2px 8px rgba(139, 92, 246, 0.3))" }}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
