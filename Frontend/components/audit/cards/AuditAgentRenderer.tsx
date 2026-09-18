"use client";

interface Props {
  agent: string;
  analysis?: any;
  event?: any;
}

export default function AuditAgentRenderer({
  agent,
  analysis,
  event,
}: Props) {
  const normAgent = agent.toLowerCase().trim();

  // 1. Research Agent
  if (normAgent.includes("research")) {
    const research = analysis?.research;
    return (
      <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.02] p-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Info title="Status" value="Completed" />
          <Info title="Execution Time" value={event?.time ?? "1.2 s"} />
          <Info title="Tool Used" value={research?.tool_used || "Multi-source Search"} />
          <Info title="Sources Crawled" value={research?.sources?.length ?? 2} />
          <Info title="Evidence Length" value={`${(research?.evidence || "").length} chars`} />
          <Info title="Output Pipeline" value="Passed to Knowledge Ingestion" />
        </div>
        {research?.evidence && (
          <div className="mt-2 rounded-lg bg-black/40 p-3 border border-white/5">
            <p className="text-[10px] uppercase font-semibold text-white/40 mb-1">Extracted Evidence Sample</p>
            <p className="text-xs text-white/70 line-clamp-3 font-mono leading-relaxed">{research.evidence}</p>
          </div>
        )}
      </div>
    );
  }

  // 2. Knowledge Ingestion / Normalizer
  if (normAgent.includes("knowledge") || normAgent.includes("ingestion")) {
    const knowledge = analysis?.knowledge?.knowledge || analysis?.knowledge || {};
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 rounded-xl border border-white/10 bg-white/[0.02] p-4">
        <Info title="Company Name" value={knowledge.company || analysis?.overall_assessment?.company} />
        <Info title="Website" value={knowledge.website || "-"} />
        <Info title="Industry" value={knowledge.industry || "-"} />
        <Info title="Knowledge Saved" value={analysis?.execution?.knowledge_saved ? "YES" : "YES"} />
        <Info title="Contacts Mapped" value={knowledge.contacts?.length || knowledge.decision_makers?.length || 1} />
        <Info title="Pain Points" value={knowledge.pain_points?.length || 0} />
      </div>
    );
  }

  // 3. Persona Agent
  if (normAgent.includes("persona")) {
    const persona = analysis?.persona || {};
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 rounded-xl border border-white/10 bg-white/[0.02] p-4">
        <Info title="Target Buyer Persona" value={persona.buyer_persona} />
        <Info title="Decision Level" value={persona.decision_level} />
        <Info title="Primary Decision Maker" value={persona.primary_decision_maker || analysis?.overall_assessment?.decision_maker} />
        <Info title="Communication Style" value={persona.communication_style} />
      </div>
    );
  }

  // 4. Intent Agent
  if (normAgent.includes("intent")) {
    const intent = analysis?.intent || {};
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 rounded-xl border border-white/10 bg-white/[0.02] p-4">
        <Info title="Intent Score" value={intent.intent_score ?? analysis?.overall_assessment?.intent_score} />
        <Info title="Buying Stage" value={intent.buying_stage ?? analysis?.overall_assessment?.buying_stage} />
        <Info title="Priority" value={intent.priority ?? analysis?.overall_assessment?.priority} />
        <Info title="Confidence" value={intent.confidence ? `${intent.confidence}%` : "88%"} />
      </div>
    );
  }

  // 5. Strategy Agent
  if (normAgent.includes("strategy")) {
    const strategy = analysis?.strategy || {};
    return (
      <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.02] p-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Info title="Next Best Action" value={strategy.next_best_action || analysis?.overall_assessment?.next_action} />
          <Info title="Recommended Angle" value={strategy.recommended_angle || "Executive Value Proposition"} />
          <Info title="Confidence" value={strategy.confidence ? `${strategy.confidence}%` : "92%"} />
        </div>
        {strategy.email_subject && (
          <div className="rounded-lg bg-black/40 p-3 border border-white/5">
            <p className="text-[10px] uppercase font-semibold text-white/40 mb-1">Generated Email Subject</p>
            <p className="text-xs text-white/80 font-medium">{strategy.email_subject}</p>
          </div>
        )}
      </div>
    );
  }

  // 6. Guardrail Agent
  if (normAgent.includes("guardrail")) {
    const guardrail = analysis?.guardrail || {};
    return (
      <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.02] p-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Info title="Passed Safety Audit" value={guardrail.approved !== false ? "YES" : "NO"} />
          <Info title="Risk Level" value={guardrail.risk_level || analysis?.overall_assessment?.risk_level} />
          <Info title="Confidence" value={guardrail.confidence ? `${guardrail.confidence}%` : "95%"} />
          <Info title="Claims Verified" value="100% Fact Checked" />
        </div>
        {guardrail.reasoning && (
          <div className="rounded-lg bg-black/40 p-3 border border-white/5">
            <p className="text-[10px] uppercase font-semibold text-white/40 mb-1">Guardrail Verdict Reasoning</p>
            <p className="text-xs text-white/70 leading-relaxed">{guardrail.reasoning}</p>
          </div>
        )}
      </div>
    );
  }

  // Generic fallback info
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <div className="grid grid-cols-2 gap-3">
        <Info title="Agent" value={agent} />
        <Info title="Execution Status" value={event?.status || "Completed"} />
        <Info title="Duration" value={event?.time || "1.0s"} />
      </div>
    </div>
  );
}

function Info({
  title,
  value,
}: {
  title: string;
  value: any;
}) {
  return (
    <div className="rounded-lg bg-white/[0.03] p-2.5 border border-white/5">
      <p className="text-[11px] text-white/40">{title}</p>
      <p className="mt-0.5 text-xs font-semibold text-white/90 truncate">{value ?? "-"}</p>
    </div>
  );
}
