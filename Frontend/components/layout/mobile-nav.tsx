"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X, Building2, Share2, ListChecks, ScrollText, Sparkles, Lightbulb, LayoutGrid, User } from "lucide-react";
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

interface MobileNavProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Slide-in drawer nav for small screens. The desktop <Sidebar> is
 * `hidden` below the `lg` breakpoint, so without this there is no way
 * to reach Accounts/Graph/Queue/Audit on a phone at all.
 */
export function MobileNav({ open, onOpenChange }: MobileNavProps) {
  const pathname = usePathname();
  const user = useCurrentUser();

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 lg:hidden" />
        <DialogPrimitive.Content
          className={cn(
            "fixed inset-y-0 left-0 z-50 flex h-full w-[78vw] max-w-[280px] flex-col",
            "border-r border-white/10 bg-[#0b0b0b] shadow-premium",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left",
            "duration-200 lg:hidden",
          )}
        >
          <DialogPrimitive.Title className="sr-only">Navigation menu</DialogPrimitive.Title>

          <div className="flex items-center justify-between px-5 py-6">
            <Logo height={26} />
            <DialogPrimitive.Close className="rounded-lg p-1.5 text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors">
              <X className="h-4 w-4" />
              <span className="sr-only">Close menu</span>
            </DialogPrimitive.Close>
          </div>

          <nav className="flex-1 space-y-1 px-3 overflow-y-auto">
            {NAV_ITEMS.map((item) => {
              const Icon = ICONS[item.id] ?? LayoutGrid;
              const isActive = pathname?.startsWith(item.href);
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => onOpenChange(false)}
                  className={cn(
                    "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition-colors",
                    isActive
                      ? "bg-white/[0.06] border border-white/8 text-white"
                      : "text-white/45 hover:text-white/80 hover:bg-white/[0.03]",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-white/6 p-3">
            <Link
              href="/profile"
              onClick={() => onOpenChange(false)}
              className={cn(
                "flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm transition-colors",
                pathname?.startsWith("/profile")
                  ? "bg-white/[0.06] text-white"
                  : "text-white/50 hover:text-white/80 hover:bg-white/[0.03]",
              )}
            >
              <Avatar className="h-7 w-7">
                <AvatarFallback>
                  {(user?.username || "?").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col leading-tight">
                <span className="text-xs font-medium text-white/85">{user?.username || "Account"}</span>
                <span className="text-[10px] text-white/35">{user?.email ?? ""}</span>
              </div>
              <User className="ml-auto h-3.5 w-3.5 text-white/25" />
            </Link>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}