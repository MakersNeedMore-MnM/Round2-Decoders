"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, Loader2, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { accountsService } from "@/services/accounts.service";
import { ApiError } from "@/services/api-client";
import { fetchWithCache, getCached, setCached } from "@/lib/data-cache";
import type { Company, ResearchStatus } from "@/types";

const COMPANIES_CACHE_KEY = "workspace:companies";

const STATUS_VARIANT: Record<ResearchStatus, "success" | "warning" | "outline"> = {
  analyzed: "success",
  "in-review": "warning",
  queued: "outline",
};

const STATUS_LABEL: Record<ResearchStatus, string> = {
  analyzed: "Analyzed",
  "in-review": "In review",
  queued: "Queued",
};

export function AccountsTable() {
  // Seed from cache synchronously so a repeat visit paints instantly.
  const [companies, setCompanies] = useState<Company[]>(
    () => getCached<Company[]>(COMPANIES_CACHE_KEY) ?? [],
  );
  const [loading, setLoading] = useState(() => getCached<Company[]>(COMPANIES_CACHE_KEY) === undefined);
  const [error, setError] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await fetchWithCache(COMPANIES_CACHE_KEY, () => accountsService.list(), {
          onRevalidate: (fresh) => {
            if (!cancelled) setCompanies(fresh);
          },
        });
        if (!cancelled) {
          setCompanies(data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : "Could not reach the backend to load accounts.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleDelete(companyId: string) {
    setDeletingId(companyId);
    setDeleteError(null);

    try {
      await accountsService.deleteCompany(companyId);

      const updated = companies.filter((c) => c.id !== companyId);
      setCompanies(updated);
      setCached(COMPANIES_CACHE_KEY, updated);
    } catch (err) {
      setDeleteError(
        err instanceof ApiError
          ? err.message
          : "Could not delete this account's research.",
      );
    } finally {
      setDeletingId(null);
      setConfirmingId(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Accounts</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {loading && (
          <div className="flex items-center gap-2 px-5 py-8 text-sm text-white/40">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading accounts…
          </div>
        )}

        {!loading && error && (
          <p className="px-5 py-8 text-sm text-red-400">{error}</p>
        )}

        {deleteError && (
          <p className="border-t border-red-500/20 bg-red-500/5 px-5 py-2 text-xs text-red-400">
            {deleteError}
          </p>
        )}

        {!loading && !error && companies.length === 0 && (
          <p className="px-5 py-8 text-sm text-white/40">
            No accounts yet — run a company brief through the AI Workspace chat to see it show up
            here.
          </p>
        )}

        {!loading && !error && companies.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-y border-white/6 text-[11px] uppercase tracking-wider text-white/30">
                  <th className="px-5 py-3 font-medium">Company</th>
                  <th className="px-5 py-3 font-medium">Industry</th>
                  <th className="px-5 py-3 font-medium">Employees</th>
                  <th className="px-5 py-3 font-medium">Trust score</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3" />
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {companies.map((company, i) => (
                  <motion.tr
                    key={company.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="group border-b border-white/4 transition-colors hover:bg-white/[0.02]"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="h-7 w-7">
                          <AvatarFallback>{company.logoInitial}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-white/85">{company.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-white/45">{company.industry}</td>
                    <td className="px-5 py-3.5 text-white/45">{company.employees}</td>
                    <td className="px-5 py-3.5">
                      <span
                        className={
                          company.score >= 80
                            ? "text-emerald-400"
                            : company.score >= 60
                              ? "text-amber-400"
                              : "text-red-400"
                        }
                      >
                        {company.score}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge variant={STATUS_VARIANT[company.status]}>{STATUS_LABEL[company.status]}</Badge>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        href={`/accounts/${company.id}`}
                        className="inline-flex items-center gap-1 text-xs text-white/35 opacity-0 transition-opacity group-hover:opacity-100 hover:text-white"
                      >
                        View report <ArrowUpRight className="h-3 w-3" />
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {confirmingId === company.id ? (
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-[11px] text-white/40">Delete all research?</span>
                          <button
                            onClick={() => handleDelete(company.id)}
                            disabled={deletingId === company.id}
                            className="rounded-md bg-red-500/15 px-2 py-1 text-[11px] font-medium text-red-400 transition-colors hover:bg-red-500/25 disabled:opacity-50"
                          >
                            {deletingId === company.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              "Confirm"
                            )}
                          </button>
                          <button
                            onClick={() => setConfirmingId(null)}
                            disabled={deletingId === company.id}
                            className="rounded-md px-2 py-1 text-[11px] text-white/40 transition-colors hover:text-white/70 disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmingId(company.id)}
                          className="inline-flex items-center gap-1 text-xs text-white/25 opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-400"
                          title="Delete all research on this company"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}