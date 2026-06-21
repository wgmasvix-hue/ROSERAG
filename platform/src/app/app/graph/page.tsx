"use client";

import { useState, useRef, useEffect } from "react";
import { Search, ZoomIn, ZoomOut, Maximize2, Filter, Info, GitBranch, Tag, FileText } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface GraphNode {
  id: string;
  label: string;
  type: "concept" | "entity" | "document" | "author" | "institution";
  x: number;
  y: number;
  weight: number;
  color: string;
}

interface GraphEdge {
  source: string;
  target: string;
  label: string;
  weight: number;
}

// ─── Mock data ───────────────────────────────────────────────────────────────

const NODES: GraphNode[] = [
  { id: "1", label: "Food Security", type: "concept", x: 400, y: 300, weight: 10, color: "#e11d48" },
  { id: "2", label: "Climate Change", type: "concept", x: 200, y: 180, weight: 8, color: "#7c3aed" },
  { id: "3", label: "Agriculture", type: "concept", x: 600, y: 180, weight: 8, color: "#16a34a" },
  { id: "4", label: "Post-Harvest Losses", type: "concept", x: 620, y: 400, weight: 6, color: "#d97706" },
  { id: "5", label: "Zimbabwe", type: "entity", x: 300, y: 440, weight: 7, color: "#0284c7" },
  { id: "6", label: "FAO Reports", type: "document", x: 160, y: 380, weight: 5, color: "#64748b" },
  { id: "7", label: "SADC", type: "institution", x: 500, y: 500, weight: 6, color: "#db2777" },
  { id: "8", label: "Smallholder Farmers", type: "entity", x: 720, y: 280, weight: 5, color: "#0891b2" },
  { id: "9", label: "Water Scarcity", type: "concept", x: 100, y: 300, weight: 5, color: "#7c3aed" },
  { id: "10", label: "Grain Storage", type: "concept", x: 750, y: 420, weight: 4, color: "#d97706" },
];

const EDGES: GraphEdge[] = [
  { source: "1", target: "2", label: "affected by", weight: 3 },
  { source: "1", target: "3", label: "depends on", weight: 4 },
  { source: "1", target: "4", label: "impacted by", weight: 2 },
  { source: "1", target: "5", label: "affects", weight: 3 },
  { source: "1", target: "6", label: "documented in", weight: 2 },
  { source: "2", target: "9", label: "causes", weight: 2 },
  { source: "3", target: "8", label: "involves", weight: 3 },
  { source: "3", target: "10", label: "requires", weight: 2 },
  { source: "4", target: "10", label: "addressed by", weight: 2 },
  { source: "5", target: "7", label: "member of", weight: 2 },
  { source: "8", target: "4", label: "experiences", weight: 2 },
];

const TYPE_COLORS: Record<string, string> = {
  concept: "#e11d48",
  entity: "#0284c7",
  document: "#64748b",
  author: "#16a34a",
  institution: "#db2777",
};

const ENTITY_EXPLORER = [
  { label: "Food Security", type: "concept", connections: 8, docs: 124 },
  { label: "Climate Change", type: "concept", connections: 6, docs: 98 },
  { label: "Agriculture", type: "concept", connections: 7, docs: 87 },
  { label: "Zimbabwe", type: "entity", connections: 5, docs: 64 },
  { label: "SADC", type: "institution", connections: 4, docs: 43 },
  { label: "FAO Reports", type: "document", connections: 3, docs: 32 },
];

// ─── SVG Graph ───────────────────────────────────────────────────────────────

