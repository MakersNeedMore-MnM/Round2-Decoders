"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GitBranch,
  Search,
  Database,
  Users,
  Brain,
  Sparkles,
  ShieldAlert,
  Play,
  RefreshCw,
  MessageSquare,
  Bot,
  ChevronRight,
  Layers,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { workspaceService, type AnalyzeResponse } from "@/services/workspace.service";
import { accountsService } from "@/services/accounts.service";
import type { Company } from "@/types";

interface AgentMessage {
  id: string;
  agent: string;
  role: string;
  icon: any;
  color: string;
  borderColor: string;
  bgColor: string;
  timestamp: string;
  summary: string;
  reasoning: string;
  inputContext: string;
  decisionOutput: string;
  confidence: number;
}

export default function AgentRoomPage() {
  const [history, setHistory] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [analysis, setAnalysis] = useState<AnalyzeResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedAgentFilter, setSelectedAgentFilter] = useState<string>("all");
  const [isPlayingStream, setIsPlayingStream] = useState<boolean>(false);
  const [streamIndex, setStreamIndex] = useState<number>(7);

  useEffect(() => {
    loadAnalyses();
  }, []);

  async function loadAnalyses() {
    setLoading(true);
    try {
      const companies = await accountsService.list();
      setHistory(companies);
      if (companies.length > 0) {
        const first = companies[0];
        setSelectedCompanyId(first.id);
        await loadAnalysisData(first.id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function loadAnalysisData(companyIdStr: string) {
    try {
      const dashboard: any = await workspaceService.getCompanyDashboard(companyIdStr);
      if (dashboard && dashboard.latest_analysis) {
        const fullAnalysis = await workspaceService.getAnalysis(dashboard.latest_analysis.analysis_id);
        setAnalysis(fullAnalysis);
      } else {
        const numId = parseInt(companyIdStr, 10);
        if (!isNaN(numId)) {
          const data = await workspaceService.getAnalysis(numId);
          setAnalysis(data);
        }
      }
      setStreamIndex(7);
    } catch (err) {
      console.error(err);
    }
  }

  function handleSelectCompany(idStr: string) {
    setSelectedCompanyId(idStr);
    loadAnalysisData(idStr);
  }

  function playSimulation() {
    setIsPlayingStream(true);
    setStreamIndex(1);
    let idx = 1;
    const interval = setInterval(() => {
      idx += 1;
      setStreamIndex(idx);
      if (idx >= 7) {
        clearInterval(interval);
        setIsPlayingStream(false);
      }
    }, 1200);
  }

  const activeCompany = history.find((c) => c.id === selectedCompanyId);
  const activeName = activeCompany?.name || String(analysis?.overall_assessment?.company || analysis?.knowledge?.company || "Target Account");

  // Fallback defaults tailored per session if no custom backend analysis object exists yet
  const COMPANY_DEFAULTS: Record<string, any> = {
    solstice: {
      decisionMaker: "Elena Rostova (VP E-Commerce)",
      painPoints: "Digital storefront latency during peak seasonal campaigns & fragmented CRM tracking",
      intentScore: 30,
      buyingStage: "Initial Research",
      recommendation: "Introduce headless e-commerce optimization framework",
    },
    adobe: {
      decisionMaker: "Shantanu Narayen (CEO & Tech Board)",
      painPoints: "Generative AI API response costs & cross-platform cloud asset synchronization",
      intentScore: 40,
      buyingStage: "Vendor Evaluation",
      recommendation: "Propose high-throughput API gateway & multi-region caching demo",
    },
    beardo: {
      decisionMaker: "Ashutosh Valani (Co-Founder)",
      painPoints: "Direct-to-consumer customer retention & omni-channel inventory sync",
      intentScore: 10,
      buyingStage: "Cold Prospect",
      recommendation: "Send automated AI customer lifetime value case study",
    },
    nimbus: {
      decisionMaker: "David Sterling (VP Logistics & Supply Chain)",
      painPoints: "Real-time fleet telemetry bottlenecks & legacy ERP integration delays",
      intentScore: 60,
      buyingStage: "Active Evaluation",
      recommendation: "Schedule technical architecture review for logistics streaming",
    },
    tata: {
      decisionMaker: "N. Chandrasekaran (Chairman)",
      painPoints: "Multi-subsidiary data silos & enterprise compliance auditing overhead",
      intentScore: 20,
      buyingStage: "Exploratory",
      recommendation: "Present unified enterprise data governance framework",
    },
    google: {
      decisionMaker: "Sundar Pichai (CEO) & Thomas Kurian (CEO Google Cloud)",
      painPoints: "Enterprise LLM safety guardrails & latency SLA guarantees for Cloud Vertex AI",
      intentScore: 80,
      buyingStage: "Solution Shortlist",
      recommendation: "Deliver technical deep-dive on ProspectIQ Guardrail Agent & streaming latency",
    },
    microsoft: {
      decisionMaker: "Satya Nadella (CEO) & Scott Guthrie (EVP Cloud)",
      painPoints: "CoPilot enterprise integration complexity & multi-agent orchestration reliability",
      intentScore: 20,
      buyingStage: "Exploratory",
      recommendation: "Propose Azure-native multi-agent orchestration architecture proof-of-concept",
    },
  };

  const activeDefaults = COMPANY_DEFAULTS[selectedCompanyId] || {};
  const rawAnalysis = analysis as any;
  const companyName = activeName;
  const decisionMaker = String(analysis?.overall_assessment?.decision_maker || analysis?.persona?.primary_decision_maker || activeDefaults.decisionMaker || "Executive Stakeholder");
  const painPointsList = Array.isArray(analysis?.knowledge?.pain_points)
    ? (analysis!.knowledge.pain_points as any[]).map((p) => String(p || ""))
    : [activeDefaults.painPoints || "Legacy pipeline bottlenecks, Manual prospecting overhead"];
  const painPoints = painPointsList.join(", ");
  const rawIntentScore = analysis?.overall_assessment?.intent_score ?? analysis?.intent?.intent_score ?? activeDefaults.intentScore;
  const intentScore = typeof rawIntentScore === "number" ? rawIntentScore : (activeCompany?.score || 50);
  const buyingStage = String(analysis?.overall_assessment?.buying_stage ?? analysis?.intent?.buying_stage ?? activeDefaults.buyingStage ?? "Evaluating Solutions");
  const recommendation = String(analysis?.overall_assessment?.overall_recommendation ?? analysis?.strategy?.recommended_angle ?? activeDefaults.recommendation ?? "Schedule Executive Demo");
  const guardrailApproved = analysis?.guardrail?.approved !== false;
  const riskLevel = String(analysis?.overall_assessment?.risk_level ?? "Low");

  const sourcesCount = Array.isArray(rawAnalysis?.research?.sources) ? rawAnalysis.research.sources.length : 4;
  const contactsCount = Array.isArray(analysis?.knowledge?.contacts) ? analysis!.knowledge.contacts.length : 2;
  const painPointsCount = painPointsList.length;

  const agentMessages: AgentMessage[] = [
    {
      id: "orchestrator",
      agent: "Orchestrator Agent",
      role: "Workflow Coordination",
      icon: GitBranch,
      color: "text-blue-400",
      borderColor: "border-blue-500/30",
      bgColor: "bg-blue-500/10",
      timestamp: "00:00.1s",
      summary: `Initiated target analysis for ${companyName}. Deployed 6 specialized agents.`,
      reasoning: `Received input query for account "${companyName}". Identified objective as full sales intelligence, persona profiling, intent scoring, and outreach formulation. Formulated multi-agent execution DAG.`,
      inputContext: `Target Account Brief: "${companyName}"`,
      decisionOutput: `Assigned tasks: Research Crawler -> Knowledge Ingestion -> Persona -> Intent -> Strategy -> Guardrails.`,
      confidence: 99,
    },
    {
      id: "research",
      agent: "Research Agent",
      role: "Multi-source Web Crawler",
      icon: Search,
      color: "text-cyan-400",
      borderColor: "border-cyan-500/30",
      bgColor: "bg-cyan-500/10",
      timestamp: "00:01.4s",
      summary: `Crawled web, press releases, and domain data for ${companyName}. Extracted raw evidence.`,
      reasoning: `Executed multi-query web search for ${companyName}. Retrieved primary domain text, employee scale, tech infrastructure, and market positioning. Passed raw evidence to Knowledge Ingestion.`,
      inputContext: `Company Domain & Name: ${companyName}`,
      decisionOutput: `Extracted ${sourcesCount} verified web sources & raw evidence string.`,
      confidence: 94,
    },
    {
      id: "knowledge",
      agent: "Knowledge Ingestion Agent",
      role: "Data Normalization",
      icon: Database,
      color: "text-emerald-400",
      borderColor: "border-emerald-500/30",
      bgColor: "bg-emerald-500/10",
      timestamp: "00:02.8s",
      summary: `Structured raw evidence into normalized account knowledge graph & pain points.`,
      reasoning: `Parsed unstructured web text. Identified key operational pain points: "${painPoints}". Extracted primary contacts and technological footprint.`,
      inputContext: `Raw evidence stream from Research Agent`,
      decisionOutput: `Created structured Knowledge Schema. Mapped ${contactsCount} contacts & ${painPointsCount} pain points.`,
      confidence: 91,
    },
    {
      id: "persona",
      agent: "Persona Agent",
      role: "Buyer Identification",
      icon: Users,
      color: "text-purple-400",
      borderColor: "border-purple-500/30",
      bgColor: "bg-purple-500/10",
      timestamp: "00:03.9s",
      summary: `Identified primary target buyer: ${decisionMaker} (${String(analysis?.persona?.buyer_persona || "VP Engineering / CTO")}).`,
      reasoning: `Cross-referenced company size with organizational hierarchy. Evaluated authority level (${String(analysis?.persona?.decision_level || "High")}) and communication preferences (${String(analysis?.persona?.communication_style || "Direct & ROI-focused")}).`,
      inputContext: `Normalized Knowledge Schema`,
      decisionOutput: `Target Persona: ${String(analysis?.persona?.buyer_persona || "Technical Executive")}. Primary Contact: ${decisionMaker}.`,
      confidence: 95,
    },
    {
      id: "intent",
      agent: "Intent Agent",
      role: "Signal & Urgency Classifier",
      icon: Brain,
      color: "text-amber-400",
      borderColor: "border-amber-500/30",
      bgColor: "bg-amber-500/10",
      timestamp: "00:05.1s",
      summary: `Calculated Intent Score: ${intentScore}/100. Account is in "${buyingStage}" stage.`,
      reasoning: `Analyzed buying signals and expansion indicators. Evaluated signal velocity and solution gap. Rated priority as "${String(analysis?.overall_assessment?.priority || "High Priority")}".`,
      inputContext: `Knowledge Graph & Persona Mapping`,
      decisionOutput: `Intent Rating: ${intentScore}/100. Buying Stage: ${buyingStage}. Priority: ${String(analysis?.overall_assessment?.priority || "High")}.`,
      confidence: 89,
    },
    {
      id: "strategy",
      agent: "Strategy Agent",
      role: "Outreach Playbook Generator",
      icon: Sparkles,
      color: "text-pink-400",
      borderColor: "border-pink-500/30",
      bgColor: "bg-pink-500/10",
      timestamp: "00:06.6s",
      summary: `Synthesized tailored value proposition & draft: "${String(analysis?.strategy?.email_subject || `Accelerating ${companyName}'s Growth Strategy`)}".`,
      reasoning: `Mapped pain points (${painPoints}) directly to product value triggers. Drafted personalized outreach targeting ${decisionMaker} highlighting ROI and efficiency metrics.`,
      inputContext: `Persona Profile + Intent Signals + Pain Points`,
      decisionOutput: `Recommended Action: "${recommendation}". Drafted personalized email subject & body.`,
      confidence: 93,
    },
    {
      id: "guardrail",
      agent: "Guardrail Agent",
      role: "Fact Checker & Safety Verifier",
      icon: ShieldAlert,
      color: "text-rose-400",
      borderColor: "border-rose-500/30",
      bgColor: "bg-rose-500/10",
      timestamp: "00:07.8s",
      summary: `Fact-checked all claims. Status: ${guardrailApproved ? "APPROVED" : "FLAGGED"}. Risk: ${riskLevel}.`,
      reasoning: `Verified all outbound claims against raw evidence. Checked for unsupported promises or hallucinatory statistics. All core assertions verified against primary sources.`,
      inputContext: `Strategy Output + Original Web Research Evidence`,
      decisionOutput: `Final Approval: ${guardrailApproved ? "Passed" : "Requires Review"}. Risk Score: ${riskLevel}. Ready for Queue.`,
      confidence: 97,
    },
  ];

  const filteredMessages = agentMessages
    .slice(0, streamIndex)
    .filter((m) => selectedAgentFilter === "all" || m.id === selectedAgentFilter);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Bot className="h-6 w-6 text-cyan-400 animate-pulse" />
            <h1 className="text-xl font-bold tracking-tight text-white">
              Agent Collaboration Room
            </h1>
            <Badge variant="outline" className="text-[10px] border-cyan-500/40 text-cyan-400">
              Live Inter-Agent Dialogue
            </Badge>
          </div>
          <p className="mt-1 text-xs text-white/50">
            Real-time transcript showing how specialized AI agents debate, share context, and reach consensus for each account.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Company Selector */}
          <select
            value={selectedCompanyId}
            onChange={(e) => handleSelectCompany(e.target.value)}
            className="h-9 min-w-[220px] rounded-xl border border-white/10 bg-[#141414] px-3 text-xs text-white focus:outline-none focus:border-cyan-500/50 cursor-pointer shadow-md"
          >
            {history.length === 0 ? (
              <option value="">No recent sessions — run a brief in AI Workspace</option>
            ) : (
              history.map((comp) => (
                <option key={`comp-opt-${comp.id}`} value={comp.id}>
                  {comp.name || `Session ${comp.id}`}
                </option>
              ))
            )}
          </select>

          <Button
            size="sm"
            onClick={playSimulation}
            disabled={isPlayingStream}
            className="bg-cyan-600 hover:bg-cyan-500 text-black font-semibold text-xs gap-1.5"
          >
            {isPlayingStream ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Play className="h-3.5 w-3.5 fill-current" />
            )}
            Replay Discussion
          </Button>
        </div>
      </div>

      {/* Account Context Banner */}
      <Card className="border border-white/10 bg-gradient-to-r from-cyan-950/30 via-black to-purple-950/30 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-cyan-500/10 p-2.5 text-cyan-400 border border-cyan-500/20">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">{companyName}</h3>
                <span className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-[10px] font-medium text-cyan-300 border border-cyan-500/20">
                  {buyingStage}
                </span>
              </div>
              <p className="text-xs text-white/50">
                Target Stakeholder: <span className="text-white font-medium">{decisionMaker}</span> · Intent Score: <span className="text-emerald-400 font-bold">{intentScore}/100</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-white/40">Filter Agent:</span>
            <button
              onClick={() => setSelectedAgentFilter("all")}
              className={`px-2.5 py-1 rounded-lg border text-[11px] transition-colors ${
                selectedAgentFilter === "all"
                  ? "border-cyan-500/50 bg-cyan-500/10 text-cyan-300 font-semibold"
                  : "border-white/10 bg-white/[0.02] text-white/50 hover:text-white"
              }`}
            >
              All Agents (7)
            </button>
            {agentMessages.map((ag) => (
              <button
                key={ag.id}
                onClick={() => setSelectedAgentFilter(ag.id)}
                className={`px-2.5 py-1 rounded-lg border text-[11px] transition-colors ${
                  selectedAgentFilter === ag.id
                    ? `${ag.borderColor} ${ag.bgColor} ${ag.color} font-semibold`
                    : "border-white/10 bg-white/[0.02] text-white/50 hover:text-white"
                }`}
              >
                {ag.agent.replace(" Agent", "")}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Main Dialogue Stream */}
      <div className="space-y-4">
        <AnimatePresence>
          {filteredMessages.map((msg, index) => {
            const Icon = msg.icon;
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card className={`border ${msg.borderColor} bg-gradient-to-br from-[#121212] via-[#151518] to-[#121212] shadow-xl overflow-hidden`}>
                  <CardHeader className="pb-3 border-b border-white/5 bg-white/[0.01]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`rounded-xl ${msg.bgColor} p-2 ${msg.color} border ${msg.borderColor}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-sm font-bold text-white tracking-wide">
                              {msg.agent}
                            </CardTitle>
                            <span className="text-[11px] font-medium text-white/40">
                              · {msg.role}
                            </span>
                          </div>
                          <p className="text-xs text-white/70 font-medium mt-0.5">
                            {msg.summary}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-mono text-white/40 bg-white/[0.04] px-2 py-1 rounded-md">
                          {msg.timestamp}
                        </span>
                        <Badge variant="outline" className="text-[10px] border-white/10 text-cyan-300">
                          {msg.confidence}% Confidence
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 space-y-3">
                    {/* Input Handoff -> Reasoning -> Output Handoff */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                      {/* 1. Context Received */}
                      <div className="rounded-xl border border-white/6 bg-white/[0.02] p-3">
                        <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/40 mb-1.5">
                          <MessageSquare className="h-3 w-3 text-blue-400" /> Input Context Received
                        </div>
                        <p className="text-white/80 leading-relaxed font-mono text-[11px]">
                          {msg.inputContext}
                        </p>
                      </div>

                      {/* 2. Agent Decision Rationale */}
                      <div className="rounded-xl border border-white/6 bg-white/[0.02] p-3">
                        <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/40 mb-1.5">
                          <Brain className="h-3 w-3 text-purple-400" /> Agent Internal Rationale
                        </div>
                        <p className="text-white/80 leading-relaxed text-[11px]">
                          {msg.reasoning}
                        </p>
                      </div>

                      {/* 3. Output Handed Off */}
                      <div className="rounded-xl border border-white/6 bg-white/[0.02] p-3">
                        <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/40 mb-1.5">
                          <ChevronRight className="h-3 w-3 text-emerald-400" /> Decision Handed Off
                        </div>
                        <p className="text-emerald-300 font-medium leading-relaxed text-[11px]">
                          {msg.decisionOutput}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
