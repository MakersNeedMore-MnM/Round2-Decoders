import type {
  AuditEvent,
  BuyingSignal,
  ChatMessage,
  Company,
  OutreachDraft,
  PainPoint,
  PainPointsByIndustryPoint,
  RelationshipEdge,
  RelationshipNode,
  ResearchActivityPoint,
  ResearchStatusSlice,
  Stakeholder,
  TrustDistributionPoint,
} from "@/types";

export const MOCK_COMPANIES: Company[] = [
  { id: "anthropic", name: "Anthropic", industry: "AI Research", employees: "800+", revenue: "$300M ARR", score: 94, status: "analyzed", country: "USA", logoInitial: "A" },
  { id: "databricks", name: "Databricks", industry: "Data Platform", employees: "6,000+", revenue: "$1.6B ARR", score: 87, status: "in-review", country: "USA", logoInitial: "D" },
  { id: "figma", name: "Figma", industry: "Design Tools", employees: "1,200+", revenue: "$600M ARR", score: 79, status: "queued", country: "USA", logoInitial: "F" },
  { id: "notion", name: "Notion", industry: "Productivity", employees: "700+", revenue: "$250M ARR", score: 82, status: "analyzed", country: "USA", logoInitial: "N" },
  { id: "vercel", name: "Vercel", industry: "Cloud Infra", employees: "500+", revenue: "$150M ARR", score: 91, status: "analyzed", country: "USA", logoInitial: "V" },
  { id: "linear", name: "Linear", industry: "Productivity", employees: "150+", revenue: "$70M ARR", score: 88, status: "analyzed", country: "USA", logoInitial: "L" },
  { id: "ramp", name: "Ramp", industry: "Fintech", employees: "1,000+", revenue: "$700M ARR", score: 85, status: "in-review", country: "USA", logoInitial: "R" },
  { id: "scale", name: "Scale AI", industry: "AI Research", employees: "900+", revenue: "$400M ARR", score: 76, status: "queued", country: "USA", logoInitial: "S" },
];

export const MOCK_STAKEHOLDERS: Stakeholder[] = [
  {
    id: "sarah-chen",
    name: "Sarah Chen",
    title: "Chief Technology Officer",
    dept: "Engineering",
    influence: "Decision Maker",
    score: 96,
    linkedin: true,
    email: "sc@company.com",
    companyId: "anthropic",
    evidence: ["Quoted in Q3 engineering blog on platform strategy", "Speaker at InfraCon 2025"],
    painPoints: ["Data Silos Across Engineering Teams"],
    buyingSignals: ["Posted 3 open reqs for platform integrations"],
  },
  {
    id: "marcus-webb",
    name: "Marcus Webb",
    title: "VP of Engineering",
    dept: "Engineering",
    influence: "Champion",
    score: 88,
    linkedin: true,
    email: "mw@company.com",
    companyId: "anthropic",
    evidence: ["Engaged with 2 competitor case studies on LinkedIn"],
    painPoints: ["Slow Time-to-Insight for Product Teams"],
    buyingSignals: ["Attended enterprise AI tooling webinar"],
  },
  {
    id: "priya-nair",
    name: "Priya Nair",
    title: "Head of Data Platform",
    dept: "Data",
    influence: "Champion",
    score: 83,
    linkedin: true,
    email: "pn@company.com",
    companyId: "anthropic",
    evidence: ["Authored internal RFC referencing tooling fragmentation"],
    painPoints: ["Data Silos Across Engineering Teams"],
    buyingSignals: ["Team headcount grew 40% YoY"],
  },
  {
    id: "daniel-torres",
    name: "Daniel Torres",
    title: "CFO",
    dept: "Finance",
    influence: "Budget Holder",
    score: 91,
    linkedin: false,
    email: "dt@company.com",
    companyId: "anthropic",
    evidence: ["Public earnings call mention of infra investment"],
    painPoints: ["Compliance & Security Gaps in Data Access"],
    buyingSignals: ["Approved increased tooling budget for FY26"],
  },
];

export const MOCK_PAIN_POINTS: PainPoint[] = [
  { id: "pp-1", title: "Data Silos Across Engineering Teams", severity: "critical", confidence: 94, sources: 3, excerpt: "Engineering blog post references fragmented tooling as a key platform-strategy challenge.", companyId: "anthropic" },
  { id: "pp-2", title: "Slow Time-to-Insight for Product Teams", severity: "high", confidence: 87, sources: 5, excerpt: "Multiple reviews from former engineers cite long delays to get meaningful analytics.", companyId: "anthropic" },
  { id: "pp-3", title: "Compliance & Security Gaps in Data Access", severity: "medium", confidence: 71, sources: 2, excerpt: "Recent audit documentation references manual approval workflows for data access requests.", companyId: "anthropic" },
  { id: "pp-4", title: "Manual Reporting Overhead", severity: "high", confidence: 80, sources: 4, excerpt: "Job postings for analysts mention heavy spreadsheet-based reporting workloads.", companyId: "databricks" },
];

