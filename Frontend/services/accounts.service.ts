import type { BuyingSignal, Company, PainPoint, Stakeholder, ResearchStatus } from "@/types";
import { getCompanyById } from "@/lib/mock-data";
import { workspaceService, type WorkspaceCompanySummary } from "./workspace.service";

export const DEFAULT_RECENT_SESSIONS: Company[] = [
  { id: "solstice", name: "Solstice Sunglasses", industry: "Retail & E-commerce", employees: "1,000+", revenue: "$150M", score: 30, status: "analyzed", country: "USA", logoInitial: "S" },
  { id: "adobe", name: "Adobe Inc.", industry: "Enterprise Software", employees: "29,000+", revenue: "$19.4B", score: 40, status: "analyzed", country: "USA", logoInitial: "A" },
  { id: "beardo", name: "Beardo", industry: "Consumer Goods", employees: "500+", revenue: "$50M", score: 10, status: "analyzed", country: "India", logoInitial: "B" },
  { id: "nimbus", name: "Nimbus Logistics", industry: "Supply Chain & Logistics", employees: "2,500+", revenue: "$320M", score: 60, status: "analyzed", country: "USA", logoInitial: "N" },
  { id: "tata", name: "Tata Group", industry: "Conglomerate", employees: "1,000,000+", revenue: "$150B", score: 20, status: "analyzed", country: "India", logoInitial: "T" },
  { id: "google", name: "Google", industry: "Technology", employees: "180,000+", revenue: "$307B", score: 80, status: "analyzed", country: "USA", logoInitial: "G" },
  { id: "microsoft", name: "Microsoft Corporation", industry: "Technology", employees: "220,000+", revenue: "$211B", score: 20, status: "analyzed", country: "USA", logoInitial: "M" },
];

function toCompany(summary: WorkspaceCompanySummary): Company {
  return {
    id: String(summary.company_id),
    name: summary.company || "Company",
    industry: summary.industry || "Technology",
    employees: "1,000+",
    revenue: "—",
    score: Math.round(summary.latest_intent ?? 50),
    status: (summary.total_analyses > 0 ? "analyzed" : "queued") as ResearchStatus,
    country: "USA",
    logoInitial: summary.company?.[0]?.toUpperCase() ?? "?",
  };
}

export const accountsService = {
  async list(): Promise<Company[]> {
    try {
      const summaries = await workspaceService.listCompanies();
      if (summaries && summaries.length > 0) {
        return summaries.map(toCompany);
      }
    } catch {}
    return DEFAULT_RECENT_SESSIONS;
  },

  async getById(id: string): Promise<Company | undefined> {
    const all = await accountsService.list();
    return all.find((c) => c.id === id) ?? getCompanyById(id);
  },

  async getStakeholders(companyId: string): Promise<Stakeholder[]> {
    return workspaceService.getStakeholders(companyId) as Promise<Stakeholder[]>;
  },

  async getPainPoints(companyId: string): Promise<PainPoint[]> {
    return workspaceService.getPainPoints(companyId) as Promise<PainPoint[]>;
  },

  async getBuyingSignals(companyId: string): Promise<BuyingSignal[]> {
    return workspaceService.getBuyingSignals(companyId) as Promise<BuyingSignal[]>;
  },

  async deleteCompany(companyId: string): Promise<{ success: boolean; message: string }> {
    return workspaceService.deleteCompany(companyId);
  },
};
