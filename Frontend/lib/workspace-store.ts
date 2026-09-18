/**
 * Module-scoped store for the AI Workspace chat.
 *
 * Why this exists: WorkspaceClient used to keep messages/sending/result in
 * plain React state. Since the workspace page is a route, navigating away
 * (e.g. to /accounts) unmounts WorkspaceClient, and navigating back mounts
 * a brand new instance — wiping the conversation and, worse, orphaning any
 * in-flight stream (its state updates land on a dead component).
 *
 * This store lives in module scope (outside React), so:
 *  - the conversation survives navigating to any other page and back
 *  - a send/analysis that's still streaming keeps updating this store even
 *    while the workspace page is unmounted, and the UI just re-subscribes
 *    to the current state next time it mounts
 *
 * Components read it via useSyncExternalStore and call the exported
 * actions (sendMessage / selectCompanySession) instead of local setState.
 */

import { workspaceService, type AnalyzeResponse, type StreamFrame, type SupervisorResponse } from "@/services/workspace.service";
import { ApiError } from "@/services/api-client";
import type { ComposerAttachment, WorkspaceMode } from "@/components/workspace/prompt-composer";
import type { ChatMessage, WorkspaceStreamStep } from "@/types";

const WELCOME: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Send me a company brief, some notes, or a website summary and I'll run it through the research pipeline — knowledge extraction, persona, intent, strategy, and a guardrail check. Ask me a general question instead and I'll just answer it directly.",
  timestamp: new Date().toISOString(),
};

const CHIP_BY_KIND: Record<ComposerAttachment["kind"], string> = {
  pdf: "PDF",
  csv: "CSV",
  url: "Website",
  crm: "CRM",
  gmail: "Emails",
  drive: "Drive",
  notion: "Notion",
  calendar: "Calendar",
};

export interface WorkspaceState {
  messages: ChatMessage[];
  sending: boolean;
  result: AnalyzeResponse | null;
  activeCompanyId: string | null;
}

const DEFAULT_THREAD_KEY = "__new__";

let state: WorkspaceState = {
  messages: [WELCOME],
  sending: false,
  result: null,
  activeCompanyId: null,
};

/**
 * Per-company chat threads built up during this browser session. Once you
 * chat about a company, its real messages (not a reconstructed summary)
 * live here — so switching to another "Recent Session" and back replays
 * what you actually typed, instead of overwriting it with a single card.
 * This is in-memory only (module scope): a full page reload or a
 * never-before-visited session still falls back to the one-card summary,
 * since the backend doesn't persist message-level transcripts.
 */
const threads = new Map<string, WorkspaceState>();
let activeThreadKey: string = DEFAULT_THREAD_KEY;

function saveThreadsToStorage() {
  if (typeof window === "undefined") return;
  try {
    const data: Record<string, WorkspaceState> = {};
    threads.forEach((val, key) => {
      data[key] = {
        messages: val.messages,
        sending: false,
        result: val.result,
        activeCompanyId: val.activeCompanyId,
      };
    });
    localStorage.setItem("prospectiq_chat_threads", JSON.stringify(data));
  } catch {}
}

function loadThreadsFromStorage() {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem("prospectiq_chat_threads");
    if (raw) {
      const parsed: Record<string, WorkspaceState> = JSON.parse(raw);
      Object.entries(parsed).forEach(([key, val]) => {
        threads.set(key, val);
      });
    }
  } catch {}
}

// Initial load from storage on browser mount
if (typeof window !== "undefined") {
  loadThreadsFromStorage();
}

const listeners = new Set<() => void>();
let abortController: AbortController | null = null;

function emit() {
  listeners.forEach((l) => l());
}

function setState(patch: Partial<WorkspaceState> | ((prev: WorkspaceState) => Partial<WorkspaceState>)) {
  const next = typeof patch === "function" ? patch(state) : patch;
  state = { ...state, ...next };
  threads.set(activeThreadKey, state);
  saveThreadsToStorage();
  emit();
}

function patchMessage(id: string, patch: Partial<ChatMessage>) {
  setState((prev) => ({
    messages: prev.messages.map((m) => (m.id === id ? { ...m, ...patch } : m)),
  }));
}

