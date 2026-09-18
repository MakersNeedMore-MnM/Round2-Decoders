"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, CheckCircle2, Clock, Mail, Sparkles, Check, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { queueService } from "@/services/queue.service";
import { workspaceService } from "@/services/workspace.service";

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  timestamp: number;
  type: "queue" | "analysis" | "system";
  href: string;
  read: boolean;
}

export function NotificationPopover() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Load read notification IDs from localStorage
    try {
      const stored = localStorage.getItem("prospectiq_read_notifications");
      if (stored) {
        setReadIds(new Set(JSON.parse(stored)));
      }
    } catch {}

    loadNotifications();
  }, []);

  async function loadNotifications() {
    setLoading(true);
    const items: NotificationItem[] = [];

    try {
      // 1. Fetch pending outreach drafts
      const drafts = await queueService.list().catch(() => []);
      const pendingDrafts = drafts.filter((d) => d.status === "pending");
      
      if (pendingDrafts.length > 0) {
        items.push({
          id: `queue-pending-${pendingDrafts.length}`,
          title: `${pendingDrafts.length} Outreach Draft${pendingDrafts.length > 1 ? "s" : ""} Pending Review`,
          description: `You have ${pendingDrafts.length} generated email draft${pendingDrafts.length > 1 ? "s" : ""} waiting for approval in the Queue.`,
          time: "Action required",
          timestamp: Date.now(),
          type: "queue",
          href: "/queue",
          read: false,
        });
      }

      // 2. Fetch recent analysis history
      const history = await workspaceService.getAnalysisHistory().catch(() => []);
      if (history.length > 0) {
        const latest = history[0];
        const companyName = latest.company_name || latest.company || "Company";
        items.push({
          id: `analysis-${latest.analysis_id || latest.id}`,
          title: `Intelligence Analysis Ready`,
          description: `Sales intelligence & persona analysis completed for ${companyName}.`,
          time: "Recently completed",
          timestamp: new Date(latest.created_at || Date.now()).getTime(),
          type: "analysis",
          href: `/workspace?company=${latest.company_id || ""}`,
          read: false,
        });
      }
    } catch {
      // Ignore errors silently for notification popover
    }

    // Default system notification if list is short
    items.push({
      id: "system-welcome",
      title: "ProspectIQ Engine Online",
      description: "Multi-agent sales pipeline active. Real-time enrichment ready.",
      time: "System",
      timestamp: Date.now() - 3600000,
      type: "system",
      href: "/workspace",
      read: false,
    });

    setNotifications(items);
    setLoading(false);
  }

  function markAsRead(id: string, e?: React.MouseEvent) {
    if (e) e.stopPropagation();
    const updated = new Set(readIds);
    updated.add(id);
    setReadIds(updated);
    try {
      localStorage.setItem("prospectiq_read_notifications", JSON.stringify(Array.from(updated)));
    } catch {}
  }

  function markAllAsRead() {
    const allIds = notifications.map((n) => n.id);
    const updated = new Set([...Array.from(readIds), ...allIds]);
    setReadIds(updated);
    try {
      localStorage.setItem("prospectiq_read_notifications", JSON.stringify(Array.from(updated)));
    } catch {}
  }

  const unreadCount = notifications.filter((n) => !readIds.has(n.id)).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="relative rounded-xl border border-white/8 bg-white/[0.02] p-2.5 text-white/50 hover:text-white/80 hover:border-white/15 transition-colors focus:outline-none">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-cyan-500 text-[9px] font-bold text-black shadow-sm animate-pulse">
              {unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-80 sm:w-96 rounded-2xl border border-white/10 bg-[#121212]/95 p-0 backdrop-blur-2xl shadow-2xl z-50"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-white">Notifications</h3>
            {unreadCount > 0 && (
              <span className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-[10px] font-medium text-cyan-400 border border-cyan-500/20">
                {unreadCount} new
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-[11px] font-medium text-white/40 hover:text-cyan-400 transition-colors flex items-center gap-1"
            >
              <Check className="h-3 w-3" /> Mark all read
            </button>
          )}
        </div>

        <div className="max-h-80 overflow-y-auto divide-y divide-white/5 p-1">
          {notifications.length === 0 ? (
            <div className="py-8 text-center text-xs text-white/40">No notifications</div>
          ) : (
            notifications.map((item) => {
              const isRead = readIds.has(item.id);
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    markAsRead(item.id);
                    router.push(item.href);
                  }}
                  className={`group relative flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                    isRead ? "opacity-60 hover:opacity-100 hover:bg-white/[0.03]" : "bg-white/[0.03] hover:bg-white/[0.06]"
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {item.type === "queue" && (
                      <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400 border border-emerald-500/20">
                        <Mail className="h-4 w-4" />
                      </div>
                    )}
                    {item.type === "analysis" && (
                      <div className="rounded-lg bg-cyan-500/10 p-2 text-cyan-400 border border-cyan-500/20">
                        <Sparkles className="h-4 w-4" />
                      </div>
                    )}
                    {item.type === "system" && (
                      <div className="rounded-lg bg-violet-500/10 p-2 text-violet-400 border border-violet-500/20">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-xs font-medium truncate ${isRead ? "text-white/70" : "text-white font-semibold"}`}>
                        {item.title}
                      </p>
                      <span className="text-[10px] text-white/40 whitespace-nowrap">{item.time}</span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-white/50 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  {!isRead && (
                    <button
                      onClick={(e) => markAsRead(item.id, e)}
                      title="Mark as read"
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-white/30 hover:text-white"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="p-2 border-t border-white/8 bg-white/[0.01]">
          <Link
            href="/queue"
            className="block w-full text-center py-1.5 text-xs font-medium text-white/50 hover:text-cyan-400 transition-colors"
          >
            View Outreach Queue →
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
