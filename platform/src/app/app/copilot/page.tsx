"use client";

import { useState, useRef, useEffect } from "react";
import {
  Bot, GraduationCap, BookOpen, FlaskConical, Library, Building2,
  Send, X, ChevronRight, Sparkles, RotateCcw, Copy, Check,
} from "lucide-react";

// ─── Copilot definitions ─────────────────────────────────────────────────────

interface Copilot {
  id: string;
  name: string;
  emoji: string;
  icon: React.ElementType;
  tagline: string;
  description: string;
  color: string;
  badgeClass: string;
  capabilities: string[];
  systemPrompt: string;
}

const COPILOTS: Copilot[] = [
  {
    id: "dara",
    name: "DARA",
    emoji: "🎓",
    icon: GraduationCap,
    tagline: "Student Assistant",
    description:
      "DARA helps students understand complex academic material in simple, friendly language. Perfect for homework, study guides, and concept clarification.",
    color: "from-blue-50 to-indigo-50 border-blue-200",
    badgeClass: "badge-blue",
    capabilities: [
      "Explains concepts in plain language",
      "Creates study summaries",
      "Generates practice questions",
      "Cites sources for further reading",
      "Adapts to any knowledge level",
    ],
    systemPrompt:
      "You are DARA, a friendly and patient student assistant for the RoseRAG platform. Explain concepts simply and clearly, using analogies and examples. Avoid jargon. Break down complex ideas step by step. Always be encouraging and supportive. Cite sources from the knowledge base when relevant.",
  },
  {
    id: "teacher",
    name: "Teacher",
    emoji: "📚",
    icon: BookOpen,
    tagline: "Educator Copilot",
    description:
      "Assists educators with curriculum design, lesson planning, assessment creation, and pedagogical strategies backed by institutional resources.",
    color: "from-green-50 to-emerald-50 border-green-200",
    badgeClass: "badge-green",
    capabilities: [
      "Lesson plan generation",
      "Assessment & rubric creation",
      "Curriculum alignment support",
      "Differentiated learning strategies",
      "Resource recommendation",
    ],
    systemPrompt:
      "You are an expert Teacher Copilot for the RoseRAG platform. Help educators design effective lessons, create assessments, and find relevant teaching resources. Use evidence-based pedagogical approaches. Reference institutional documents and policies when applicable. Maintain a professional, collegial tone.",
  },
  {
    id: "research",
    name: "Research",
    emoji: "🔬",
    icon: FlaskConical,
    tagline: "Academic Research Assistant",
    description:
      "Provides rigorous academic support with proper citations, literature review assistance, methodology guidance, and statistical interpretation.",
    color: "from-purple-50 to-violet-50 border-purple-200",
    badgeClass: "badge-purple",
    capabilities: [
      "Literature review synthesis",
      "Research methodology guidance",
      "Citation & bibliography support",
      "Statistical analysis interpretation",
      "Grant proposal assistance",
    ],
    systemPrompt:
      "You are a Research Copilot for the RoseRAG platform. Communicate in a formal academic tone. Provide rigorous, well-cited responses drawing on the knowledge base. Help with literature reviews, methodology design, data interpretation, and academic writing. Always distinguish between established findings and emerging research. Suggest further reading.",
  },
  {
    id: "librarian",
    name: "Librarian",
    emoji: "🗂️",
    icon: Library,
    tagline: "Knowledge Discovery Agent",
    description:
      "Helps users navigate the institutional knowledge base, discover relevant documents, manage collections, and find authoritative sources fast.",
    color: "from-amber-50 to-yellow-50 border-amber-200",
    badgeClass: "badge-amber",
    capabilities: [
      "Document discovery & search",
      "Collection organization",
      "Resource classification",
      "Cross-repository search",
      "Authority file navigation",
    ],
    systemPrompt:
      "You are a Librarian Copilot for the RoseRAG platform. Help users find, organize, and access documents in the knowledge base. Provide precise source references, document identifiers, and metadata. Suggest related resources. Use professional library science terminology where appropriate, but explain terms clearly.",
  },
  {
    id: "institutional",
    name: "Institutional",
    emoji: "🏛️",
    icon: Building2,
    tagline: "Policy & Admin Assistant",
    description:
      "Supports institutional decision-making with policy analysis, compliance checking, strategic document synthesis, and administrative guidance.",
    color: "from-rose-50 to-pink-50 border-rose-200",
    badgeClass: "badge-rose",
    capabilities: [
      "Policy analysis & summarization",
      "Regulatory compliance support",
      "Strategic planning assistance",
      "Administrative document drafting",
      "Stakeholder report generation",
    ],
    systemPrompt:
      "You are an Institutional Copilot for the RoseRAG platform. Assist administrators and decision-makers with policy analysis, compliance, and strategic planning. Draw on institutional documents, regulations, and best practices. Communicate with executive clarity—concise, structured, and action-oriented. Flag risks and compliance issues when relevant.",
  },
];

// ─── Chat message type ────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
}

// ─── Chat Interface ───────────────────────────────────────────────────────────

