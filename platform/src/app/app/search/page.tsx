"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  Search, Filter, X, ChevronDown, BookOpen, Plus, ExternalLink,
  FileText, Globe, Database, FileSpreadsheet, Calendar, User, Building2,
  SlidersHorizontal, Loader2, Hash, Sparkles, Quote,
} from "lucide-react";
import { useSearchParams } from "next/navigation";

// ─── Types ────────────────────────────────────────────────────────────────────

type SearchMode = "semantic" | "keyword" | "citation";

interface SearchResult {
  id: string;
  title: string;
  excerpt: string;
  highlights: string[];
  confidence: number;
  sourceType: "pdf" | "web" | "dataset" | "spreadsheet";
  author: string;
  date: string;
  repository: string;
  citations: string[];
  tags: string[];
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_RESULTS: SearchResult[] = [
  {
    id: "1",
    title: "FAO State of Food Security and Nutrition in the World 2024",
    excerpt:
      "Global hunger remains a persistent challenge, with approximately 733 million people facing hunger in 2023. The report highlights the compounding effects of conflict, climate variability, and economic downturns on food security across sub-Saharan Africa.",
    highlights: ["food security", "733 million", "sub-Saharan Africa"],
    confidence: 0.96,
    sourceType: "pdf",
    author: "FAO, IFAD, UNICEF, WFP, WHO",
    date: "2024-07-15",
    repository: "FAO Digital Library",
    citations: ["1", "2", "3"],
    tags: ["food security", "hunger", "nutrition"],
  },
  {
    id: "2",
    title: "Climate Change Adaptation in Smallholder Farming Systems: Evidence from Zimbabwe",
    excerpt:
      "This study examines adaptation strategies adopted by smallholder farmers in Zimbabwe in response to climate variability. Key findings indicate that crop diversification and conservation agriculture practices significantly improve resilience.",
    highlights: ["smallholder farmers", "Zimbabwe", "crop diversification"],
    confidence: 0.88,
    sourceType: "pdf",
    author: "Chikodzi, D. & Murwendo, T.",
    date: "2023-11-02",
    repository: "CGIAR Repository",
    citations: ["4", "5"],
    tags: ["climate adaptation", "Zimbabwe", "smallholder"],
  },
  {
    id: "3",
    title: "SADC Regional Agricultural Policy Framework 2030",
    excerpt:
      "The Southern African Development Community outlines a strategic framework to enhance agricultural productivity, value chain development, and intra-regional trade. Priority interventions focus on irrigation expansion and seed system development.",
    highlights: ["SADC", "agricultural productivity", "value chain"],
    confidence: 0.81,
    sourceType: "pdf",
    author: "SADC Secretariat",
    date: "2023-06-20",
    repository: "SADC Documents Portal",
    citations: ["6"],
    tags: ["SADC", "policy", "agriculture"],
  },
  {
    id: "4",
    title: "Post-Harvest Losses in Sub-Saharan Africa: Dataset 2022–2023",
    excerpt:
      "Compiled survey data covering 14 countries measuring post-harvest loss rates across major staple crops including maize, sorghum, and cassava. Average losses of 20–30% observed at farm and storage levels.",
    highlights: ["post-harvest losses", "sub-Saharan Africa", "staple crops"],
    confidence: 0.75,
    sourceType: "dataset",
    author: "World Bank Agriculture Unit",
    date: "2023-03-10",
    repository: "World Bank Open Data",
    citations: ["7", "8"],
    tags: ["post-harvest", "data", "staple crops"],
  },
  {
    id: "5",
    title: "Zimbabwe Agricultural Statistics Annual Report 2023 (ZIMSTAT)",
    excerpt:
      "Comprehensive agricultural production statistics covering crop output, livestock numbers, and farm household data across all provinces. Maize production declined 12% due to El Niño-related drought conditions.",
    highlights: ["Zimbabwe", "agricultural statistics", "El Niño"],
    confidence: 0.72,
    sourceType: "spreadsheet",
    author: "Zimbabwe National Statistics Agency",
    date: "2023-12-01",
    repository: "ZIMSTAT Open Data",
    citations: ["9"],
    tags: ["Zimbabwe", "statistics", "crop output"],
  },
];

const SOURCE_TYPE_META = {
  pdf: { label: "PDF", icon: FileText, bg: "bg-rose-500/15", color: "text-rose-400", badge: "badge-rose" },
  web: { label: "Web", icon: Globe, bg: "bg-blue-500/15", color: "text-blue-400", badge: "badge-blue" },
  dataset: { label: "Dataset", icon: Database, bg: "bg-purple-500/15", color: "text-purple-400", badge: "badge-purple" },
  spreadsheet: { label: "Spreadsheet", icon: FileSpreadsheet, bg: "bg-green-500/15", color: "text-green-400", badge: "badge-green" },
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// ─── Sub-components ───────────────────────────────────────────────────────────

function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color = pct >= 85 ? "bg-green-500" : pct >= 65 ? "bg-amber-400" : "bg-rose-400";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-semibold text-slate-400 w-9 text-right">{pct}%</span>
    </div>
  );
}

