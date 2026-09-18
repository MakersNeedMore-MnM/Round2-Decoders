import type { NavKey } from "@/types";

export const APP_NAME = "ProspectIQ";

export const NAV_ITEMS: { id: NavKey; label: string; href: string }[] = [
  { id: "workspace", label: "AI Workspace", href: "/workspace" },
  { id: "accounts", label: "Accounts", href: "/accounts" },
  { id: "graph", label: "Relationship Graph", href: "/graph" },
  { id: "recommendations", label: "Recommendation Center", href: "/recommendations" },
  { id: "queue", label: "Outreach Queue", href: "/queue" },
  { id: "agent-room", label: "Agent Discussion", href: "/agent-room" },
  { id: "audit", label: "Audit Trail", href: "/audit" },
];

export const CHART_COLORS = {
  silver: "#c9c9c9",
  platinum: "#e5e4e2",
  white: "#ffffff",
  muted: "#4a4a4a",
  success: "#22c55e",
  warning: "#f59e0b",
  danger: "#ef4444",
  grid: "rgba(255,255,255,0.06)",
};

export const SEVERITY_COLOR: Record<string, string> = {
  critical: "#ef4444",
  high: "#f59e0b",
  medium: "#eab308",
  low: "#6b7280",
};
