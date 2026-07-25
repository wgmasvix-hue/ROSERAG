"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  FileText,
  Globe,
  Database,
  Plus,
  X,
  ChevronLeft,
  Upload,
  Send,
  Mic,
  Headphones,
  Play,
  Pause,
  Zap,
  MessageSquare,
  ArrowRight,
  Search,
  Loader2,
  CheckCircle,
  BookOpen,
  Quote,
} from "lucide-react";
import React from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type NotebookType = "Research" | "Teaching" | "Study" | "Project";

interface Source {
  id: string;
  name: string;
  type: "pdf" | "url" | "docx" | "dspace";
  size: string;
  pages?: number;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: number[];
  confidence?: number;
  timestamp: string;
}

interface Notebook {
  id: string;
  title: string;
  type: NotebookType;
  sources: Source[];
  messages: ChatMessage[];
  content: string;
  lastUpdated: string;
  color: string;
}


interface DSpaceItem {
  uuid: string;
  title: string;
  authors: string[];
  abstract: string;
  year: string;
  url: string;
  has_pdf: boolean;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const DEMO_NOTEBOOKS: Notebook[] = [
  {
    id: "nb1",
    title: "Food Security Research",
    type: "Research",
    color: "rose",
    lastUpdated: "2h ago",
    sources: [
      { id: "s1", name: "FAO Food Security Report 2024.pdf", type: "pdf", size: "4.2 MB", pages: 127 },
      { id: "s2", name: "ZIMSTAT Agricultural Survey.docx", type: "docx", size: "1.8 MB", pages: 45 },
      { id: "s3", name: "https://www.fao.org/nutrition/policies", type: "url", size: "Web" },
      { id: "s4", name: "DSpace: Smallholder Farming Zimbabwe", type: "dspace", size: "2.1 MB", pages: 89 },
    ],
    messages: [
      {
        id: "m1",
        role: "user",
        content: "What are the main drivers of food insecurity in Zimbabwe according to these sources?",
        timestamp: "10:24 AM",
      },
      {
        id: "m2",
        role: "assistant",
        content:
          "Based on the sources, **three key drivers** emerge:\n\n1. **Climate variability** — El Niño-induced droughts reduced cereal production by 42% in 2023 [1][3]\n2. **Post-harvest losses** — poor storage infrastructure leads to 30-40% crop losses [2]\n3. **Market access barriers** — 67% of smallholder farmers lack access to formal markets [4]\n\nThe FAO report emphasizes that addressing storage infrastructure could alone reduce food insecurity by an estimated 18% across the region.",
        citations: [1, 2, 3, 4],
        confidence: 94,
        timestamp: "10:25 AM",
      },
      {
        id: "m3",
        role: "user",
        content: "Suggest interventions for post-harvest losses",
        timestamp: "10:28 AM",
      },
      {
        id: "m4",
        role: "assistant",
        content:
          "The literature identifies several evidence-based interventions...\n\n**Storage solutions**: Hermetic bags have shown 95% effectiveness in preventing grain loss [2]. Community grain banks serve as an alternative institutional model [1].\n\n**Technology**: Solar-powered cold storage reduces perishable losses by 60% [3].\n\nCost-benefit analysis shows hermetic storage delivers ROI within 2 seasons for smallholder farmers.",
        citations: [1, 2, 3],
        confidence: 91,
        timestamp: "10:29 AM",
      },
    ],
    content:
      "## Food Security in Zimbabwe: Key Findings\n\nThis notebook synthesizes evidence on food security drivers and interventions.\n\n### Climate Impact\nRecent droughts have significantly reduced agricultural output...\n\n### Interventions\nPost-harvest loss reduction is identified as the highest-impact intervention.",
  },
  {
    id: "nb2",
    title: "Climate Policy Analysis",
    type: "Research",
    color: "blue",
    lastUpdated: "1d ago",
    sources: [
      { id: "s5", name: "IPCC AR6 Summary for Policymakers.pdf", type: "pdf", size: "8.7 MB", pages: 42 },
      { id: "s6", name: "SADC Climate Adaptation Framework.pdf", type: "pdf", size: "3.1 MB", pages: 98 },
      { id: "s7", name: "https://unfccc.int/topics/adaptation", type: "url", size: "Web" },
    ],
    messages: [
      {
        id: "m5",
        role: "user",
        content: "Summarize SADC's climate adaptation commitments",
        timestamp: "Yesterday",
      },
      {
        id: "m6",
        role: "assistant",
        content:
          "SADC member states have committed to several adaptation measures under the regional framework [1][2]:\n\n- **Agricultural resilience**: $2.4B investment in climate-smart agriculture by 2030\n- **Water security**: 40% increase in water storage infrastructure\n- **Ecosystem protection**: 30x30 conservation targets\n\nHowever, current financing gaps mean only 23% of needed adaptation funds are secured [2].",
        citations: [1, 2],
        confidence: 88,
        timestamp: "Yesterday",
      },
    ],
    content: "## SADC Climate Policy Analysis\n\nAnalyzing regional commitments and financing gaps.",
  },
  {
    id: "nb3",
    title: "AI Ethics Study",
    type: "Study",
    color: "purple",
    lastUpdated: "3d ago",
    sources: [
      { id: "s8", name: "AI Ethics Guidelines EU 2024.pdf", type: "pdf", size: "5.3 MB", pages: 156 },
      { id: "s9", name: "UNESCO AI Recommendation.docx", type: "docx", size: "2.9 MB", pages: 77 },
    ],
    messages: [
      {
        id: "m7",
        role: "user",
        content: "What are the core principles of trustworthy AI?",
        timestamp: "3 days ago",
      },
      {
        id: "m8",
        role: "assistant",
        content:
          "The sources identify **seven key principles** for trustworthy AI [1][2]:\n\n1. Human agency and oversight\n2. Technical robustness and safety\n3. Privacy and data governance\n4. Transparency\n5. Diversity and fairness\n6. Societal well-being\n7. Accountability\n\nThese align with UNESCO's broader framework emphasizing human rights [2].",
        citations: [1, 2],
        confidence: 96,
        timestamp: "3 days ago",
      },
    ],
    content: "## AI Ethics Framework Study\n\nDocumenting key principles across major frameworks.",
  },
];

// ─── Suggested questions per notebook ─────────────────────────────────────────

const SUGGESTED_QUESTIONS: Record<string, string[]> = {
  nb1: ["What are yield gaps by region?", "Compare storage tech costs", "Impact of climate on smallholders"],
  nb2: ["What are SADC's NDC targets?", "Financing gap analysis", "Compare with Paris Agreement"],
  nb3: ["How does GDPR relate?", "Compare EU vs UNESCO approaches", "Real-world enforcement examples"],
};

const FOLLOW_UPS: Record<string, string[]> = {
  nb1: [
    "What regions need most urgent intervention?",
    "Compare storage infrastructure costs",
    "Timeline for 2030 targets",
  ],
  nb2: [
    "Break down the $2.4B investment plan",
    "Which countries lead in implementation?",
    "Mitigation vs adaptation balance",
  ],
  nb3: ["How are these enforced in practice?", "Compare with US AI policy", "Role of civil society"],
};

const DEFAULT_QUESTIONS = ["Summarize key findings", "What are the main gaps?", "Compare sources"];
const DEFAULT_FOLLOW_UPS = ["Elaborate on this point", "What does the evidence say?", "Any counterarguments?"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function renderBold(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="text-white font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

function getBadgeClasses(color: string): string {
  switch (color) {
    case "rose":
      return "bg-rose-500/20 text-rose-400";
    case "blue":
      return "bg-blue-500/20 text-blue-400";
    case "purple":
      return "bg-purple-500/20 text-purple-400";
    case "amber":
      return "bg-amber-500/20 text-amber-400";
    default:
      return "bg-slate-500/20 text-slate-400";
  }
}

function getSourceIconBg(type: Source["type"]): string {
  switch (type) {
    case "pdf":
      return "bg-rose-500/20";
    case "url":
      return "bg-blue-500/20";
    case "docx":
      return "bg-indigo-500/20";
    case "dspace":
      return "bg-amber-500/20";
  }
}

function getSourceIconColor(type: Source["type"]): string {
  switch (type) {
    case "pdf":
      return "text-rose-400";
    case "url":
      return "text-blue-400";
    case "docx":
      return "text-indigo-400";
    case "dspace":
      return "text-amber-400";
  }
}

function SourceIcon({ type }: { type: Source["type"] }) {
  if (type === "url") return <Globe className="w-4 h-4" />;
  if (type === "dspace") return <Database className="w-4 h-4" />;
  return <FileText className="w-4 h-4" />;
}

// ─── Waveform SVG ──────────────────────────────────────────────────────────────

function Waveform({ progress }: { progress: number }) {
  const bars = [
    4, 8, 12, 6, 14, 10, 18, 8, 22, 14, 10, 6, 16, 20, 12, 8, 18, 24, 16, 10, 14, 8, 20, 16, 12, 6, 18, 22, 10, 14,
    8, 16, 12, 20, 8, 14, 18, 10, 6, 16,
  ];
  const total = bars.length;
  const filledCount = Math.floor((progress / 100) * total);

  return (
    <svg width="160" height="32" viewBox="0 0 160 32" className="flex-shrink-0">
      {bars.map((h, i) => {
        const x = i * 4 + 2;
        const y = (32 - h) / 2;
        const filled = i < filledCount;
        return (
          <rect
            key={i}
            x={x}
            y={y}
            width="2"
            height={h}
            rx="1"
            className={filled ? "fill-rose-500" : "fill-rose-500/30"}
          />
        );
      })}
    </svg>
  );
}

// ─── DSpace Import Modal ──────────────────────────────────────────────────────

function DSpaceModal({
  notebookId,
  onAdd,
  onClose,
}: {
  notebookId: string;
  onAdd: (source: Source) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<DSpaceItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [importing, setImporting] = useState<string | null>(null);
  const [imported, setImported] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");

  const search = useCallback(async () => {
    if (!query.trim()) return;
    setSearching(true);
    setError("");
    try {
      const res = await fetch(`/api/dspace/items?query=${encodeURIComponent(query)}&size=10`);
      if (!res.ok) {
        const d = await res.json();
        setError(d.detail || "Search failed");
        return;
      }
      const data = await res.json();
      setResults(data.items || []);
      if (!data.items?.length) setError("No items found in DSpace for this query.");
    } catch {
      setError("Cannot reach DSpace — is DSPACE_URL configured?");
    } finally {
      setSearching(false);
    }
  }, [query]);

  async function importItem(item: DSpaceItem) {
    setImporting(item.uuid);
    try {
      const res = await fetch(`/api/dspace/ingest/${item.uuid}`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setImported((prev) => new Set([...prev, item.uuid]));
        onAdd({
          id: `dspace-${item.uuid}`,
          name: `DSpace: ${item.title}`,
          type: "dspace",
          size: `${data.chunks || 0} chunks`,
          pages: data.pages,
        });
      } else {
        setError(data.detail || "Import failed");
      }
    } catch {
      setError("Import request failed");
    } finally {
      setImporting(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl mx-4 flex flex-col max-h-[80vh]">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <Database className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h2 className="text-white font-semibold text-sm">Import from DSpace</h2>
              <p className="text-slate-400 text-xs">Search your institutional repository</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 border-b border-slate-800 flex-shrink-0">
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && search()}
              placeholder="Search DSpace items..."
              className="flex-1 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder:text-slate-500 px-4 py-2.5 focus:outline-none focus:border-amber-500/50"
              autoFocus
            />
            <button
              onClick={search}
              disabled={searching || !query.trim()}
              className="bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
            >
              {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Search
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {error && (
            <div className="bg-red-500/10 border border-red-500/25 text-red-400 text-xs p-3 rounded-lg">
              {error}
            </div>
          )}
          {!error && results.length === 0 && !searching && (
            <div className="text-center py-8">
              <Database className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">Search your DSpace repository above</p>
              <p className="text-slate-600 text-xs mt-1">
                Requires <code className="bg-slate-800 px-1 rounded">DSPACE_URL</code> to be configured
              </p>
            </div>
          )}
          {results.map((item) => (
            <div key={item.uuid} className="bg-slate-800 border border-slate-700 rounded-xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium leading-snug">{item.title}</p>
                  {item.authors.length > 0 && (
                    <p className="text-slate-400 text-xs mt-1">{item.authors.slice(0, 2).join(", ")}{item.authors.length > 2 ? " et al." : ""}</p>
                  )}
                  {item.year && <span className="text-slate-500 text-xs">{item.year}</span>}
                  {item.abstract && (
                    <p className="text-slate-400 text-xs mt-2 line-clamp-2">{item.abstract}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs bg-amber-500/15 text-amber-400 px-2 py-0.5 rounded">
                      {item.has_pdf ? "PDF available" : "PDF unconfirmed"}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => importItem(item)}
                  disabled={!!importing || imported.has(item.uuid)}
                  className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-amber-600 hover:bg-amber-700 text-white"
                >
                  {importing === item.uuid ? (
                    <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Importing…</>
                  ) : imported.has(item.uuid) ? (
                    <><CheckCircle className="w-3.5 h-3.5" /> Added</>
                  ) : (
                    <><Plus className="w-3.5 h-3.5" /> Add</>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-slate-800 flex-shrink-0">
          <button onClick={onClose} className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-lg text-sm transition-colors">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function NotebookPage() {
  const [selectedNotebook, setSelectedNotebook] = useState<string | null>(null);
  const [notebooks, setNotebooks] = useState<Notebook[]>(DEMO_NOTEBOOKS);
  const [chatInput, setChatInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [showAudioPlayer, setShowAudioPlayer] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [showDSpaceModal, setShowDSpaceModal] = useState(false);

  const addMenuRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentNotebook = notebooks.find((n) => n.id === selectedNotebook) ?? null;

  // Close add menu on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (addMenuRef.current && !addMenuRef.current.contains(e.target as Node)) {
        setShowAddMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentNotebook?.messages, isStreaming]);

  function handleSend() {
    if (!chatInput.trim() || !selectedNotebook) return;
    const nb = notebooks.find((n) => n.id === selectedNotebook);
    if (!nb) return;
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: chatInput,
      timestamp: "Just now",
    };
    setNotebooks((prev) =>
      prev.map((n) => (n.id === selectedNotebook ? { ...n, messages: [...n.messages, userMsg] } : n))
    );
    setChatInput("");
    setIsStreaming(true);
    setTimeout(() => {
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "I've analyzed your question based on the available sources. The evidence suggests multiple interconnected factors at play. Let me synthesize the key findings from across your source documents to provide a comprehensive answer.",
        citations: [1, 2],
        confidence: 87,
        timestamp: "Just now",
      };
      setNotebooks((prev) =>
        prev.map((n) => (n.id === selectedNotebook ? { ...n, messages: [...n.messages, aiMsg] } : n))
      );
      setIsStreaming(false);
    }, 2000);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleRemoveSource(notebookId: string, sourceId: string) {
    setNotebooks((prev) =>
      prev.map((n) =>
        n.id === notebookId ? { ...n, sources: n.sources.filter((s) => s.id !== sourceId) } : n
      )
    );
  }

  function handleAddDSpaceSource(source: Source) {
    if (!selectedNotebook) return;
    setNotebooks((prev) =>
      prev.map((n) => n.id === selectedNotebook ? { ...n, sources: [...n.sources, source] } : n)
    );
  }

  const totalSources = notebooks.reduce((acc, n) => acc + n.sources.length, 0);
  const totalMessages = notebooks.reduce((acc, n) => acc + n.messages.length, 0);

  // ── List View ──────────────────────────────────────────────────────────────

  if (!selectedNotebook || !currentNotebook) {
    return (
      <div className="min-h-screen bg-slate-950 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">My Notebooks</h1>
            <p className="text-slate-400 text-sm mt-1">Knowledge OS</p>
          </div>
          <button className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" />
            New Notebook
          </button>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {notebooks.map((nb) => (
            <div
              key={nb.id}
              onClick={() => setSelectedNotebook(nb.id)}
              className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-rose-500/50 cursor-pointer transition-all"
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${getBadgeClasses(nb.color)}`}
                >
                  {nb.type}
                </span>
                <span className="text-slate-500 text-xs">{nb.lastUpdated}</span>
              </div>

              <h2 className="text-white font-bold text-lg mt-2">{nb.title}</h2>

              <div className="flex items-center gap-1.5 text-slate-400 text-sm mt-1">
                <Database className="w-3.5 h-3.5" />
                <span>{nb.sources.length} sources</span>
              </div>

              <div className="flex items-center gap-1.5 text-slate-400 text-sm mt-0.5">
                <MessageSquare className="w-3.5 h-3.5" />
                <span>{nb.messages.length} messages</span>
              </div>

              <button className="flex items-center gap-1 text-rose-400 hover:text-rose-300 text-sm mt-4 transition-colors">
                Open Notebook
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-8 mt-10 pt-6 border-t border-slate-800">
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <BookOpen className="w-4 h-4" />
            <span>{notebooks.length} Notebooks</span>
          </div>
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <Database className="w-4 h-4" />
            <span>{totalSources} Sources</span>
          </div>
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <MessageSquare className="w-4 h-4" />
            <span>{totalMessages} Messages</span>
          </div>
        </div>
      </div>
    );
  }

  // ── Three-panel view ───────────────────────────────────────────────────────

  const suggestedQuestions = SUGGESTED_QUESTIONS[currentNotebook.id] ?? DEFAULT_QUESTIONS;
  const followUps = FOLLOW_UPS[currentNotebook.id] ?? DEFAULT_FOLLOW_UPS;

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      {/* ── Left Panel: Sources ──────────────────────────────────────────── */}
      <div
        className="bg-slate-900 border-r border-slate-800 flex flex-col flex-shrink-0"
        style={{ width: "280px" }}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedNotebook(null)}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="font-semibold text-white flex-1">Sources</span>
            <span className="bg-rose-500/20 text-rose-400 text-xs px-2 py-0.5 rounded-full">
              {currentNotebook.sources.length}
            </span>
          </div>

          {/* Add source button */}
          <div className="relative mt-3" ref={addMenuRef}>
            <button
              onClick={() => setShowAddMenu((v) => !v)}
              className="w-full bg-rose-600 hover:bg-rose-700 text-white text-sm rounded-lg py-2 flex items-center justify-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add source
            </button>

            {showAddMenu && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-lg overflow-hidden z-50 shadow-xl">
                <button
                  onClick={() => setShowAddMenu(false)}
                  className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
                >
                  <Upload className="w-4 h-4 text-slate-400" />
                  Upload file
                </button>
                <button
                  onClick={() => setShowAddMenu(false)}
                  className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
                >
                  <Globe className="w-4 h-4 text-slate-400" />
                  Paste URL
                </button>
                <button
                  onClick={() => { setShowAddMenu(false); setShowDSpaceModal(true); }}
                  className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
                >
                  <Database className="w-4 h-4 text-amber-400" />
                  <span>Import from DSpace</span>
                  <span className="ml-auto text-[10px] bg-amber-600/20 text-amber-400 px-1.5 py-0.5 rounded font-medium">New</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Source list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {currentNotebook.sources.length === 0 ? (
            <div className="border-2 border-dashed border-slate-700 rounded-xl p-6 flex flex-col items-center justify-center gap-3 mt-4">
              <Upload className="w-8 h-8 text-slate-600" />
              <p className="text-slate-500 text-sm text-center">Drop files here or add sources</p>
            </div>
          ) : (
            currentNotebook.sources.map((source) => (
              <div
                key={source.id}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 group cursor-pointer transition-colors"
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${getSourceIconBg(source.type)}`}
                >
                  <span className={getSourceIconColor(source.type)}>
                    <SourceIcon type={source.type} />
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-xs font-medium truncate">{source.name}</p>
                  <p className="text-slate-500 text-xs">
                    {source.size}
                    {source.pages ? ` · ${source.pages}p` : ""}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveSource(currentNotebook.id, source.id);
                  }}
                  className="hidden group-hover:block ml-auto flex-shrink-0 text-slate-600 hover:text-rose-400 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Generate Audio Overview */}
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={() => setShowAudioPlayer(true)}
            className="w-full bg-slate-800 hover:bg-slate-700 text-white text-sm rounded-lg py-2 flex items-center gap-2 justify-center transition-colors"
          >
            <Headphones className="w-4 h-4" />
            Generate Audio Overview
          </button>
        </div>
      </div>

      {/* ── Center Panel: Canvas ──────────────────────────────────────────── */}
      <div className="bg-slate-950 flex flex-col overflow-hidden flex-1 min-w-0">
        {/* Toolbar */}
        <div className="border-b border-slate-800 px-6 py-3 flex items-center gap-1 flex-shrink-0">
          <input
            type="text"
            defaultValue={currentNotebook.title}
            className="bg-transparent text-white font-bold text-xl outline-none border-none flex-1 mr-4 placeholder:text-slate-600"
            placeholder="Untitled Notebook"
          />

          <div className="w-px h-5 bg-slate-700 mx-1" />

          <button className="p-2 rounded text-slate-400 hover:text-white hover:bg-slate-800 text-sm font-bold transition-colors">
            B
          </button>
          <button className="p-2 rounded text-slate-400 hover:text-white hover:bg-slate-800 text-sm font-bold italic transition-colors">
            I
          </button>
          <button className="p-2 rounded text-slate-400 hover:text-white hover:bg-slate-800 text-sm font-bold transition-colors">
            H2
          </button>
          <button className="p-2 rounded text-slate-400 hover:text-white hover:bg-slate-800 text-sm font-bold transition-colors">
            <Quote className="w-3.5 h-3.5" />
          </button>

          <div className="w-px h-5 bg-slate-700 mx-1" />

          <button className="flex items-center gap-1 text-rose-400 hover:text-rose-300 text-xs transition-colors px-2 py-1.5 rounded hover:bg-slate-800">
            <Zap className="w-3.5 h-3.5" />
            Insert AI Summary
          </button>

          <div className="ml-auto">
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${getBadgeClasses(currentNotebook.color)}`}
            >
              {currentNotebook.type}
            </span>
          </div>
        </div>

        {/* Canvas content */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-3xl mx-auto">
            <div
              className="text-slate-300 min-h-96 focus:outline-none whitespace-pre-wrap leading-relaxed"
              contentEditable
              suppressContentEditableWarning
            >
              {currentNotebook.content}
            </div>
          </div>
        </div>

        {/* Suggested questions bar */}
        <div className="border-t border-slate-800 p-4 flex-shrink-0">
          <p className="text-slate-500 text-xs mb-2">Suggested questions</p>
          <div className="flex flex-wrap gap-2">
            {suggestedQuestions.map((q, i) => (
              <button
                key={i}
                onClick={() => setChatInput(q)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-3 py-1.5 rounded-full cursor-pointer border border-slate-700 hover:border-rose-500/50 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Audio player bar */}
        {showAudioPlayer && (
          <div className="bg-slate-900 border-t border-slate-800 p-4 flex items-center gap-4 flex-shrink-0">
            <button
              onClick={() => setAudioPlaying((v) => !v)}
              className="w-9 h-9 rounded-full bg-rose-600 hover:bg-rose-700 flex items-center justify-center flex-shrink-0 transition-colors"
            >
              {audioPlaying ? (
                <Pause className="w-4 h-4 text-white" />
              ) : (
                <Play className="w-4 h-4 text-white ml-0.5" />
              )}
            </button>
            <Waveform progress={audioPlaying ? 30 : 0} />
            <span className="text-slate-400 text-xs flex-shrink-0">2:34 / 8:47</span>
            <button
              onClick={() => {
                setShowAudioPlayer(false);
                setAudioPlaying(false);
              }}
              className="ml-auto text-slate-500 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* ── Right Panel: Chat ─────────────────────────────────────────────── */}
      <div
        className="bg-slate-900 border-l border-slate-800 flex flex-col flex-shrink-0"
        style={{ width: "380px" }}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <span className="text-white font-semibold">AI Chat</span>
          <span className="bg-slate-800 border border-slate-700 text-slate-300 text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 inline-block" />
            DeepSeek R1
          </span>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {currentNotebook.messages.map((msg) => (
            <div key={msg.id} className={msg.role === "user" ? "flex justify-end" : "flex"}>
              {msg.role === "user" ? (
                <div>
                  <div className="bg-rose-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 text-sm max-w-[80%] ml-auto">
                    {msg.content}
                  </div>
                  <p className="text-slate-500 text-xs text-right mt-1">{msg.timestamp}</p>
                </div>
              ) : (
                <div className="max-w-[90%]">
                  <div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-slate-200">
                    {msg.content.split("\n\n").map((para, pi) => (
                      <p key={pi} className={pi > 0 ? "mt-2" : ""}>
                        {renderBold(para)}
                      </p>
                    ))}

                    {/* Citations */}
                    {msg.citations && msg.citations.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {msg.citations.map((c) => (
                          <span
                            key={c}
                            className="inline-flex items-center bg-rose-500/15 border border-rose-500/25 text-rose-400 text-xs px-1.5 rounded font-medium"
                          >
                            [{c}]
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Confidence */}
                    {msg.confidence !== undefined && (
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-slate-500 text-xs">Confidence</span>
                        <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full"
                            style={{ width: `${msg.confidence}%` }}
                          />
                        </div>
                        <span className="text-green-400 text-xs font-semibold">{msg.confidence}%</span>
                      </div>
                    )}
                  </div>
                  <p className="text-slate-500 text-xs mt-1">{msg.timestamp}</p>
                </div>
              )}
            </div>
          ))}

          {/* Streaming indicator */}
          {isStreaming && (
            <div className="flex">
              <div className="max-w-[90%] bg-slate-800 border border-slate-700 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-slate-400">
                Analyzing sources
                <span className="inline-block ml-0.5 animate-pulse">▋</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Follow-ups */}
        <div className="border-t border-slate-800 p-3">
          <p className="text-slate-500 text-xs mb-2">Follow-ups:</p>
          {followUps.map((fu, i) => (
            <button
              key={i}
              onClick={() => setChatInput(fu)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-300 text-xs px-3 py-1.5 rounded-lg border border-slate-700 cursor-pointer w-full text-left mb-1.5 block transition-colors"
            >
              {fu}
            </button>
          ))}
        </div>

        {/* Input area */}
        <div className="p-4 border-t border-slate-800">
          <textarea
            rows={3}
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question about your sources..."
            className="w-full bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder:text-slate-500 px-4 py-3 resize-none focus:outline-none focus:border-rose-500/50 transition-colors"
          />
          <div className="flex items-center justify-between mt-2">
            <button className="text-slate-400 hover:text-white p-1.5 rounded transition-colors">
              <Mic className="w-4 h-4" />
            </button>
            <button
              onClick={handleSend}
              disabled={isStreaming || !chatInput.trim()}
              className="bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
            >
              Send
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
      {showDSpaceModal && selectedNotebook && (
        <DSpaceModal
          notebookId={selectedNotebook}
          onAdd={handleAddDSpaceSource}
          onClose={() => setShowDSpaceModal(false)}
        />
      )}
    </div>
  );
}