function ChatInterface({ copilot, onClose }: { copilot: Copilot; onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `Hi! I'm the **${copilot.name} Copilot** ${copilot.emoji}. ${copilot.description.split(".")[0]}. How can I help you today?`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");

    const userMsg: Message = { id: `u-${Date.now()}`, role: "user", content: text };
    const assistantId = `a-${Date.now()}`;
    const assistantMsg: Message = { id: assistantId, role: "assistant", content: "", streaming: true };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setLoading(true);

    try {
      const res = await fetch("/api/ask/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: text,
          system_prompt: copilot.systemPrompt,
          copilot_id: copilot.id,
        }),
      });

      if (!res.ok || !res.body) throw new Error("Stream failed");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        // Handle SSE lines
        for (const line of chunk.split("\n")) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6).trim();
            if (data === "[DONE]") break;
            try {
              const parsed = JSON.parse(data);
              const token = parsed.token ?? parsed.text ?? parsed.delta ?? data;
              accumulated += token;
            } catch {
              accumulated += data;
            }
            setMessages((prev) =>
              prev.map((m) => m.id === assistantId ? { ...m, content: accumulated } : m)
            );
          }
        }
      }

      setMessages((prev) =>
        prev.map((m) => m.id === assistantId ? { ...m, streaming: false } : m)
      );
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: "Sorry, I encountered an error. Please try again.", streaming: false }
            : m
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const reset = () => {
    setMessages([{
      id: "welcome",
      role: "assistant",
      content: `Hi! I'm the **${copilot.name} Copilot** ${copilot.emoji}. ${copilot.description.split(".")[0]}. How can I help you today?`,
    }]);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-200 bg-white">
        <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center text-xl">
          {copilot.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-slate-900 text-sm">{copilot.name} Copilot</div>
          <div className="text-xs text-slate-500">{copilot.tagline}</div>
        </div>
        <button onClick={reset} className="btn-secondary text-xs py-1.5 px-3 gap-1.5">
          <RotateCcw className="w-3.5 h-3.5" /> Reset
        </button>
        <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
            {msg.role === "assistant" && (
              <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0 text-base">
                {copilot.emoji}
              </div>
            )}
            <div className={`group relative max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed
              ${msg.role === "user"
                ? "bg-rose-600 text-white rounded-tr-none"
                : "bg-slate-50 text-slate-800 border border-slate-100 rounded-tl-none"
              }`}
            >
              <div className={`prose-rr ${msg.streaming ? "streaming-cursor" : ""}`}
                dangerouslySetInnerHTML={{ __html: msg.content.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\n/g, "<br/>") }}
              />
              {msg.role === "assistant" && !msg.streaming && msg.content && (
                <button
                  onClick={() => handleCopy(msg.id, msg.content)}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 rounded bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700"
                >
                  {copied === msg.id ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                </button>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-slate-200 bg-white">
        <div className="flex gap-2 items-end max-w-4xl mx-auto">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Ask the ${copilot.name} Copilot anything…`}
            rows={1}
            className="input resize-none flex-1 py-2.5 max-h-36 overflow-y-auto"
            style={{ lineHeight: "1.5" }}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="btn-primary py-2.5 px-4 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-center text-xs text-slate-400 mt-2">
          Shift+Enter for new line · Responses are grounded in your institutional knowledge base
        </p>
      </div>
    </div>
  );
}

// ─── Agent Card ───────────────────────────────────────────────────────────────

function AgentCard({ copilot, onLaunch }: { copilot: Copilot; onLaunch: () => void }) {
  return (
    <div className={`card-hover p-5 flex flex-col gap-4 border bg-gradient-to-br ${copilot.color}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="text-3xl">{copilot.emoji}</div>
          <div>
            <h3 className="font-bold text-slate-900">{copilot.name}</h3>
            <span className={`badge ${copilot.badgeClass} mt-0.5`}>{copilot.tagline}</span>
          </div>
        </div>
        <copilot.icon className="w-5 h-5 text-slate-400 flex-shrink-0" />
      </div>

      <p className="text-sm text-slate-600 leading-relaxed">{copilot.description}</p>

      <ul className="space-y-1.5">
        {copilot.capabilities.map((cap) => (
          <li key={cap} className="flex items-center gap-2 text-xs text-slate-600">
            <ChevronRight className="w-3 h-3 text-rose-500 flex-shrink-0" />
            {cap}
          </li>
        ))}
      </ul>

      <button onClick={onLaunch} className="btn-primary w-full justify-center mt-auto">
        <Sparkles className="w-4 h-4" /> Launch {copilot.name}
      </button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CopilotPage() {
  const [activeCopilot, setActiveCopilot] = useState<Copilot | null>(null);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Bot className="w-7 h-7 text-rose-500" />
            AI Copilot System
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Five specialized agents grounded in your institutional knowledge base. Pick one to start.
          </p>
        </div>
        <span className="badge badge-green text-xs">5 Agents Online</span>
      </div>

      {/* Grid of agent cards */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {COPILOTS.map((cp) => (
          <AgentCard key={cp.id} copilot={cp} onLaunch={() => setActiveCopilot(cp)} />
        ))}

        {/* Info card */}
        <div className="card p-5 flex flex-col justify-center items-center text-center gap-3 border-dashed border-2 border-slate-200 bg-slate-50">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-rose-500" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 mb-1">Knowledge-Grounded</h3>
            <p className="text-sm text-slate-500">
              All copilots retrieve answers from your verified institutional documents with citations and trust scores.
            </p>
          </div>
        </div>
      </div>

      {/* Chat overlay */}
      {activeCopilot && (
        <ChatInterface copilot={activeCopilot} onClose={() => setActiveCopilot(null)} />
      )}
    </div>
  );
}
