"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  BookOpen,
  Plus,
  FileText,
  Link2,
  MessageSquare,
  Clock,
  ChevronRight,
  X,
  Send,
  StopCircle,
  Upload,
  Globe,
  ChevronLeft,
  Paperclip,
  Sparkles,
  FlaskConical,
  GraduationCap,
  FolderKanban,
  User,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type NotebookType = "Research" | "Teaching" | "Project" | "Personal";

interface Source {
  id: string;
  kind: "file" | "url";
  name: string;
  size?: string;
  url?: string;
  addedAt: string;
}

interface CitationRef {
  index: number;
  sourceId: string;
  excerpt: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: CitationRef[];
  streaming?: boolean;
  timestamp: string;
}

interface Notebook {
  id: string;
  title: string;
  type: NotebookType;
  sources: Source[];
  messages: ChatMessage[];
  updatedAt: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_META: Record<NotebookType, { badge: string; icon: React.ReactNode; label: string }> = {
  Research: {
    badge: "badge badge-rose",
    icon: <FlaskConical size={12} />,
    label: "Research",
  },
  Teaching: {
    badge: "badge badge-blue",
    icon: <GraduationCap size={12} />,
    label: "Teaching",
  },
  Project: {
    badge: "badge badge-green",
    icon: <FolderKanban size={12} />,
    label: "Project",
  },
  Personal: {
    badge: "badge badge-purple",
    icon: <User size={12} />,
    label: "Personal",
  },
};

const SEED_SOURCES: Source[] = [
  { id: "s1", kind: "file", name: "attention_is_all_you_need.pdf", size: "1.4 MB", addedAt: "2 days ago" },
  { id: "s2", kind: "url", name: "The Illustrated Transformer", url: "https://jalammar.github.io/illustrated-transformer/", addedAt: "2 days ago" },
  { id: "s3", kind: "file", name: "bert_pretraining.pdf", size: "892 KB", addedAt: "1 day ago" },
];

const SEED_NOTEBOOKS: Notebook[] = [
  {
    id: "nb1",
    title: "Transformer Architecture Deep Dive",
    type: "Research",
    sources: SEED_SOURCES,
    messages: [
      {
        id: "m1",
        role: "user",
        content: "Explain the self-attention mechanism in transformers.",
        timestamp: "Yesterday",
      },
      {
        id: "m2",
        role: "assistant",
        content:
          "Self-attention allows each token to attend to every other token in the sequence. For each position, the model computes queries, keys, and values <span class=\"cite-ref\">1</span>, then uses scaled dot-product attention to produce weighted sums of values <span class=\"cite-ref\">2</span>.",
        citations: [
          { index: 1, sourceId: "s1", excerpt: "Scaled Dot-Product Attention: We call our particular attention 'Scaled Dot-Product Attention'..." },
          { index: 2, sourceId: "s2", excerpt: "The attention function maps a query and a set of key-value pairs to an output..." },
        ],
        timestamp: "Yesterday",
      },
    ],
    updatedAt: "1 day ago",
  },
  {
    id: "nb2",
    title: "ML Course — Week 4 Notes",
    type: "Teaching",
    sources: [
      { id: "t1", kind: "file", name: "lecture_slides_w4.pdf", size: "3.2 MB", addedAt: "3 days ago" },
      { id: "t2", kind: "url", name: "CS229 Notes — Backpropagation", url: "https://cs229.stanford.edu", addedAt: "3 days ago" },
    ],
    messages: [],
    updatedAt: "3 days ago",
  },
  {
    id: "nb3",
    title: "RoseRAG Product Roadmap",
    type: "Project",
    sources: [
      { id: "p1", kind: "file", name: "product_brief_v2.docx", size: "214 KB", addedAt: "5 days ago" },
    ],
    messages: [],
    updatedAt: "5 days ago",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatContent(raw: string): string {
  // Already contains cite-ref spans from seed data, pass through
  return raw;
}

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: NotebookType }) {
  const meta = TYPE_META[type];
  return (
    <span className={meta.badge} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
      {meta.icon}
      {meta.label}
    </span>
  );
}

function NotebookCard({ notebook, onClick }: { notebook: Notebook; onClick: () => void }) {
  return (
    <div className="card-hover p-5" onClick={onClick}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="font-semibold text-slate-900 text-sm leading-snug flex-1">{notebook.title}</h3>
        <TypeBadge type={notebook.type} />
      </div>
      <div className="flex items-center gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <Paperclip size={11} />
          {notebook.sources.length} source{notebook.sources.length !== 1 ? "s" : ""}
        </span>
        <span className="flex items-center gap-1">
          <MessageSquare size={11} />
          {notebook.messages.length} message{notebook.messages.length !== 1 ? "s" : ""}
        </span>
        <span className="flex items-center gap-1 ml-auto">
          <Clock size={11} />
          {notebook.updatedAt}
        </span>
      </div>
      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
        <div className="flex gap-1">
          {notebook.sources.slice(0, 3).map((src) => (
            <span key={src.id} className="text-xs text-slate-400 truncate max-w-[90px]">
              {src.name}
            </span>
          ))}
          {notebook.sources.length > 3 && (
            <span className="text-xs text-slate-400">+{notebook.sources.length - 3}</span>
          )}
        </div>
        <ChevronRight size={14} className="text-slate-400" />
      </div>
    </div>
  );
}

function NewNotebookModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (title: string, type: NotebookType) => void;
}) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<NotebookType>("Research");

  function submit() {
    const t = title.trim();
    if (!t) return;
    onCreate(t, type);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="card w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-slate-900 text-base">New Notebook</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="section-label block mb-1">Title</label>
            <input
              className="input"
              placeholder="e.g. Attention Mechanisms Study"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              autoFocus
            />
          </div>

          <div>
            <label className="section-label block mb-2">Type</label>
            <div className="grid grid-cols-2 gap-2">
              {(["Research", "Teaching", "Project", "Personal"] as NotebookType[]).map((t) => {
                const meta = TYPE_META[t];
                return (
                  <button
                    key={t}
                    onClick={() => setType(t)}
                    className={`flex items-center gap-2 p-3 rounded-lg border text-sm font-medium transition-all ${
                      type === t
                        ? "border-rose-500 bg-rose-50 text-rose-700"
                        : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <span className={type === t ? "text-rose-600" : "text-slate-400"}>{meta.icon}</span>
                    {meta.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button className="btn-secondary flex-1" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn-primary flex-1"
            onClick={submit}
            disabled={!title.trim()}
            style={{ opacity: title.trim() ? 1 : 0.5 }}
          >
            <BookOpen size={14} />
            Create Notebook
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Chat View ────────────────────────────────────────────────────────────────

function ChatView({
  notebook,
  onBack,
  onUpdate,
}: {
  notebook: Notebook;
  onBack: () => void;
  onUpdate: (nb: Notebook) => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(notebook.messages);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [activeCitations, setActiveCitations] = useState<CitationRef[] | null>(null);
  const [addingUrl, setAddingUrl] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const stopStream = useCallback(() => {
    abortRef.current?.abort();
    setStreaming(false);
    setMessages((prev) =>
      prev.map((m) =>
        m.streaming ? { ...m, streaming: false } : m
      )
    );
  }, []);

  async function sendMessage() {
    const text = input.trim();
    if (!text || streaming) return;
    setInput("");

    const userMsg: ChatMessage = {
      id: uid(),
      role: "user",
      content: text,
      timestamp: "Just now",
    };

    const assistantId = uid();
    const assistantMsg: ChatMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
      streaming: true,
      timestamp: "Just now",
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setStreaming(true);
    setActiveCitations(null);

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const res = await fetch("/api/ask/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: text,
          sources: notebook.sources.map((s) => s.id),
        }),
        signal: ctrl.signal,
      });

      if (!res.ok || !res.body) throw new Error("Stream unavailable");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        // SSE: lines starting with "data: "
        for (const line of chunk.split("\n")) {
          if (line.startsWith("data: ")) {
            const payload = line.slice(6).trim();
            if (payload === "[DONE]") break;
            try {
              const parsed = JSON.parse(payload);
              const delta = parsed?.choices?.[0]?.delta?.content ?? parsed?.delta ?? "";
              accumulated += delta;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? { ...m, content: accumulated } : m
                )
              );
            } catch {
              accumulated += payload;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? { ...m, content: accumulated } : m
                )
              );
            }
          }
        }
      }

      // Mark done
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId ? { ...m, streaming: false } : m
        )
      );
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      // Fallback: simulate a stub response
      const stub =
        "I'm analyzing your sources. Please ensure the `/api/ask/stream` endpoint is running. " +
        `Your notebook has ${notebook.sources.length} source${notebook.sources.length !== 1 ? "s" : ""} ready for retrieval.`;
      let i = 0;
      const interval = setInterval(() => {
        i += 3;
        const partial = stub.slice(0, i);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: partial, streaming: i < stub.length }
              : m
          )
        );
        if (i >= stub.length) clearInterval(interval);
      }, 18);
    } finally {
      setStreaming(false);
    }
  }

  function addUrl() {
    const url = urlInput.trim();
    if (!url) return;
    const newSource: Source = {
      id: uid(),
      kind: "url",
      name: url.replace(/^https?:\/\//, "").slice(0, 40),
      url,
      addedAt: "Just now",
    };
    const updated = { ...notebook, sources: [...notebook.sources, newSource] };
    onUpdate(updated);
    setUrlInput("");
    setAddingUrl(false);
  }

  const sources = notebook.sources;

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-slate-200 shrink-0">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ChevronLeft size={16} />
          Notebooks
        </button>
        <span className="text-slate-300">/</span>
        <h1 className="font-semibold text-slate-900 text-sm truncate flex-1">{notebook.title}</h1>
        <TypeBadge type={notebook.type} />
      </div>

      {/* Three-panel body */}
      <div className="flex flex-1 min-h-0">
        {/* Left: Sources panel */}
        <aside className="w-56 shrink-0 bg-white border-r border-slate-200 flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Sources</span>
            <span className="badge badge-rose">{sources.length}</span>
          </div>

          <div className="flex-1 overflow-y-auto py-2">
            {sources.map((src) => (
              <div
                key={src.id}
                className="flex items-start gap-2 px-3 py-2 hover:bg-slate-50 transition-colors cursor-default"
              >
                <span className="mt-0.5 text-slate-400 shrink-0">
                  {src.kind === "file" ? <FileText size={13} /> : <Globe size={13} />}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-700 truncate">{src.name}</p>
                  {src.size && <p className="text-[10px] text-slate-400">{src.size}</p>}
                  <p className="text-[10px] text-slate-400">{src.addedAt}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 border-t border-slate-100 space-y-2">
            <label className="btn-secondary w-full justify-center text-xs py-2 cursor-pointer">
              <Upload size={12} />
              Upload file
              <input type="file" className="hidden" multiple />
            </label>

            {addingUrl ? (
              <div className="space-y-1">
                <input
                  className="input text-xs py-1.5"
                  placeholder="https://..."
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addUrl()}
                  autoFocus
                />
                <div className="flex gap-1">
                  <button className="btn-primary flex-1 text-xs py-1.5" onClick={addUrl}>
                    Add
                  </button>
                  <button
                    className="btn-secondary px-2 py-1.5 text-xs"
                    onClick={() => { setAddingUrl(false); setUrlInput(""); }}
                  >
                    <X size={11} />
                  </button>
                </div>
              </div>
            ) : (
              <button
                className="btn-secondary w-full justify-center text-xs py-2"
                onClick={() => setAddingUrl(true)}
              >
                <Link2 size={12} />
                Add URL
              </button>
            )}
          </div>
        </aside>

        {/* Center: Chat */}
        <main className="flex-1 flex flex-col min-w-0">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-16">
                <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center">
                  <Sparkles size={20} className="text-rose-500" />
                </div>
                <p className="text-sm font-medium text-slate-700">Ask anything about your sources</p>
                <p className="text-xs text-slate-400 max-w-xs">
                  RoseRAG will retrieve relevant passages and cite them inline.
                </p>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
              >
                <div
                  className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-xs font-bold ${
                    msg.role === "user"
                      ? "bg-rose-100 text-rose-600"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {msg.role === "user" ? "U" : "AI"}
                </div>

                <div className={`max-w-[72%] ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col gap-1`}>
                  <div
                    className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-rose-600 text-white rounded-tr-sm"
                        : "bg-white border border-slate-200 text-slate-800 rounded-tl-sm"
                    } ${msg.streaming ? "streaming-cursor" : ""}`}
                  >
                    {msg.role === "assistant" ? (
                      <div
                        className="prose-rr"
                        dangerouslySetInnerHTML={{ __html: formatContent(msg.content) }}
                        onClick={(e) => {
                          const target = e.target as HTMLElement;
                          if (target.classList.contains("cite-ref") && msg.citations) {
                            const idx = parseInt(target.textContent ?? "0", 10);
                            const cite = msg.citations.find((c) => c.index === idx);
                            if (cite) setActiveCitations(msg.citations);
                          }
                        }}
                      />
                    ) : (
                      msg.content
                    )}
                  </div>

                  {msg.citations && msg.citations.length > 0 && !msg.streaming && (
                    <button
                      onClick={() =>
                        setActiveCitations(activeCitations === msg.citations ? null : msg.citations ?? null)
                      }
                      className="text-[10px] text-rose-500 hover:text-rose-700 font-medium flex items-center gap-1 transition-colors"
                    >
                      <BookOpen size={10} />
                      {msg.citations.length} citation{msg.citations.length !== 1 ? "s" : ""}
                    </button>
                  )}

                  <span className="text-[10px] text-slate-400">{msg.timestamp}</span>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input bar */}
          <div className="px-6 py-4 border-t border-slate-200 bg-white">
            <div className="flex items-end gap-3">
              <textarea
                ref={textareaRef}
                className="input resize-none min-h-[42px] max-h-32 py-2.5 text-sm flex-1"
                placeholder="Ask about your sources…"
                value={input}
                rows={1}
                onChange={(e) => {
                  setInput(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 128)}px`;
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                disabled={streaming}
              />
              {streaming ? (
                <button
                  onClick={stopStream}
                  className="shrink-0 w-10 h-10 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center transition-colors"
                  title="Stop generation"
                >
                  <StopCircle size={16} />
                </button>
              ) : (
                <button
                  onClick={sendMessage}
                  disabled={!input.trim()}
                  className="shrink-0 w-10 h-10 rounded-lg btn-primary p-0 flex items-center justify-center disabled:opacity-40"
                  title="Send (Enter)"
                >
                  <Send size={15} />
                </button>
              )}
            </div>
            <p className="text-[10px] text-slate-400 mt-1.5">
              Enter to send · Shift+Enter for new line · citations appear inline
            </p>
          </div>
        </main>

        {/* Right: Evidence panel */}
        <aside
          className={`shrink-0 bg-white border-l border-slate-200 transition-all duration-300 overflow-hidden ${
            activeCitations ? "w-72" : "w-0"
          }`}
        >
          {activeCitations && (
            <div className="w-72 flex flex-col h-full">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Evidence</span>
                <button
                  onClick={() => setActiveCitations(null)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X size={15} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {activeCitations.map((cite) => {
                  const src = sources.find((s) => s.id === cite.sourceId);
                  return (
                    <div key={cite.index} className="card p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="cite-ref" style={{ cursor: "default" }}>{cite.index}</span>
                        <span className="text-xs font-medium text-slate-700 truncate flex-1">
                          {src?.name ?? "Unknown source"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed italic border-l-2 border-rose-200 pl-2">
                        &ldquo;{cite.excerpt}&rdquo;
                      </p>
                      {src?.url && (
                        <a
                          href={src.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-rose-500 hover:underline flex items-center gap-1"
                        >
                          <Link2 size={9} />
                          Open source
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function StudioPage() {
  const [notebooks, setNotebooks] = useState<Notebook[]>(SEED_NOTEBOOKS);
  const [activeNotebook, setActiveNotebook] = useState<Notebook | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<NotebookType | "All">("All");

  const filtered = notebooks.filter((nb) => {
    const matchesSearch =
      nb.title.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === "All" || nb.type === filterType;
    return matchesSearch && matchesType;
  });

  function createNotebook(title: string, type: NotebookType) {
    const nb: Notebook = {
      id: uid(),
      title,
      type,
      sources: [],
      messages: [],
      updatedAt: "Just now",
    };
    setNotebooks((prev) => [nb, ...prev]);
    setActiveNotebook(nb);
  }

  function updateNotebook(updated: Notebook) {
    setNotebooks((prev) => prev.map((nb) => (nb.id === updated.id ? updated : nb)));
    setActiveNotebook(updated);
  }

  // Notebook open
  if (activeNotebook) {
    return (
      <ChatView
        notebook={activeNotebook}
        onBack={() => setActiveNotebook(null)}
        onUpdate={updateNotebook}
      />
    );
  }

  // Notebook list view
  return (
    <div className="min-h-screen bg-slate-50">
      {showNewModal && (
        <NewNotebookModal
          onClose={() => setShowNewModal(false)}
          onCreate={createNotebook}
        />
      )}

      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-8 py-5">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <BookOpen size={20} className="text-rose-500" />
              RoseRAG Studio
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              AI-powered research notebooks — chat with your sources
            </p>
          </div>
          <button className="btn-primary" onClick={() => setShowNewModal(true)}>
            <Plus size={15} />
            New Notebook
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-8 py-8">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <input
            className="input sm:max-w-xs"
            placeholder="Search notebooks…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="flex gap-2 flex-wrap">
            {(["All", "Research", "Teaching", "Project", "Personal"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  filterType === t
                    ? "bg-rose-600 text-white border-rose-600"
                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Notebooks", value: notebooks.length, icon: <BookOpen size={16} /> },
            {
              label: "Total Sources",
              value: notebooks.reduce((a, nb) => a + nb.sources.length, 0),
              icon: <Paperclip size={16} />,
            },
            {
              label: "Messages",
              value: notebooks.reduce((a, nb) => a + nb.messages.length, 0),
              icon: <MessageSquare size={16} />,
            },
          ].map((stat) => (
            <div key={stat.label} className="card px-5 py-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-500">
                {stat.icon}
              </div>
              <div>
                <p className="text-xl font-bold text-slate-900">{stat.value}</p>
                <p className="text-xs text-slate-500">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <BookOpen size={24} className="text-slate-400" />
            </div>
            <p className="text-slate-600 font-medium">No notebooks found</p>
            <p className="text-sm text-slate-400 mt-1">
              {search ? "Try a different search term" : "Create your first notebook to get started"}
            </p>
            {!search && (
              <button className="btn-primary mt-4" onClick={() => setShowNewModal(true)}>
                <Plus size={14} />
                New Notebook
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((nb) => (
              <NotebookCard
                key={nb.id}
                notebook={nb}
                onClick={() => setActiveNotebook(nb)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
