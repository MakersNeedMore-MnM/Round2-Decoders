"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PromptComposer, type ComposerAttachment, type WorkspaceMode } from "@/components/workspace/prompt-composer";
import { ResearchLoader } from "@/components/workspace/research-loader";
import { StreamSteps } from "@/components/workspace/stream-steps";
import { ReportReadyCard } from "@/components/workspace/report-ready-card";
import type { ChatMessage } from "@/types";
import { cn } from "@/lib/utils";

interface ChatPanelProps {
  messages: ChatMessage[];
  onSend: (text: string, meta: { mode: WorkspaceMode; attachments: ComposerAttachment[] }) => void | Promise<void>;
  sending?: boolean;
}

export function ChatPanel({ messages, onSend, sending }: ChatPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  return (
    <div className="flex h-full flex-col rounded-2xl border border-white/8 bg-[#111111]">
      <div className="flex shrink-0 items-center gap-2 border-b border-white/6 px-4 py-3.5">
        <Sparkles className="h-4 w-4 text-white/50" />
        <span className="text-[15px] font-semibold text-white/85">Research Assistant</span>
      </div>

      <ScrollArea className="min-h-0 flex-1 px-4 py-5">
        <div className="space-y-6">
          <AnimatePresence initial={false}>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn("flex gap-3", message.role === "user" && "flex-row-reverse")}
              >
                <Avatar className="h-7 w-7 shrink-0">
                  <AvatarFallback>{message.role === "user" ? "You" : "IQ"}</AvatarFallback>
                </Avatar>

                <div
                  className={cn(
                    "max-w-[82%] rounded-2xl px-4 py-3 text-[14.5px] leading-relaxed",
                    message.role === "user"
                      ? "bg-white/[0.08] text-white/90"
                      : "border border-white/6 bg-white/[0.03] text-white/70",
                  )}
                >
                  {message.role === "user" ? (
                    <div className="space-y-2">
                      <p className="whitespace-pre-wrap">{message.content}</p>
                      {message.attachments && message.attachments.length > 0 && (
                        <div className="flex flex-wrap justify-end gap-1.5">
                          {message.attachments.map((label) => (
                            <span
                              key={label}
                              className="rounded-full border border-white/15 bg-white/[0.06] px-2 py-0.5 text-[10px] font-medium text-white/60"
                            >
                              {label}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : message.kind === "loading" ? (
                    <ResearchLoader />
                  ) : message.kind === "stream" ? (
                    <StreamSteps steps={message.steps ?? []} chips={message.chips ?? []} />
                  ) : message.kind === "report" ? (
                    <div className="space-y-1">
                      <p className="whitespace-pre-wrap text-white/75">{message.content}</p>
                      {message.report && <ReportReadyCard report={message.report} />}
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      <div className="shrink-0">
        <PromptComposer onSend={onSend} sending={sending} />
      </div>
    </div>
  );
}
