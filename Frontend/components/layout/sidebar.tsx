"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutGrid,
  Building2,
  Share2,
  ListChecks,
  ScrollText,
  User,
  ChevronLeft,
  Command,
  Sparkles,
  Lightbulb,
} from "lucide-react";
import { NAV_ITEMS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useCurrentUser } from "@/components/auth/auth-guard";
import { Logo } from "@/components/common/logo";

const ICONS: Record<string, React.ElementType> = {
  workspace: Sparkles,
  accounts: Building2,
  graph: Share2,
  recommendations: Lightbulb,
  queue: ListChecks,
  audit: ScrollText,
};

export function Sidebar({ onOpenPalette }: { onOpenPalette: () => void }) {
  const pathname = usePathname();
  const user = useCurrentUser();

  const displayName = user?.username || "Account";
  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside className="hidden lg:flex h-full w-[248px] shrink-0 flex-col border-r border-white/6 bg-[#0b0b0b]/80 backdrop-blur-xl">
      <div className="px-5 py-6">
        <Logo height={30} priority />
      </div>

      <nav className="flex-1 space-y-1 px-3 overflow-y-auto min-h-0">
        {NAV_ITEMS.map((item) => {
          const Icon = ICONS[item.id] ?? LayoutGrid;
          const isActive = pathname?.startsWith(item.href);
          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[14px] transition-colors",
                isActive ? "text-white" : "text-white/45 hover:text-white/80 hover:bg-white/[0.03]",
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-xl bg-white/[0.06] border border-white/8"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                />
              )}
              <Icon className="relative h-4 w-4 shrink-0" />
              <span className="relative">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-3 pb-3">
        <button
          onClick={onOpenPalette}
          className="flex w-full items-center justify-between rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2 text-xs text-white/40 hover:text-white/70 hover:border-white/15 transition-colors"
        >
          <span className="flex items-center gap-2">
            <Command className="h-3.5 w-3.5" /> Command menu
          </span>
          <kbd className="rounded border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[10px]">
            ⌘K
          </kbd>
        </button>
      </div>

      <div className="border-t border-white/6 p-3">
        <Link
          href="/profile"
          className={cn(
            "flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm transition-colors",
            pathname?.startsWith("/profile")
              ? "bg-white/[0.06] text-white"
              : "text-white/50 hover:text-white/80 hover:bg-white/[0.03]",
          )}
        >
          <Avatar className="h-7 w-7">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col leading-tight">
            <span className="text-xs font-medium text-white/85">{displayName}</span>
            <span className="text-[10px] text-white/35">{user?.email ?? ""}</span>
          </div>
          <User className="ml-auto h-3.5 w-3.5 text-white/25" />
        </Link>
      </div>
    </aside>
  );
}

export function MobileSidebarToggleIcon() {
  return <ChevronLeft className="h-4 w-4" />;
}
