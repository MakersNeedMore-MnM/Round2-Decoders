"use client";

import { useCallback, useMemo, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  type Edge,
  type Node,
  type NodeMouseHandler,
  BackgroundVariant,
} from "reactflow";
import "reactflow/dist/style.css";
import { StakeholderNode, type StakeholderNodeData } from "@/components/graph/custom-node";
import { NodeInfoPanel } from "@/components/graph/node-info-panel";
import type { RelationshipEdge, RelationshipNode } from "@/types";

const nodeTypes = { stakeholder: StakeholderNode };

/**
 * Real accounts don't come with hand-placed coordinates, so lay nodes
 * out automatically: the Decision Maker (if any) goes top-center, and
 * everyone else fans out below in a simple arc. Good enough for a
 * handful of stakeholders; swap for a proper force layout if accounts
 * routinely have 10+ contacts.
 */
function computeLayout(nodes: RelationshipNode[]): Record<string, { x: number; y: number }> {
  const layout: Record<string, { x: number; y: number }> = {};

  const decisionMaker = nodes.find((n) => n.influence === "Decision Maker");
  const rest = nodes.filter((n) => n !== decisionMaker);

  if (decisionMaker) {
    layout[decisionMaker.id] = { x: 280, y: 20 };
  }

  const spacing = 220;
  const startX = 280 - ((rest.length - 1) * spacing) / 2;

  rest.forEach((node, i) => {
    layout[node.id] = { x: startX + i * spacing, y: 240 };
  });

  return layout;
}

export function RelationshipGraph({
  nodes: relationshipNodes,
  edges: relationshipEdges,
}: {
  nodes: RelationshipNode[];
  edges: RelationshipEdge[];
}) {
  const [activeNode, setActiveNode] = useState<RelationshipNode | null>(null);

  const layout = useMemo(() => computeLayout(relationshipNodes), [relationshipNodes]);

  const nodes: Node<StakeholderNodeData>[] = useMemo(
    () =>
      relationshipNodes.map((n) => ({
        id: n.id,
        type: "stakeholder",
        position: layout[n.id] ?? { x: 0, y: 0 },
        data: { name: n.name, title: n.title, influence: n.influence, confidence: n.confidence },
      })),
    [relationshipNodes, layout],
  );

  const edges: Edge[] = useMemo(
    () =>
      relationshipEdges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        label: e.label,
        animated: true,
        style: { stroke: "rgba(255,255,255,0.25)" },
        labelStyle: { fill: "rgba(255,255,255,0.4)", fontSize: 10 },
        labelBgStyle: { fill: "#0c0c0c", fillOpacity: 0.8 },
      })),
    [relationshipEdges],
  );

  const handleNodeMouseEnter: NodeMouseHandler = useCallback(
    (_, node) => {
      const found = relationshipNodes.find((n) => n.id === node.id) ?? null;
      setActiveNode(found);
    },
    [relationshipNodes],
  );

  if (relationshipNodes.length === 0) {
    return (
      <div className="flex h-[calc(100vh-11rem)] items-center justify-center rounded-2xl border border-white/8 bg-[#0c0c0c]">
        <p className="max-w-sm text-center text-xs text-white/30">
          No stakeholders extracted yet for this account. Run its notes through the AI Workspace
          with named contacts to populate the relationship graph.
        </p>
      </div>
    );
  }

  return (
    <div className="relative h-[calc(100vh-11rem)] overflow-hidden rounded-2xl border border-white/8 bg-[#0c0c0c]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeMouseEnter={handleNodeMouseEnter}
        onPaneClick={() => setActiveNode(null)}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.4}
        maxZoom={1.5}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={22} size={1} color="rgba(255,255,255,0.06)" />
        <Controls
          className="[&_button]:!bg-[#151515] [&_button]:!border-white/10 [&_button]:!text-white/60"
          showInteractive={false}
        />
        <MiniMap
          pannable
          zoomable
          maskColor="rgba(9,9,9,0.75)"
          nodeColor="rgba(255,255,255,0.2)"
          className="!bg-[#111111] !border !border-white/10 rounded-xl overflow-hidden"
        />
      </ReactFlow>

      <NodeInfoPanel node={activeNode} onClose={() => setActiveNode(null)} />
    </div>
  );
}