function HighlightedExcerpt({ text, highlights }: { text: string; highlights: string[] }) {
  if (!highlights.length) return <p className="text-sm text-slate-400 leading-relaxed">{text}</p>;

  const regex = new RegExp(`(${highlights.map((h) => h.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi");
  const parts = text.split(regex);

  return (
    <p className="text-sm text-slate-400 leading-relaxed">
      {parts.map((part, i) =>
        highlights.some((h) => h.toLowerCase() === part.toLowerCase()) ? (
          <mark key={i} className="bg-rose-500/20 text-rose-300 rounded px-0.5 not-italic">{part}</mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </p>
  );
}

function ResultCard({ result, onAddToCollection }: { result: SearchResult; onAddToCollection: (r: SearchResult) => void }) {
  const meta = SOURCE_TYPE_META[result.sourceType];
  const Icon = meta.icon;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3 hover:border-rose-500/40 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className={`w-9 h-9 rounded-lg ${meta.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
            <Icon className={`w-4 h-4 ${meta.color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white text-sm leading-snug line-clamp-2">{result.title}</h3>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <span className={`badge ${meta.badge}`}>{meta.label}</span>
              {result.tags.slice(0, 2).map((tag) => (
                <span key={tag} className="badge badge-blue">{tag}</span>
              ))}
            </div>
          </div>
        </div>
        <div className="flex-shrink-0 w-28 hidden sm:block">
          <div className="text-xs text-slate-500 mb-1 text-right">Confidence</div>
          <ConfidenceBar value={result.confidence} />
        </div>
      </div>

      {/* Confidence bar on mobile */}
      <div className="sm:hidden">
        <div className="text-xs text-slate-500 mb-1">Confidence</div>
        <ConfidenceBar value={result.confidence} />
      </div>

      {/* Excerpt */}
      <HighlightedExcerpt text={result.excerpt} highlights={result.highlights} />

      {/* Metadata */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <User className="w-3 h-3" />
          {result.author}
        </span>
        <span className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {new Date(result.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
        </span>
        <span className="flex items-center gap-1">
          <Building2 className="w-3 h-3" />
          {result.repository}
        </span>
      </div>

      {/* Footer */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-800">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-500 font-medium">Refs:</span>
          {result.citations.map((c) => (
            <span key={c} className="cite-ref">{c}</span>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onAddToCollection(result)}
            className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 py-1.5 px-3 rounded-lg text-xs font-medium transition-colors"
          >
            <Plus className="w-3 h-3" /> Collection
          </button>
          <button className="inline-flex items-center gap-1.5 bg-rose-600 hover:bg-rose-500 text-white py-1.5 px-3 rounded-lg text-xs font-medium transition-colors">
            <ExternalLink className="w-3 h-3" /> Open
          </button>
        </div>
      </div>
    </div>
  );
}

function FilterChip({ label, active, onToggle }: { label: string; active: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
        active
          ? "bg-rose-500/15 border-rose-500/40 text-rose-400"
          : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-300"
      }`}
    >
      {label}
      <ChevronDown className="w-3 h-3 opacity-60" />
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SearchPage() {
  const searchParams = useSearchParams();
  const initialQ = searchParams?.get("q") ?? "";

  const [query, setQuery] = useState(initialQ);
  const [mode, setMode] = useState<SearchMode>("semantic");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [fileType, setFileType] = useState("all");
  const [repository, setRepository] = useState("all");
  const [subjectArea, setSubjectArea] = useState("all");
  const inputRef = useRef<HTMLInputElement>(null);

  const toggleFilter = (f: string) =>
    setActiveFilters((prev) => (prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]));

  const handleSearch = useCallback(async (q?: string) => {
    const searchQuery = q ?? query;
    if (!searchQuery.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`${API_BASE}/api/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery, mode, filters: { dateRange, fileType, repository, subjectArea } }),
      });
      if (res.ok) {
        const data = await res.json();
        setResults(data.results ?? []);
      } else {
        setResults(MOCK_RESULTS);
      }
    } catch {
      setResults(MOCK_RESULTS);
    } finally {
      setLoading(false);
    }
  }, [query, mode, dateRange, fileType, repository, subjectArea]);

  // Auto-search on mount if query param is present
  useEffect(() => {
    if (initialQ) handleSearch(initialQ);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  const clearSearch = () => {
    setQuery("");
    setResults([]);
    setSearched(false);
    inputRef.current?.focus();
  };

  const MODES: { key: SearchMode; label: string; icon: typeof Search }[] = [
    { key: "semantic", label: "Semantic", icon: Sparkles },
    { key: "keyword", label: "Keyword", icon: Hash },
    { key: "citation", label: "Citation", icon: Quote },
  ];

  const inputClass = "w-full bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-rose-500/60 transition-colors";
  const selectClass = `${inputClass} appearance-none`;

  return (
    <div className="flex h-full bg-slate-950">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 xl:w-72 border-r border-slate-800 bg-slate-900/40 p-4 gap-4 flex-shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <SlidersHorizontal className="w-4 h-4 text-slate-500" />
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Filters</h3>
          </div>

          {/* Date range */}
          <div className="space-y-2 mb-5">
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Date Range</label>
            <input type="date" className={inputClass} value={dateRange.from}
              onChange={(e) => setDateRange((p) => ({ ...p, from: e.target.value }))} />
            <input type="date" className={inputClass} value={dateRange.to}
              onChange={(e) => setDateRange((p) => ({ ...p, to: e.target.value }))} />
          </div>

          {/* File type */}
          <div className="mb-5">
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">File Type</label>
            <select className={selectClass} value={fileType} onChange={(e) => setFileType(e.target.value)}>
              <option value="all">All types</option>
              <option value="pdf">PDF</option>
              <option value="web">Web pages</option>
              <option value="dataset">Datasets</option>
              <option value="spreadsheet">Spreadsheets</option>
            </select>
          </div>

          {/* Repository */}
          <div className="mb-5">
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Repository</label>
            <select className={selectClass} value={repository} onChange={(e) => setRepository(e.target.value)}>
              <option value="all">All repositories</option>
              <option value="fao">FAO Digital Library</option>
              <option value="cgiar">CGIAR Repository</option>
              <option value="worldbank">World Bank Open Data</option>
              <option value="zimstat">ZIMSTAT Open Data</option>
              <option value="sadc">SADC Documents Portal</option>
            </select>
          </div>

          {/* Subject area */}
          <div className="mb-5">
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Subject Area</label>
            <select className={selectClass} value={subjectArea} onChange={(e) => setSubjectArea(e.target.value)}>
              <option value="all">All subjects</option>
              <option value="food-security">Food Security</option>
              <option value="climate">Climate Adaptation</option>
              <option value="policy">Agricultural Policy</option>
              <option value="statistics">Statistics &amp; Data</option>
              <option value="postharvest">Post-Harvest</option>
            </select>
          </div>

          <button
            onClick={() => handleSearch()}
            className="flex items-center justify-center gap-2 w-full bg-rose-600 hover:bg-rose-500 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
          >
            <Filter className="w-4 h-4" /> Apply Filters
          </button>
        </div>

        {searched && results.length > 0 && (
          <div className="mt-auto bg-slate-800 border border-slate-700 rounded-xl p-4">
            <p className="text-xs text-slate-500 font-medium mb-1">Results found</p>
            <p className="text-3xl font-black text-white">{results.length}</p>
            <p className="text-xs text-slate-500">matching documents</p>
          </div>
        )}
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
          {/* Page header */}
          <div>
            <h2 className="text-xl font-bold text-white">Hybrid Search</h2>
            <p className="text-sm text-slate-500 mt-0.5">Query the DARE repository with semantic, keyword, or citation search.</p>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              className="w-full bg-slate-900 border border-slate-800 hover:border-slate-700 focus:border-rose-500/60 text-white placeholder:text-slate-500 pl-12 pr-24 py-3.5 text-sm rounded-xl focus:outline-none transition-colors"
              placeholder="Search documents, datasets, policies…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            {query && (
              <button onClick={clearSearch}
                className="absolute right-24 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors p-1">
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => handleSearch()}
              disabled={!query.trim() || loading}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-xs px-4 py-2 rounded-lg transition-colors"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
            </button>
          </div>

          {/* Mode tabs + filter chips */}
          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-3">
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 gap-1">
              {MODES.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setMode(key)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    mode === key
                      ? "bg-slate-800 text-rose-400 shadow-sm"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {["Date", "Source Type", "Institution", "Author"].map((f) => (
                <FilterChip key={f} label={f} active={activeFilters.includes(f)} onToggle={() => toggleFilter(f)} />
              ))}
            </div>
          </div>

          {/* Results / Empty state */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <Loader2 className="w-10 h-10 text-rose-400 animate-spin" />
              <p className="text-slate-400 font-medium">Searching the DARE repository…</p>
            </div>
          )}

          {!loading && !searched && (
            <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                <Search className="w-8 h-8 text-rose-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Search the DARE repository</h3>
                <p className="text-sm text-slate-500 mt-1 max-w-sm">
                  Enter a query above to find documents, datasets, and research across all connected repositories.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center mt-1">
                {["Food security Zimbabwe", "Climate adaptation Africa", "SADC agricultural policy"].map((s) => (
                  <button
                    key={s}
                    onClick={() => { setQuery(s); handleSearch(s); }}
                    className="text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 px-3 py-1.5 rounded-full transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!loading && searched && results.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-slate-500" />
              </div>
              <h3 className="text-base font-bold text-white">No results found</h3>
              <p className="text-sm text-slate-500">Try adjusting your query or clearing filters.</p>
              <button
                onClick={clearSearch}
                className="mt-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Clear search
              </button>
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-slate-500">
                  <span className="font-semibold text-white">{results.length}</span> results for{" "}
                  <span className="font-semibold text-rose-400">&ldquo;{query}&rdquo;</span>
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-500/15 text-purple-400">{mode}</span>
                </p>
                <select className="bg-slate-800 border border-slate-700 text-slate-300 text-xs py-1.5 px-3 rounded-lg focus:outline-none">
                  <option>Relevance</option>
                  <option>Date (newest)</option>
                  <option>Date (oldest)</option>
                  <option>Confidence</option>
                </select>
              </div>
              {results.map((r) => (
                <ResultCard key={r.id} result={r} onAddToCollection={(res) => alert(`Added "${res.title}" to collection`)} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
