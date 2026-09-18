"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { AuroraBackground } from "@/components/backgrounds/aurora-background";
import { CommandPalette } from "@/components/command-palette/command-palette";
import { useCommandPalette } from "@/hooks/use-command-palette";
import { TooltipProvider } from "@/components/ui/tooltip";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { open, setOpen } = useCommandPalette();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="relative flex h-dvh overflow-hidden">
        <AuroraBackground />
        <Sidebar onOpenPalette={() => setOpen(true)} />
        <MobileNav open={mobileNavOpen} onOpenChange={setMobileNavOpen} />
        <div className="flex h-full min-h-0 flex-1 flex-col overflow-x-hidden">
          <Topbar onOpenPalette={() => setOpen(true)} onOpenMobileNav={() => setMobileNavOpen(true)} />
          <main className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-5 sm:px-5 sm:py-6 lg:px-8 lg:py-8">
            {children}
          </main>
        </div>
        <CommandPalette open={open} onOpenChange={setOpen} />
      </div>
    </TooltipProvider>
  );
}