export const MOCK_BUYING_SIGNALS: BuyingSignal[] = [
  { id: "bs-1", title: "New VP of Platform hired", strength: "strong", detectedAt: "2026-07-28", source: "LinkedIn" },
  { id: "bs-2", title: "RFP activity detected for data tooling", strength: "strong", detectedAt: "2026-07-26", source: "Public filings" },
  { id: "bs-3", title: "Engineering team grew 18% this quarter", strength: "moderate", detectedAt: "2026-07-20", source: "Headcount tracker" },
];

export const MOCK_AUDIT_EVENTS: AuditEvent[] = [
  { id: "1", event: "Research Session Started", agent: "Orchestrator", time: "2 min ago", timestamp: "2026-08-01T09:58:00Z", detail: "Initiated deep research for Anthropic PBC. Session ID: sess_9x2k", status: "info" },
  { id: "2", event: "Website Crawled", agent: "WebCrawler", time: "2 min ago", timestamp: "2026-08-01T09:58:30Z", detail: "Crawled 147 pages including careers, blog, engineering docs. Extracted 12,400 tokens.", status: "success" },
  { id: "3", event: "Stakeholders Identified", agent: "PeopleIntel", time: "1 min ago", timestamp: "2026-08-01T09:59:10Z", detail: "Found 4 decision makers via LinkedIn, org charts, and conference speaker bios.", status: "success" },
  { id: "4", event: "Pain Point Detected", agent: "ReasonEngine", time: "1 min ago", timestamp: "2026-08-01T09:59:40Z", detail: "High-confidence signal: data infrastructure fragmentation. Evidence from 3 independent sources.", status: "success" },
  { id: "5", event: "Unsupported Claim Blocked", agent: "GuardrailAgent", time: "50s ago", timestamp: "2026-08-01T09:59:55Z", detail: "Rejected a personalization line referencing an unverifiable funding round. Draft returned for revision.", status: "warning" },
  { id: "6", event: "Strategy Generated", agent: "StrategyAI", time: "45s ago", timestamp: "2026-08-01T10:00:00Z", detail: "Generated executive brief with recommended 90-day sales motion. Confidence: 91%.", status: "success" },
  { id: "7", event: "Human Approval Requested", agent: "QueueManager", time: "30s ago", timestamp: "2026-08-01T10:00:20Z", detail: "Outreach draft sent to approval queue. Assigned to: Alex Kim (AE Lead).", status: "info" },
];

export const MOCK_CHAT: ChatMessage[] = [
  { id: "m1", role: "user", content: "Research Anthropic and prep an outreach plan for their platform team.", timestamp: "2026-08-01T09:57:40Z" },
  { id: "m2", role: "assistant", content: "Starting deep research on Anthropic. I'll pull public sources, identify stakeholders, and surface pain points before drafting anything for approval.", timestamp: "2026-08-01T09:57:45Z" },
  { id: "m3", role: "assistant", content: "Found 4 likely stakeholders and 3 evidence-backed pain points. Drafting a confidence-scored executive brief now.", timestamp: "2026-08-01T09:59:50Z" },
];

export const MOCK_OUTREACH: OutreachDraft[] = [
  {
    id: "od-1",
    companyId: "anthropic",
    companyName: "Anthropic",
    stakeholderName: "Sarah Chen",
    stakeholderEmail: "sarah.chen@anthropic.com",
    emailVerified: true,
    emailMxDomain: "anthropic.com",
    channel: "email",
    subject: "Closing the data-silo gap before your next platform review",
    body: "Hi Sarah — noticed your Q3 engineering post on fragmented tooling across teams. A few platform-focused companies your size have closed that gap in one quarter without a rip-and-replace...",
    confidence: 91,
    reasoning: "Grounded in a public engineering blog post (pain point) and a recent budget approval (buying signal). No unverified claims.",
    evidence: ["Q3 engineering blog: 'fragmented tooling'", "FY26 tooling budget approval (earnings call)"],
    status: "pending",
    createdAt: "2026-08-01T10:00:20Z",
  },
  {
    id: "od-2",
    companyId: "databricks",
    companyName: "Databricks",
    stakeholderName: "Priya Nair",
    stakeholderEmail: null,
    emailVerified: false,
    emailMxDomain: null,
    channel: "linkedin",
    subject: "Cutting manual reporting overhead for data platform teams",
    body: "Hi Priya — saw the Head of Data Platform posting and the analyst reqs referencing spreadsheet-heavy reporting. Curious how your team is thinking about automating that this half...",
    confidence: 78,
    reasoning: "Grounded in job posting language; moderate confidence because seniority of decision authority is inferred, not confirmed.",
    evidence: ["Analyst job postings mentioning spreadsheet reporting"],
    status: "pending",
    createdAt: "2026-07-31T14:10:00Z",
  },
  {
    id: "od-3",
    companyId: "vercel",
    companyName: "Vercel",
    stakeholderName: "James Ito",
    stakeholderEmail: "james.ito@vercel.com",
    emailVerified: true,
    emailMxDomain: "vercel.com",
    channel: "email",
    subject: "Following up on your infra scaling roadmap",
    body: "Hi James — following up after your talk at InfraCon on scaling constraints. Would love to share how similar infra teams tackled the same bottleneck...",
    confidence: 85,
    reasoning: "Grounded in a public conference talk. Approved and sent as a test email during the demo window.",
    evidence: ["InfraCon 2025 talk transcript"],
    status: "approved",
    createdAt: "2026-07-29T11:00:00Z",
  },
];

