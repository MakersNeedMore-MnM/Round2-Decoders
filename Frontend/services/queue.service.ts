import { apiFetch } from "./api-client";
import type { OutreachDraft } from "@/types";

export const queueService = {
  async list(): Promise<OutreachDraft[]> {
    return apiFetch<OutreachDraft[]>("/queue/");
  },

  async generate(analysisId: number | string, purpose?: string): Promise<OutreachDraft> {
    const qs = purpose ? `?${new URLSearchParams({ purpose }).toString()}` : "";
    return apiFetch<OutreachDraft>(`/queue/generate/${analysisId}${qs}`, {
      method: "POST",
    });
  },

  async approve(draftId: string): Promise<OutreachDraft> {
    return apiFetch<OutreachDraft>(`/queue/${draftId}/approve`, {
      method: "POST",
    });
  },

  async reject(draftId: string): Promise<OutreachDraft> {
    return apiFetch<OutreachDraft>(`/queue/${draftId}/reject`, {
      method: "POST",
    });
  },

  async edit(draftId: string, subject: string, body: string): Promise<OutreachDraft> {
    const params = new URLSearchParams({ subject, body });
    return apiFetch<OutreachDraft>(`/queue/${draftId}/edit?${params.toString()}`, {
      method: "POST",
    });
  },

  async sendEmail(
    draftId: string,
    recipient: string,
    subject: string,
    body: string
  ): Promise<{ success: boolean; message: string; draft: OutreachDraft }> {
    return apiFetch(`/queue/${draftId}/send`, {
      method: "POST",
      body: JSON.stringify({ recipient, subject, body }),
    });
  },

  async deleteDraft(draftId: string): Promise<{ success: boolean; deleted_id: number }> {
    return apiFetch(`/queue/${draftId}`, {
      method: "DELETE",
    });
  },

  async createFollowup(draftId: string): Promise<OutreachDraft> {
    return apiFetch<OutreachDraft>(`/queue/${draftId}/followup`, {
      method: "POST",
    });
  },

  async disconnectGmail(): Promise<{ connected: boolean; email: string | null }> {
    return apiFetch(`/auth/google/disconnect`, {
      method: "POST",
    });
  },

  async getBestTime(draftId: string): Promise<BestTimeResponse> {
    return apiFetch<BestTimeResponse>(`/scheduling/${draftId}/best-time`);
  },

  async getMeetingSlots(draftId: string): Promise<MeetingSlotsResponse> {
    return apiFetch<MeetingSlotsResponse>(`/scheduling/${draftId}/meeting-slots`);
  },

  async confirmMeeting(
    draftId: string,
    slotIso: string,
    durationMinutes = 30,
  ): Promise<ConfirmMeetingResponse> {
    return apiFetch<ConfirmMeetingResponse>(`/scheduling/${draftId}/meeting`, {
      method: "POST",
      body: JSON.stringify({ slot: slotIso, duration_minutes: durationMinutes }),
    });
  },
};

export interface BestTimeResponse {
  recommended_send_at: string;
  reasoning: string;
}

export interface MeetingSlotsResponse {
  slots: string[];
}

export interface ConfirmMeetingResponse {
  meeting_time: string;
  duration_minutes: number;
  google_calendar_url: string;
  ics_url: string;
}