"use client";

import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ResearchActivityPoint } from "@/types";

function formatDay(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function ResearchActivityLineChart({ data }: { data: ResearchActivityPoint[] }) {
  const hasActivity = data.some((d) => d.analyses > 0);
  const chartData = data.map((d) => ({ ...d, date: formatDay(d.date) }));

  return (
    <Card className="border border-white/10 bg-gradient-to-br from-[#121212] via-[#161618] to-[#121212] shadow-xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold tracking-wide text-white/90">
          Research Activity (14 Days)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[210px]">
          {!hasActivity ? (
            <p className="flex h-full items-center justify-center text-xs text-white/30">
              No analyses run in the last 14 days.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ left: -20, right: 10, top: 10 }}>
                <defs>
                  <linearGradient id="activityGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.6} />
                    <stop offset="50%" stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis
                  dataKey="date"
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
                  contentStyle={{
                    background: "rgba(18, 18, 18, 0.95)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    borderRadius: 12,
                    fontSize: 12,
                    color: "#fff",
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)",
                  }}
                  formatter={(value: number) => [`${value} analyses`, "Executed"]}
                />
                <Area
                  type="monotone"
                  dataKey="analyses"
                  stroke="#06b6d4"
                  strokeWidth={3}
                  fill="url(#activityGradient)"
                  dot={{ fill: "#06b6d4", r: 4, strokeWidth: 2, stroke: "#121212" }}
                  activeDot={{ r: 6, fill: "#22d3ee", stroke: "#fff", strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
