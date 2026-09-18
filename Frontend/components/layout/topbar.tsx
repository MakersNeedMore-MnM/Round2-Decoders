"use client";

import { usePathname } from "next/navigation";
import { Search, Menu } from "lucide-react";
import { NotificationPopover } from "@/components/layout/notification-popover";
import { NAV_ITEMS } from "@/lib/constants";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useCurrentUser } from "@/components/auth/auth-guard";
import Link from "next/link";

function initials(name: string) {
  return name
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "?";
}

export function Topbar({
  onOpenPalette,
  onOpenMobileNav,
}: {
  onOpenPalette: () => void;
  onOpenMobileNav: () => void;
}) {
  const pathname = usePathname();
  const current = NAV_ITEMS.find((item) => pathname?.startsWith(item.href));
  const user = useCurrentUser();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/6 bg-[#090909]/70 px-4 backdrop-blur-xl sm:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileNav}
          className="rounded-xl border border-white/8 bg-white/[0.02] p-2 text-white/60 hover:text-white hover:border-white/15 transition-colors lg:hidden"
        >
          <Menu className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </button>
        <div>
          <p className="text-[11px] uppercase tracking-widest text-white/30">ProspectIQ</p>
          <h1 className="text-[17px] font-semibold text-white/90">{current?.label ?? "Overview"}</h1>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={onOpenPalette}
          className="flex items-center gap-2 rounded-xl border border-white/8 bg-white/[0.02] px-2.5 py-2 text-xs text-white/40 hover:text-white/70 hover:border-white/15 transition-colors sm:px-3"
        >
          <Search className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Search or jump to...</span>
          <kbd className="ml-1 hidden rounded border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[10px] sm:inline">
            ⌘K
          </kbd>
        </button>
        <NotificationPopover />
        <Link
          href="/profile"
          className="lg:hidden rounded-full transition-opacity hover:opacity-80"
        >
          <Avatar className="h-8 w-8">
            <AvatarFallback>{user ? initials(user.username) : "?"}</AvatarFallback>
          </Avatar>
        </Link>
      </div>
    </header>
  );
}