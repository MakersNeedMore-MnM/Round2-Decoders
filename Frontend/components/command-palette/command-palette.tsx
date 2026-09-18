"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  FileSearch,
  FileDown,
  Share2,
  ListChecks,
  ScrollText,
  Settings,
  Sparkles,
  BookOpen,
  Bot,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { accountsService } from "@/services/accounts.service";
import type { Company } from "@/types";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);

  // Load real accounts (backed by GET /workspace/) the moment the
  // palette opens, rather than on every keystroke — this is a small
  // list per user, so one fetch per open is enough.
  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setLoading(true);

    accountsService
      .list()
      .then((data) => {
        if (!cancelled) setCompanies(data);
      })
      .catch(() => {
        if (!cancelled) setCompanies([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open]);

  const go = (href: string) => {
    router.push(href);
    onOpenChange(false);
  };

  const recentAnalyzed = companies.filter((c) => c.status === "analyzed").slice(0, 3);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search a company, jump to a page, or run a command..." />
      <CommandList>
        <CommandEmpty>{loading ? "Loading accounts…" : "No results found."}</CommandEmpty>

        <CommandGroup heading="Search Company">
          {companies.length === 0 && !loading && (
            <CommandItem disabled onSelect={() => {}}>
              <Building2 className="h-4 w-4 text-white/40" />
              <span>No companies analyzed yet</span>
            </CommandItem>
          )}
          {companies.slice(0, 5).map((company) => (
            <CommandItem key={company.id} onSelect={() => go(`/accounts/${company.id}`)}>
              <Building2 className="h-4 w-4 text-white/40" />
              <span>{company.name}</span>
              <CommandShortcut>{company.industry}</CommandShortcut>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Recent Accounts">
          {recentAnalyzed.length === 0 && !loading && (
            <CommandItem disabled onSelect={() => {}}>
              <FileSearch className="h-4 w-4 text-white/40" />
              <span>Nothing analyzed yet</span>
            </CommandItem>
          )}
          {recentAnalyzed.map((company) => (
            <CommandItem key={`recent-${company.id}`} onSelect={() => go(`/accounts/${company.id}`)}>
              <FileSearch className="h-4 w-4 text-white/40" />
              <span>{company.name} — Executive Report</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => go("/workspace")}>
            <Sparkles className="h-4 w-4 text-white/40" />
            <span>New Analysis</span>
          </CommandItem>
          <CommandItem onSelect={() => go("/accounts")}>
            <FileDown className="h-4 w-4 text-white/40" />
            <span>Export Report</span>
          </CommandItem>
          <CommandItem onSelect={() => go("/graph")}>
            <Share2 className="h-4 w-4 text-white/40" />
            <span>Relationship Graph</span>
          </CommandItem>
          <CommandItem onSelect={() => go("/queue")}>
            <ListChecks className="h-4 w-4 text-white/40" />
            <span>Outreach Queue</span>
          </CommandItem>
          <CommandItem onSelect={() => go("/agent-room")}>
            <Bot className="h-4 w-4 text-cyan-400" />
            <span>Agent Discussion Room</span>
          </CommandItem>
          <CommandItem onSelect={() => go("/audit")}>
            <ScrollText className="h-4 w-4 text-white/40" />
            <span>Audit Trail</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="System">
          <CommandItem onSelect={() => go("/profile")}>
            <Settings className="h-4 w-4 text-white/40" />
            <span>Settings</span>
          </CommandItem>
          <CommandItem onSelect={() => window.open("https://docs.prospectiq.app", "_blank")}>
            <BookOpen className="h-4 w-4 text-white/40" />
            <span>Documentation</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}