function KnowledgeGraphSVG({
  nodes,
  edges,
  selected,
  onSelect,
}: {
  nodes: GraphNode[];
  edges: GraphEdge[];
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const getNode = (id: string) => nodes.find((n) => n.id === id);

  return (
    <svg
      width="100%"
      height="100%"
      className="cursor-grab active:cursor-grabbing"
      onMouseDown={(e) => {
        setDragging(true);
        setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
      }}
      onMouseMove={(e) => {
        if (!dragging) return;
        setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
      }}
      onMouseUp={() => setDragging(false)}
      onMouseLeave={() => setDragging(false)}
      onWheel={(e) => {
        e.preventDefault();
        setScale((s) => Math.max(0.3, Math.min(3, s - e.deltaY * 0.001)));
      }}
    >
      <g transform={`translate(${offset.x},${offset.y}) scale(${scale})`}>
        {/* Edges */}
        {edges.map((edge, i) => {
          const src = getNode(edge.source);
          const tgt = getNode(edge.target);
          if (!src || !tgt) return null;
          const mid = { x: (src.x + tgt.x) / 2, y: (src.y + tgt.y) / 2 };
          return (
            <g key={i}>
              <line
                x1={src.x} y1={src.y} x2={tgt.x} y2={tgt.y}
                stroke="#e2e8f0" strokeWidth={edge.weight} strokeLinecap="round"
              />
              <text x={mid.x} y={mid.y} textAnchor="middle" className="text-[8px]"
                fontSize="9" fill="#94a3b8" dy="-4">
                {edge.label}
              </text>
            </g>
          );
        })}

        {/* Nodes */}
        {nodes.map((node) => {
          const r = 20 + node.weight * 2;
          const isSelected = selected === node.id;
          return (
            <g key={node.id} onClick={() => onSelect(node.id)} className="cursor-pointer">
              <circle
                cx={node.x} cy={node.y} r={r}
                fill={isSelected ? node.color : `${node.color}20`}
                stroke={node.color}
                strokeWidth={isSelected ? 3 : 2}
                className="transition-all duration-200"
              />
              {isSelected && (
                <circle cx={node.x} cy={node.y} r={r + 6}
                  fill="none" stroke={node.color} strokeWidth={1.5} opacity={0.4}
                />
              )}
              <text
                x={node.x} y={node.y + r + 14}
                textAnchor="middle"
                fontSize="11"
                fontWeight={isSelected ? "700" : "500"}
                fill={isSelected ? node.color : "#334155"}
              >
                {node.label}
              </text>
              <text x={node.x} y={node.y} textAnchor="middle" fontSize="10"
                fill={isSelected ? "white" : node.color} dy="4">
                {node.weight}
              </text>
            </g>
          );
        })}
      </g>
    </svg>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function GraphPage() {
  const [selected, setSelected] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string | null>(null);

  const selectedNode = selected ? NODES.find((n) => n.id === selected) : null;
  const connectedEdges = selected
    ? EDGES.filter((e) => e.source === selected || e.target === selected)
    : [];

  const filteredNodes = NODES.filter((n) => {
    if (typeFilter && n.type !== typeFilter) return false;
    if (search && !n.label.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="h-full flex overflow-hidden">
      {/* Main graph area */}
      <div className="flex-1 relative bg-slate-50">
        {/* Toolbar */}
        <div className="absolute top-4 left-4 right-4 z-10 flex items-center gap-3">
          <div className="flex-1 max-w-sm relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              className="input pl-9 text-sm shadow-sm"
              placeholder="Search entities, concepts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex gap-1 bg-white border border-slate-200 rounded-lg p-1 shadow-sm">
            {[null, "concept", "entity", "document", "institution"].map((t) => (
              <button
                key={t ?? "all"}
                onClick={() => setTypeFilter(t)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                  typeFilter === t
                    ? "bg-rose-600 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {t ? t.charAt(0).toUpperCase() + t.slice(1) : "All"}
              </button>
            ))}
          </div>
        </div>

        {/* Zoom controls */}
        <div className="absolute bottom-6 left-4 z-10 flex flex-col gap-2">
          <button className="w-8 h-8 bg-white border border-slate-200 rounded-lg shadow-sm flex items-center justify-center hover:bg-slate-50 text-slate-600">
            <ZoomIn className="w-4 h-4" />
          </button>
          <button className="w-8 h-8 bg-white border border-slate-200 rounded-lg shadow-sm flex items-center justify-center hover:bg-slate-50 text-slate-600">
            <ZoomOut className="w-4 h-4" />
          </button>
          <button className="w-8 h-8 bg-white border border-slate-200 rounded-lg shadow-sm flex items-center justify-center hover:bg-slate-50 text-slate-600">
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>

        {/* Graph legend */}
        <div className="absolute bottom-6 right-4 z-10 bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 mb-2">Node Types</div>
          <div className="space-y-1.5">
            {Object.entries(TYPE_COLORS).map(([type, color]) => (
              <div key={type} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ background: color }} />
                <span className="text-xs text-slate-600 capitalize">{type}</span>
              </div>
            ))}
          </div>
        </div>

        {/* SVG canvas */}
        <div className="w-full h-full">
          <KnowledgeGraphSVG
            nodes={filteredNodes}
            edges={EDGES}
            selected={selected}
            onSelect={(id) => setSelected(selected === id ? null : id)}
          />
        </div>
      </div>

      {/* Right panel */}
      <div className="w-72 border-l border-slate-200 bg-white flex flex-col overflow-hidden">
        {/* Selected node detail */}
        {selectedNode ? (
          <div className="p-4 border-b border-slate-200">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0"
                style={{ background: selectedNode.color }}>
                <GitBranch className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">{selectedNode.label}</h3>
                <span className="badge badge-rose capitalize">{selectedNode.type}</span>
              </div>
            </div>

            <div className="text-xs text-slate-500 mb-3">
              Connected to {connectedEdges.length} entities
            </div>

            <div className="space-y-2">
              {connectedEdges.map((e, i) => {
                const other = NODES.find((n) => n.id === (e.source === selected ? e.target : e.source));
                if (!other) return null;
                return (
                  <div key={i} className="flex items-center gap-2 text-xs p-2 bg-slate-50 rounded-lg">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: other.color }} />
                    <span className="text-slate-400">{e.label}</span>
                    <span className="font-medium text-slate-700 truncate">{other.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="p-4 border-b border-slate-200">
            <div className="text-center py-4">
              <GitBranch className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-400">Click a node to explore connections</p>
            </div>
          </div>
        )}

        {/* Entity Explorer */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
            Entity Explorer
          </div>
          <div className="space-y-2">
            {ENTITY_EXPLORER.map((e) => (
              <button
                key={e.label}
                onClick={() => {
                  const node = NODES.find((n) => n.label === e.label);
                  if (node) setSelected(node.id);
                }}
                className="w-full text-left p-3 rounded-lg border border-slate-200 hover:border-rose-200 hover:bg-rose-50 transition-all group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-slate-900 group-hover:text-rose-700">
                    {e.label}
                  </span>
                  <span className="badge badge-rose capitalize text-[10px]">{e.type}</span>
                </div>
                <div className="flex gap-3 text-xs text-slate-400">
                  <span>{e.connections} connections</span>
                  <span>{e.docs} docs</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
