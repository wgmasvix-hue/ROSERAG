"use client";

import { useState, useRef, useCallback } from "react";
import {
  Upload, Link, Plug, FileText, Globe, RefreshCw,
  CheckCircle, Clock, AlertCircle, Trash2, Plus, Settings,
  ChevronRight, CloudUpload, ArrowRight,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type Tab = "upload" | "url" | "connectors";
type FileStatus = "pending" | "uploading" | "done" | "error";

interface QueuedFile {
  id: string;
  name: string;
  size: string;
  type: string;
  status: FileStatus;
  progress: number;
}

interface UrlEntry {
  id: string;
  url: string;
  status: "queued" | "crawling" | "done" | "error";
  pages?: number;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const CONNECTORS = [
  { id: "dspace", name: "DSpace", emoji: "🏛️", status: "connected", docs: 5842, color: "badge-blue" },
  { id: "koha", name: "Koha ILS", emoji: "📚", status: "connected", docs: 1874, color: "badge-green" },
  { id: "openalex", name: "OpenAlex", emoji: "🔬", status: "connected", docs: 3201, color: "badge-purple" },
  { id: "pubmed", name: "PubMed Central", emoji: "🧬", status: "syncing", docs: 2450, color: "badge-amber" },
  { id: "gdrive", name: "Google Drive", emoji: "📁", status: "disconnected", docs: 0, color: "badge-rose" },
  { id: "arxiv", name: "arXiv", emoji: "📄", status: "disconnected", docs: 0, color: "badge-rose" },
  { id: "semantic", name: "Semantic Scholar", emoji: "🎓", status: "connected", docs: 987, color: "badge-blue" },
  { id: "zenodo", name: "Zenodo", emoji: "📦", status: "disconnected", docs: 0, color: "badge-rose" },
  { id: "orcid", name: "ORCID", emoji: "🆔", status: "disconnected", docs: 0, color: "badge-rose" },
];

const RECENT_ACTIVITY = [
  { id: "a1", label: "FAO Food Security Report 2024.pdf", source: "File Upload", time: "2h ago", status: "done" as FileStatus, docs: 48 },
  { id: "a2", label: "DSpace sync — Agricultural Research Collection", source: "DSpace", time: "5h ago", status: "done" as FileStatus, docs: 234 },
  { id: "a3", label: "https://www.fao.org/food-security", source: "Web Crawl", time: "6h ago", status: "done" as FileStatus, docs: 17 },
  { id: "a4", label: "ZIMSTAT Agricultural Survey 2023.xlsx", source: "File Upload", time: "1d ago", status: "pending" as FileStatus, docs: 0 },
  { id: "a5", label: "PubMed harvest — malnutrition Zimbabwe", source: "PubMed Central", time: "1d ago", status: "done" as FileStatus, docs: 112 },
];

const SUPPORTED_FORMATS = [
  { ext: "PDF", color: "badge-rose" },
  { ext: "DOCX", color: "badge-blue" },
  { ext: "XLSX", color: "badge-green" },
  { ext: "CSV", color: "badge-green" },
  { ext: "TXT", color: "badge-blue" },
  { ext: "HTML", color: "badge-amber" },
  { ext: "MD", color: "badge-purple" },
  { ext: "JSON", color: "badge-amber" },
];

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── Status badge helper ──────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { cls: string; label: string }> = {
    connected: { cls: "badge-green", label: "Connected" },
    syncing: { cls: "badge-amber", label: "Syncing…" },
    disconnected: { cls: "badge-rose", label: "Not connected" },
    done: { cls: "badge-green", label: "Done" },
    pending: { cls: "badge-amber", label: "Pending" },
    uploading: { cls: "badge-blue", label: "Uploading" },
    error: { cls: "badge-rose", label: "Error" },
    queued: { cls: "badge-amber", label: "Queued" },
    crawling: { cls: "badge-blue", label: "Crawling" },
  };
  const s = map[status] ?? { cls: "badge-blue", label: status };
  return <span className={`badge ${s.cls}`}>{s.label}</span>;
}

// ─── Upload Tab ───────────────────────────────────────────────────────────────

function UploadTab() {
  const [files, setFiles] = useState<QueuedFile[]>([]);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((raw: FileList | null) => {
    if (!raw) return;
    const newFiles: QueuedFile[] = Array.from(raw).map((f) => ({
      id: `${Date.now()}-${f.name}`,
      name: f.name,
      size: formatBytes(f.size),
      type: f.name.split(".").pop()?.toUpperCase() ?? "FILE",
      status: "pending",
      progress: 0,
    }));
    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const simulateUpload = async (id: string) => {
    setFiles((p) => p.map((f) => f.id === id ? { ...f, status: "uploading", progress: 0 } : f));
    for (let pct = 0; pct <= 100; pct += 10) {
      await new Promise((r) => setTimeout(r, 80));
      setFiles((p) => p.map((f) => f.id === id ? { ...f, progress: pct } : f));
    }
    setFiles((p) => p.map((f) => f.id === id ? { ...f, status: "done", progress: 100 } : f));
  };

  const uploadAll = async () => {
    const pending = files.filter((f) => f.status === "pending");
    for (const f of pending) await simulateUpload(f.id);
  };

  const remove = (id: string) => setFiles((p) => p.filter((f) => f.id !== id));

  return (
    <div className="space-y-5">
      {/* Drop zone */}
      <div
        className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer
          ${dragging ? "border-rose-500 bg-rose-50" : "border-slate-300 bg-slate-50 hover:border-rose-400 hover:bg-rose-50/50"}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
      >
        <input ref={inputRef} type="file" multiple className="hidden" onChange={(e) => addFiles(e.target.files)} />
        <CloudUpload className={`w-12 h-12 mx-auto mb-3 ${dragging ? "text-rose-500" : "text-slate-400"}`} />
        <p className="font-semibold text-slate-700 mb-1">Drop files here or click to browse</p>
        <p className="text-xs text-slate-400">Max 50 MB per file · Multiple files supported</p>
        <div className="flex flex-wrap justify-center gap-1.5 mt-3">
          {SUPPORTED_FORMATS.map((f) => (
            <span key={f.ext} className={`badge ${f.color}`}>{f.ext}</span>
          ))}
        </div>
      </div>

      {/* File queue */}
      {files.length > 0 && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 text-sm">Upload Queue ({files.length})</h3>
            <div className="flex gap-2">
              <button onClick={() => setFiles([])} className="btn-secondary text-xs py-1.5 px-3">
                Clear All
              </button>
              <button onClick={uploadAll} className="btn-primary text-xs py-1.5 px-3">
                <Upload className="w-3.5 h-3.5" /> Upload All
              </button>
            </div>
          </div>
          <div className="space-y-3">
            {files.map((f) => (
              <div key={f.id} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-rose-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-slate-800 truncate">{f.name}</span>
                    <span className="text-xs text-slate-400 ml-2 flex-shrink-0">{f.size}</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-200 ${
                        f.status === "done" ? "bg-green-500" : f.status === "error" ? "bg-red-500" : "bg-rose-500"
                      }`}
                      style={{ width: `${f.progress}%` }}
                    />
                  </div>
                </div>
                <StatusBadge status={f.status} />
                <button onClick={() => remove(f.id)} className="text-slate-300 hover:text-rose-500 transition-colors flex-shrink-0">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── URL Tab ──────────────────────────────────────────────────────────────────

function UrlTab() {
  const [urlInput, setUrlInput] = useState("");
  const [depth, setDepth] = useState("2");
  const [maxPages, setMaxPages] = useState("50");
  const [queue, setQueue] = useState<UrlEntry[]>([
    { id: "u1", url: "https://www.fao.org/food-security/en/", status: "done", pages: 17 },
    { id: "u2", url: "https://www.zimstat.co.zw/agriculture", status: "queued" },
  ]);

  const addUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    setQueue((prev) => [...prev, { id: `u-${Date.now()}`, url: trimmed, status: "queued" }]);
    setUrlInput("");
  };

  return (
    <div className="space-y-5">
      <div className="card p-5 space-y-4">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <Globe className="w-4 h-4 text-rose-500" /> Add URL or Website
        </h3>
        <div className="flex gap-2">
          <input
            type="url" value={urlInput} onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://example.com/research"
            className="input flex-1"
            onKeyDown={(e) => e.key === "Enter" && addUrl()}
          />
          <button onClick={addUrl} className="btn-primary flex-shrink-0">
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>

        {/* Crawl settings */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1.5">Crawl Depth</label>
            <select value={depth} onChange={(e) => setDepth(e.target.value)} className="input text-sm">
              {["1","2","3","4","5"].map((v) => <option key={v} value={v}>{v} level{v !== "1" ? "s" : ""}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1.5">Max Pages</label>
            <select value={maxPages} onChange={(e) => setMaxPages(e.target.value)} className="input text-sm">
              {["10","25","50","100","250","500"].map((v) => <option key={v} value={v}>{v} pages</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* URL queue */}
      {queue.length > 0 && (
        <div className="card p-5">
          <h3 className="font-bold text-slate-900 text-sm mb-4">URL Queue ({queue.length})</h3>
          <div className="space-y-3">
            {queue.map((entry) => (
              <div key={entry.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
                <Globe className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-700 truncate">{entry.url}</p>
                  {entry.pages && (
                    <p className="text-xs text-slate-400 mt-0.5">{entry.pages} pages ingested</p>
                  )}
                </div>
                <StatusBadge status={entry.status} />
                <button onClick={() => setQueue((p) => p.filter((u) => u.id !== entry.id))}
                  className="text-slate-300 hover:text-rose-500 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
          <button className="btn-primary mt-4 text-sm">
            <CloudUpload className="w-4 h-4" /> Start Crawl
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Connectors Tab ───────────────────────────────────────────────────────────

function ConnectorsTab() {
  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-500">
        Connect external repositories to automatically harvest and sync documents into RoseRAG.
      </p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {CONNECTORS.map((c) => (
          <div key={c.id} className="card p-4 flex flex-col gap-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{c.emoji}</span>
                <div>
                  <div className="font-semibold text-slate-900 text-sm">{c.name}</div>
                  <StatusBadge status={c.status} />
                </div>
              </div>
              {c.status !== "disconnected" && (
                <button className="text-slate-300 hover:text-slate-500 transition-colors">
                  <Settings className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {c.docs > 0 && (
              <div className="text-xs text-slate-500">
                <span className="font-semibold text-slate-800">{c.docs.toLocaleString()}</span> documents indexed
              </div>
            )}
            <button className={c.status === "disconnected" ? "btn-primary text-xs py-1.5" : "btn-secondary text-xs py-1.5"}>
              {c.status === "disconnected" ? (
                <><Plug className="w-3.5 h-3.5" /> Connect</>
              ) : c.status === "syncing" ? (
                <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Syncing…</>
              ) : (
                <><RefreshCw className="w-3.5 h-3.5" /> Sync Now</>
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function IngestionPage() {
  const [tab, setTab] = useState<Tab>("upload");

  const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "upload", label: "Upload Files", icon: Upload },
    { id: "url", label: "URL / Web", icon: Link },
    { id: "connectors", label: "API Connectors", icon: Plug },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
          <CloudUpload className="w-7 h-7 text-rose-500" />
          Hybrid Knowledge Ingestion Hub
        </h2>
        <p className="text-slate-500 text-sm mt-1">
          Ingest documents via file upload, web crawl, or institutional repository connectors.
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Documents Indexed", value: "12,847", icon: FileText, color: "bg-blue-50 text-blue-600" },
          { label: "Active Connectors", value: "4 / 9", icon: Plug, color: "bg-green-50 text-green-600" },
          { label: "Processing Queue", value: "3 items", icon: Clock, color: "bg-amber-50 text-amber-600" },
        ].map((s) => (
          <div key={s.label} className="card p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl ${s.color} flex items-center justify-center flex-shrink-0`}>
              <s.icon className="w-4 h-4" />
            </div>
            <div>
              <div className="font-black text-slate-900 text-lg leading-none">{s.value}</div>
              <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === t.id
                ? "bg-white text-rose-600 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {tab === "upload" && <UploadTab />}
        {tab === "url" && <UrlTab />}
        {tab === "connectors" && <ConnectorsTab />}
      </div>

      {/* Recent activity */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-900">Recent Ingestion Activity</h3>
          <button className="text-xs text-rose-600 hover:text-rose-700 font-medium flex items-center gap-1">
            View all <ArrowRight className="w-3 h-3" />
          </button>
        </div>
        <div className="space-y-3">
          {RECENT_ACTIVITY.map((a) => {
            const Icon = a.status === "done" ? CheckCircle : a.status === "error" ? AlertCircle : Clock;
            const iconColor = a.status === "done" ? "text-green-500" : a.status === "error" ? "text-red-500" : "text-amber-500";
            return (
              <div key={a.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${iconColor}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-800 truncate">{a.label}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {a.source} · {a.time}
                    {a.docs > 0 && <> · <span className="font-semibold">{a.docs} docs</span></>}
                  </p>
                </div>
                <StatusBadge status={a.status} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