export const MOCK_NODES: RelationshipNode[] = [
  { id: "sarah-chen", name: "Sarah Chen", title: "CTO", influence: "Decision Maker", confidence: 96, evidence: ["Q3 engineering blog on platform strategy", "InfraCon 2025 speaker"], painPoints: ["Data Silos Across Engineering Teams"], buyingSignals: ["3 open platform-integration reqs"] },
  { id: "marcus-webb", name: "Marcus Webb", title: "VP Engineering", influence: "Champion", confidence: 88, evidence: ["Engaged with competitor case studies"], painPoints: ["Slow Time-to-Insight for Product Teams"], buyingSignals: ["Attended enterprise AI tooling webinar"] },
  { id: "priya-nair", name: "Priya Nair", title: "Head of Data Platform", influence: "Champion", confidence: 83, evidence: ["Authored internal RFC on tooling fragmentation"], painPoints: ["Data Silos Across Engineering Teams"], buyingSignals: ["Team headcount +40% YoY"] },
  { id: "daniel-torres", name: "Daniel Torres", title: "CFO", influence: "Budget Holder", confidence: 91, evidence: ["Earnings call mention of infra investment"], painPoints: ["Compliance & Security Gaps"], buyingSignals: ["Approved FY26 tooling budget"] },
  { id: "alex-kim", name: "Alex Kim", title: "Director of Security", influence: "Blocker", confidence: 64, evidence: ["SOC 2 audit doc mentions manual approvals"], painPoints: ["Compliance & Security Gaps in Data Access"], buyingSignals: [] },
];

export const MOCK_EDGES: RelationshipEdge[] = [
  { id: "e1", source: "sarah-chen", target: "marcus-webb", label: "reports to" },
  { id: "e2", source: "priya-nair", target: "marcus-webb", label: "reports to" },
  { id: "e3", source: "marcus-webb", target: "daniel-torres", label: "budget approval" },
  { id: "e4", source: "sarah-chen", target: "daniel-torres", label: "co-sponsors" },
  { id: "e5", source: "alex-kim", target: "daniel-torres", label: "advises" },
];

export const MOCK_RESEARCH_STATUS: ResearchStatusSlice[] = [
  { status: "analyzed", count: 14 },
  { status: "in-review", count: 6 },
  { status: "queued", count: 9 },
];

export const MOCK_PAIN_POINTS_BY_INDUSTRY: PainPointsByIndustryPoint[] = [
  { industry: "AI Research", count: 12 },
  { industry: "Data Platform", count: 9 },
  { industry: "Fintech", count: 7 },
  { industry: "Productivity", count: 10 },
  { industry: "Cloud Infra", count: 6 },
];

export const MOCK_RESEARCH_ACTIVITY: ResearchActivityPoint[] = [
  { date: "Mon", analyses: 4 },
  { date: "Tue", analyses: 7 },
  { date: "Wed", analyses: 5 },
  { date: "Thu", analyses: 9 },
  { date: "Fri", analyses: 12 },
  { date: "Sat", analyses: 6 },
  { date: "Sun", analyses: 8 },
];

export const MOCK_TRUST_DISTRIBUTION: TrustDistributionPoint[] = [
  { bucket: "0-20", count: 1 },
  { bucket: "21-40", count: 2 },
  { bucket: "41-60", count: 5 },
  { bucket: "61-80", count: 11 },
  { bucket: "81-100", count: 10 },
];

export function getCompanyById(id: string): Company | undefined {
  return MOCK_COMPANIES.find((c) => c.id === id);
}

export function getStakeholdersByCompany(companyId: string): Stakeholder[] {
  return MOCK_STAKEHOLDERS.filter((s) => s.companyId === companyId);
}

export function getPainPointsByCompany(companyId: string): PainPoint[] {
  return MOCK_PAIN_POINTS.filter((p) => p.companyId === companyId);
}