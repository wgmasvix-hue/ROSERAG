"use client";

import { useState, useRef, useCallback } from "react";
import {
  Search, Filter, X, ChevronDown, BookOpen, Plus, ExternalLink,
  FileText, Globe, Database, FileSpreadsheet, Calendar, User, Building2,
  SlidersHorizontal, Loader2, Hash, Sparkles, Quote,
} from "lucide-react";

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
  pdf: { label: "PDF", icon: FileText, badge: "badge-rose" },
  web: { label: "Web", icon: Globe, badge: "badge-blue" },
  dataset: { label: "Dataset", icon: Database, badge: "badge-purple" },
  spreadsheet: { label: "Spreadsheet", icon: FileSpreadsheet, badge: "badge-green" },
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// ─── Sub-components ───────────────────────────────────────────────────────────

function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color = pct >= 85 ? "bg-green-500" : pct >= 65 ? "bg-amber-400" : "bg-rose-400";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-semibold text-slate-500 w-9 text-right">{pct}%</span>
    </div>
  );
}

function HighlightedExcerpt({ text, highlights }: { text: string; highlights: string[] }) {
  if (!highlights.length) return <p className="text-sm text-slate-600 leading-relaxed">{text}</p>;

  const regex = new RegExp(`(${highlights.map((h) => h.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi");
  const parts = text.split(regex);

  return (
    <p className="text-sm text-slate-600 leading-relaxed">
      {parts.map((part, i) =>
        highlights.some((h) => h.toLowerCase() === part.toLowerCase()) ? (
          <mark key={i} className="bg-rose-100 text-rose-800 rounded px-0.5 not-italic">{part}</mark>
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
    <div className="card p-5 space-y-3 hover:border-rose-200 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-rose-50 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Icon className="w-4 h-4 text-rose-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-900 text-sm leading-snug line-clamp-2">{result.title}</h3>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <span className={`badge ${meta.badge}`}>{meta.label}</span>
              {result.tags.slice(0, 2).map((tag) => (
                <span key={tag} className="badge badge-blue">{tag}</span>
              ))}
            </div>
          </div>
        </div>
        <div className="flex-shrink-0 w-28">
          <div className="text-xs text-slate-400 mb-1 text-right">Confidence</div>
          <ConfidenceBar value={result.confidence} />
        </div>
      </div>

      {/* Excerpt */}
      <HighlightedExcerpt text={result.excerpt} highlights={result.highlights} />

      {/* Metadata */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
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
      <div className="flex items-center justify-between pt-1 border-t border-slate-100">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-400 font-medium">Refs:</span>
          {result.citations.map((c) => (
            <span key={c} className="cite-ref">{c}</span>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onAddToCollection(result)}
            className="btn-secondary py-1.5 px-3 text-xs"
          >
            <Plus className="w-3 h-3" /> Add to Collection
          </button>
          <button className="btn-primary py-1.5 px-3 text-xs">
            <ExternalLink className="w-3 h-3" /> Open in Studio
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
          ? "bg-rose-50 border-rose-300 text-rose-700"
          : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
      }`}
    >
      {label}
      <ChevronDown className="w-3 h-3 opacity-60" />
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SearchPage() {
  const [query, setQuery] = useState("");
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

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`${API_BASE}/api/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, mode, filters: { dateRange, fileType, repository, subjectArea } }),
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

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 xl:w-72 border-r border-slate-200 bg-slate-50/50 p-4 gap-4 flex-shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <SlidersHorizontal className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-semibold text-slate-700">Advanced Filters</h3>
          </div>

          {/* Date range */}
          <div className="space-y-2 mb-4">
            <label className="section-label">Date Range</label>
            <input type="date" className="input text-xs" value={dateRange.from}
              onChange={(e) => setDateRange((p) => ({ ...p, from: e.target.value }))} placeholder="From" />
            <input type="date" className="input text-xs" value={dateRange.to}
              onChange={(e) => setDateRange((p) => ({ ...p, to: e.target.value }))} placeholder="To" />
          </div>

          {/* File type */}
          <div className="mb-4">
            <label className="section-label">File Type</label>
            <select className="input text-xs mt-1" value={fileType} onChange={(e) => setFileType(e.target.value)}>
              <option value="all">All types</option>
              <option value="pdf">PDF</option>
              <option value="web">Web pages</option>
              <option value="dataset">Datasets</option>
              <option value="spreadsheet">Spreadsheets</option>
            </select>
          </div>

          {/* Repository */}
          <div className="mb-4">
            <label className="section-label">Repository</label>
            <select className="input text-xs mt-1" value={repository} onChange={(e) => setRepository(e.target.value)}>
              <option value="all">All repositories</option>
              <option value="fao">FAO Digital Library</option>
              <option value="cgiar">CGIAR Repository</option>
              <option value="worldbank">World Bank Open Data</option>
              <option value="zimstat">ZIMSTAT Open Data</option>
              <option value="sadc">SADC Documents Portal</option>
            </select>
          </div>

          {/* Subject area */}
          <div className="mb-4">
            <label className="section-label">Subject Area</label>
            <select className="input text-xs mt-1" value={subjectArea} onChange={(e) => setSubjectArea(e.target.value)}>
              <option value="all">All subjects</option>
              <option value="food-security">Food Security</option>
              <option value="climate">Climate Adaptation</option>
              <option value="policy">Agricultural Policy</option>
              <option value="statistics">Statistics &amp; Data</option>
              <option value="postharvest">Post-Harvest</option>
            </select>
          </div>

          <button onClick={handleSearch} className="btn-primary w-full justify-center">
            <Filter className="w-4 h-4" /> Apply Filters
          </button>
        </div>

        {searched && results.length > 0 && (
          <div className="card p-3 mt-auto">
            <p className="text-xs text-slate-500 font-medium mb-1">Results</p>
            <p className="text-2xl font-black text-slate-900">{results.length}</p>
            <p className="text-xs text-slate-400">matching documents</p>
          </div>
        )}
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <div className="p-6 space-y-5">
          {/* Page header */}
          <div>
            <h2 className="text-2xl font-black text-slate-900">Search</h2>
            <p className="text-sm text-slate-500 mt-1">Query your entire knowledge base with semantic, keyword, or citation search.</p>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              className="input pl-12 pr-12 py-3.5 text-base rounded-xl shadow-sm"
              placeholder="Search documents, datasets, policies…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            {query && (
              <button onClick={clearSearch}
                className="absolute right-14 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={handleSearch}
              disabled={!query.trim() || loading}
              className="absolute right-3 top-1/2 -translate-y-1/2 btn-primary py-1.5 px-3 text-xs disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
            </button>
          </div>

          {/* Mode tabs + filter chips */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center bg-slate-100 rounded-xl p-1 gap-1">
              {MODES.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setMode(key)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    mode === key
                      ? "bg-white text-rose-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
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
              <p className="text-slate-500 font-medium">Searching your knowledge base…</p>
            </div>
          )}

          {!loading && !searched && (
            <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center">
                <Search className="w-8 h-8 text-rose-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Start searching your knowledge base</h3>
                <p className="text-sm text-slate-400 mt-1 max-w-sm">
                  Enter a query above to find documents, datasets, and research across all your connected repositories.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center mt-2">
                {["Food security Zimbabwe", "Climate adaptation Africa", "SADC agricultural policy"].map((s) => (
                  <button
                    key={s}
                    onClick={() => { setQuery(s); setTimeout(handleSearch, 50); }}
                    className="badge badge-rose cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!loading && searched && results.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-700">No results found</h3>
              <p className="text-sm text-slate-400">Try adjusting your query or clearing filters.</p>
              <button onClick={clearSearch} className="btn-secondary mt-2">Clear search</button>
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">
                  <span className="font-semibold text-slate-800">{results.length}</span> results for{" "}
                  <span className="font-semibold text-rose-600">&ldquo;{query}&rdquo;</span>
                  <span className="ml-2 badge badge-purple">{mode}</span>
                </p>
                <select className="input w-auto text-xs py-1.5 px-3">
                  <option>Sort: Relevance</option>
                  <option>Sort: Date (newest)</option>
                  <option>Sort: Date (oldest)</option>
                  <option>Sort: Confidence</option>
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