export function subscribeWorkspace(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getWorkspaceState(): WorkspaceState {
  return state;
}

/** Starts a brand-new conversation, stashing the current one under its thread key first. */
export function startNewChat() {
  abortController?.abort();
  abortController = null;
  activeThreadKey = `__new__-${Date.now()}`;
  state = {
    messages: [WELCOME],
    sending: false,
    result: null,
    activeCompanyId: null,
  };
  emit();
}

function reportFromAnalysis(analysis: AnalyzeResponse) {
  const assessment = analysis.overall_assessment;
  const guardrail = analysis.guardrail as
    | {
        unsupported_claims?: string[];
        supported_claims?: string[];
        confidence?: number;
        reasoning?: string;
      }
    | undefined;
  return {
    company: assessment?.company || analysis.knowledge?.company,
    recommendation: assessment?.overall_recommendation,
    riskLevel: assessment?.risk_level,
    buyingStage: assessment?.buying_stage,
    nextAction: assessment?.next_action,
    approved: assessment?.approved,
    analysisId: analysis.analysis_id,
    companyId: analysis.company_id,
    unsupportedClaims: guardrail?.unsupported_claims ?? [],
    supportedClaims: guardrail?.supported_claims ?? [],
    guardrailConfidence: guardrail?.confidence,
    guardrailReasoning: guardrail?.reasoning,
  };
}

export async function selectCompanySession(companyId: string) {
  // Already-active thread for this company — nothing to do.
  if (activeThreadKey === companyId) return;

  // We built a real thread for this company earlier in this browser
  // session (from an actual chat, not a reconstruction) — switch to it
  // directly and show what was actually typed.
  const existing = threads.get(companyId);
  if (existing) {
    activeThreadKey = companyId;
    state = existing;
    emit();
    return;
  }

  // No real transcript available (first visit this session, or after a
  // reload) — fall back to reconstructing a single summary card from the
  // stored analysis. This becomes that company's thread going forward.
  activeThreadKey = companyId;
  state = {
    messages: [WELCOME],
    sending: false,
    result: null,
    activeCompanyId: companyId,
  };
  emit();

  const noteId = `m-${Date.now()}`;
  setState((prev) => ({
    messages: [
      ...prev.messages,
      {
        id: noteId,
        role: "assistant",
        content: "",
        timestamp: new Date().toISOString(),
        kind: "loading",
      },
    ],
  }));
  setState({ sending: true });

  try {
    const dashboard = await workspaceService.getCompanyDashboard(companyId);

    if ("error" in dashboard) {
      patchMessage(noteId, { kind: "text", content: dashboard.error });
      return;
    }

    const analysis = await workspaceService.getAnalysis(dashboard.latest_analysis.analysis_id);
    setState({ result: analysis });

    patchMessage(noteId, {
      kind: "report",
      content: `Reopened your most recent session for ${dashboard.company.name}. This is a summary of the last saved analysis — the original chat messages for this session weren't stored, so this isn't the full transcript.`,
      report: reportFromAnalysis(analysis),
    });
  } catch (err) {
    patchMessage(noteId, {
      kind: "text",
      content:
        err instanceof ApiError
          ? err.message || "Could not reopen that session."
          : "Could not reach the backend. Make sure the FastAPI server is running.",
    });
  } finally {
    setState({ sending: false });
  }
}

function applyFinalResult(response: SupervisorResponse, assistantId: string) {
  if (response.agent === "sales_analysis") {
    const analysis = response.result.response as AnalyzeResponse;
    const companyId = String(analysis.company_id);

    // Re-key this thread under the company id so it's the "real" thread
    // for that company from now on — reopening it from Recent Sessions
    // (within this browser session) will show these actual messages.
    threads.delete(activeThreadKey);
    activeThreadKey = companyId;

    setState({ result: analysis, activeCompanyId: companyId });
    const assessment = analysis.overall_assessment;
    const replyContent =
      assessment?.overall_recommendation ||
      "Analysis complete — see the executive brief for the full breakdown.";

    patchMessage(assistantId, {
      kind: "report",
      content: replyContent,
      steps: undefined,
      chips: undefined,
      report: reportFromAnalysis(analysis),
    });
  } else {
    const researchResponse = response.result.response as { content?: string };
    const replyContent =
      researchResponse?.content ||
      (typeof response.result.response === "string" ? response.result.response : null) ||
      "Here's what I found.";

    patchMessage(assistantId, {
      kind: "text",
      content: replyContent,
      steps: undefined,
      chips: undefined,
    });
  }
}

export async function sendWorkspaceMessage(
  text: string,
  meta: { mode: WorkspaceMode; attachments: ComposerAttachment[] },
) {
  const userMessage: ChatMessage = {
    id: `m-${Date.now()}`,
    role: "user",
    content: text,
    timestamp: new Date().toISOString(),
    attachments: meta.attachments.map((a) => a.label),
  };
  const assistantId = `m-${Date.now() + 1}`;
  const assistantMessage: ChatMessage = {
    id: assistantId,
    role: "assistant",
    content: "",
    timestamp: new Date().toISOString(),
    kind: "loading",
  };

  setState((prev) => ({ messages: [...prev.messages, userMessage, assistantMessage] }));
  setState({ sending: true });

  const chips: string[] = meta.attachments.map((a) => CHIP_BY_KIND[a.kind]).filter(Boolean);
  const steps: WorkspaceStreamStep[] = [];
  let streaming = false;

  function upsertStep(evt: { id: string; label: string; status: WorkspaceStreamStep["status"]; agent?: string }) {
    const idx = steps.findIndex((s) => s.id === evt.id);
    const nextStep: WorkspaceStreamStep = { id: evt.id, label: evt.label, status: evt.status, agent: evt.agent };
    if (idx === -1) steps.push(nextStep);
    else steps[idx] = nextStep;

    if (evt.agent && !chips.includes(evt.agent)) chips.push(evt.agent);

    if (!streaming) {
      streaming = true;
      patchMessage(assistantId, { kind: "stream", steps: [...steps], chips: [...chips] });
    } else {
      patchMessage(assistantId, { steps: [...steps], chips: [...chips] });
    }
  }

  const controller = new AbortController();
  abortController = controller;

  // Build full context and history for follow-up chat questions
  let promptWithHistory = text;
  const currentMessages = state.messages.filter(
    (m) => m.id !== userMessage.id && m.id !== assistantId && m.id !== "welcome"
  );

  if (currentMessages.length > 0 || state.result) {
    const companyName =
      state.result?.overall_assessment?.company ||
      state.result?.knowledge?.company ||
      "Target Account";

    const historyStr = currentMessages
      .slice(-6)
      .map((m) => {
        if (m.kind === "report" && m.report?.company) {
          return `Assistant: [Analysis Report for ${m.report.company}] Recommendation: ${m.report.recommendation || ""}. Buying Stage: ${m.report.buyingStage || ""}. Risk Level: ${m.report.riskLevel || ""}.`;
        }
        return `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`;
      })
      .join("\n");

    promptWithHistory = `[Active Company Context: ${companyName}]\n[Prior Conversation History]:\n${historyStr}\n\n[User Follow-Up Question]:\n${text}`;
  }

  try {
    await workspaceService.streamSupervisor(
      promptWithHistory,
      (frame: StreamFrame) => {
        if (frame.type === "step") {
          upsertStep(frame.data);
        } else if (frame.type === "final") {
          applyFinalResult(frame.data, assistantId);
        } else if (frame.type === "error") {
          patchMessage(assistantId, {
            kind: "text",
            content: `The pipeline returned an error: ${frame.data.message}`,
            steps: undefined,
            chips: undefined,
          });
        }
      },
      controller.signal,
    );
  } catch (err) {
    const message =
      err instanceof ApiError
        ? `The pipeline returned an error: ${err.message}`
        : "Could not reach the backend. Make sure the FastAPI server is running.";

    patchMessage(assistantId, {
      kind: "text",
      content: message,
      steps: undefined,
      chips: undefined,
    });
  } finally {
    abortController = null;
    setState({ sending: false });
  }
}