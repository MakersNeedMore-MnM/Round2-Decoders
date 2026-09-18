"use client";

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TrustDistributionPoint } from "@/types";

function colorFor(bucket: string) {
  const low = parseInt(bucket.split("-")[0], 10);
  if (low >= 80) return "#10b981"; // Emerald Green
  if (low >= 60) return "#06b6d4"; // Vibrant Cyan
  if (low >= 40) return "#f59e0b"; // Vibrant Amber
  return "#f43f5e"; // Vibrant Rose
}

export function TrustDistributionChart({ data }: { data: TrustDistributionPoint[] }) {
  const total = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <Card className="border border-white/10 bg-gradient-to-br from-[#121212] via-[#161618] to-[#121212] shadow-xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold tracking-wide text-white/90">
          Trust Score Distribution
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[210px]">
          {total === 0 ? (
            <p className="flex h-full items-center justify-center text-xs text-white/30">
              No trust scores recorded yet.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ left: -20, right: 10, top: 10 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis
                  dataKey="bucket"
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
                  formatter={(value: number) => [`${value} accounts`, "Score Count"]}
                />
                <Bar dataKey="count" radius={[8, 8, 0, 0]} maxBarSize={42}>
                  {data.map((entry) => (
                    <Cell
                      key={entry.bucket}
                      fill={colorFor(entry.bucket)}
                      style={{ filter: "drop-shadow(0px 2px 6px rgba(0, 0, 0, 0.4))" }}
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
