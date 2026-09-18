"use client";

import { useSyncExternalStore } from "react";
import { Plus } from "lucide-react";
import { ChatPanel } from "@/components/workspace/chat-panel";
import { ExecutiveBriefPanel, HistorySidebar } from "@/components/workspace/executive-brief-panel";
import {
  getWorkspaceState,
  selectCompanySession,
  sendWorkspaceMessage,
  startNewChat,
  subscribeWorkspace,
} from "@/lib/workspace-store";

export function WorkspaceClient() {
  // Subscribing to a module-level store (not local useState) means the
  // conversation, streaming steps, and executive brief all survive
  // navigating away to another page and back — only a full page reload
  // resets them.
  const { messages, sending, result, activeCompanyId } = useSyncExternalStore(
    subscribeWorkspace,
    getWorkspaceState,
    getWorkspaceState,
  );

  return (
    <div className="grid min-h-0 flex-1 grid-cols-1 gap-5 lg:grid-cols-[240px_1fr_300px]">
      <div className="hidden min-h-0 lg:flex lg:flex-col lg:gap-3">
        <button
          type="button"
          onClick={startNewChat}
          className="flex shrink-0 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-[13px] font-medium text-white/70 transition-colors hover:bg-white/[0.06] hover:text-white/90"
        >
          <Plus className="h-4 w-4" />
          New Chat
        </button>
        <div className="min-h-0 flex-1">
          <HistorySidebar onSelectCompany={selectCompanySession} activeCompanyId={activeCompanyId} />
        </div>
      </div>

      <div className="min-h-0">
        <ChatPanel messages={messages} onSend={sendWorkspaceMessage} sending={sending} />
      </div>

      <div className="hidden min-h-0 overflow-y-auto pr-1 lg:block">
        <ExecutiveBriefPanel
          assessment={result?.overall_assessment ?? null}
          knowledge={result?.knowledge ?? null}
          guardrail={(result?.guardrail as Record<string, unknown> | undefined) ?? null}
        />
      </div>
    </div>
  );
}