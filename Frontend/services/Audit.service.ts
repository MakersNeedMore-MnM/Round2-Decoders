import { apiFetch } from "./api-client";
import type { AuditEvent } from "@/types";

export const auditService = {
  /** Every agent-run event across every company the user has analyzed, newest first. */
  async list(limit = 100): Promise<AuditEvent[]> {
    return apiFetch<AuditEvent[]>(`/audit/?limit=${limit}`);
  },
};