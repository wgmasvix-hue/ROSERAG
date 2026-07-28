"use client";

import Link from "next/link";
import { useState, useRef } from "react";
import { Search, BookOpen, Brain, Shield, Database, ArrowRight, CheckCircle, Menu, X, ExternalLink, Zap, FileText } from "lucide-react";
import { useRouter } from "next/navigation";

const API_BASE = "https://roserag.dare.co.zw";

// ─── Nav ─────────────────────────────────────────────────────────────────────

function Nav() {
  const [open, setOpen] = useState(false);
  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-[#0a0f1e]/90 backdrop-blur border-b border-white/8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="w-7 h-7 rounded-lg bg-rose-600 flex items-center justify-center text-white text-xs font-black">R</span>
          <span className="font-bold text-white text-sm tracking-tight">RoseRAG</span>
          <span className="hidden sm:block text-white/25 text-xs ml-1">· DARE Intelligence</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm text-white/60">
          <a href="#how" className="hover:text-white transition-colors">How it works</a>
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="https://dspace.dare.co.zw" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-1">
            DARE <ExternalLink className="w-3 h-3 opacity-50" />
          </a>
          <Link href="/app" className="ml-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold px-4 py-1.5 rounded-lg transition-colors text-xs">
            Launch App
          </Link>
        </nav>

        <button className="md:hidden p-1.5 text-white/60 hover:text-white" onClick={() => setOpen(!open)}>
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-[#0a0f1e] border-t border-white/8 px-4 py-3 space-y-1">
          {[
            { label: "How it works", href: "#how" },
            { label: "Features", href: "#features" },
          ].map((l) => (
            <a key={l.label} href={l.href} onClick={() => setOpen(false)}
              className="block py-2.5 text-sm text-white/70 hover:text-white font-medium">
              {l.label}
            </a>
          ))}
          <a href="https://dspace.dare.co.zw" target="_blank" rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className="flex items-center gap-1.5 py-2.5 text-sm text-white/70 hover:text-white font-medium">
            DARE Repository <ExternalLink className="w-3 h-3 opacity-50" />
          </a>
          <div className="pt-2 pb-1">
            <Link href="/app" onClick={() => setOpen(false)}
              className="block text-center bg-rose-600 text-white font-semibold py-2.5 rounded-xl text-sm">
              Launch App
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

// ─── Hero Search ──────────────────────────────────────────────────────────────

const CHIPS = [
  "food security Zimbabwe",
  "climate change Southern Africa",
  "maternal health outcomes",
  "renewable energy rural communities",
];

function HeroSearch() {
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function go(query?: string) {
    const val = (query || q).trim();
    router.push(val ? `/app/search?q=${encodeURIComponent(val)}` : "/app/search");
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={(e) => { e.preventDefault(); go(); }} className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Ask anything about the DARE repository…"
          className="w-full bg-white/8 hover:bg-white/10 focus:bg-white/10 border border-white/12 focus:border-rose-500/60 rounded-2xl pl-11 pr-28 py-4 text-white placeholder:text-white/30 text-sm focus:outline-none transition-all"
        />
        <button type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs px-4 py-2 rounded-xl transition-colors">
          Search
        </button>
      </form>

      <div className="flex flex-wrap gap-2 mt-3 justify-center">
        {CHIPS.map((c) => (
          <button key={c} type="button"
            onClick={() => { setQ(c); go(c); }}
            className="text-xs bg-white/6 hover:bg-white/12 border border-white/8 hover:border-white/20 text-white/50 hover:text-white/80 px-3 py-1.5 rounded-full transition-all">
            {c}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Page() {
  return (
    <div className="bg-[#0a0f1e] min-h-screen text-white">
      <Nav />

      {/* ── Hero ── */}
      <section className="min-h-screen flex flex-col items-center justify-center px-4 pt-14 pb-16 text-center">
        {/* Ambient glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-rose-600/10 rounded-full blur-[100px]" />
        </div>

        <div className="relative z-10 w-full max-w-3xl mx-auto flex flex-col items-center gap-6">
          {/* Pill */}
          <div className="inline-flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 text-rose-300 px-3.5 py-1.5 rounded-full text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
            Live · Connected to dspace.dare.co.zw
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.08] tracking-tight">
            Ask anything about
            <br />
            <span className="text-rose-400">DARE Research</span>
          </h1>

          <p className="text-base sm:text-lg text-white/50 max-w-xl leading-relaxed">
            AI-powered search across the DARE institutional repository.
            Get cited answers, not links.
          </p>

          {/* Search */}
          <div className="w-full mt-2">
            <HeroSearch />
          </div>

          {/* Trust signals */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-white/35 mt-2">
            {[
              { icon: Shield, text: "Grounded in DARE sources" },
              { icon: CheckCircle, text: "Cited answers only" },
              { icon: Zap, text: "No login required" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-1.5">
                <Icon className="w-3.5 h-3.5 text-white/25" />
                {text}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section className="border-y border-white/6 bg-white/3 py-6">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {[
            { value: "DSpace 8.1", label: "Repository Engine" },
            { value: "REST API", label: "Live Connected" },
            { value: "Open Access", label: "No login required" },
            { value: "AI-Powered", label: "qwen2.5 · nomic-embed" },
          ].map((s) => (
            <div key={s.value}>
              <div className="text-white font-bold text-sm sm:text-base">{s.value}</div>
              <div className="text-white/35 text-xs mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how" className="py-20 sm:py-28 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-block text-xs font-semibold text-rose-400 uppercase tracking-widest mb-4">How it works</div>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">DARE, supercharged by AI</h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                n: "01",
                icon: Database,
                title: "Connected to DARE",
                desc: "Directly linked to dspace.dare.co.zw via DSpace 8.1 REST API. Every item, collection, and document is accessible.",
              },
              {
                n: "02",
                icon: Brain,
                title: "AI understands it",
                desc: "Documents are embedded into a vector knowledge base. The AI reasons across thousands of papers simultaneously.",
              },
              {
                n: "03",
                icon: FileText,
                title: "Cited answers",
                desc: "Ask in plain language. Get answers grounded in DARE sources with citations and confidence scores — no hallucinations.",
              },
            ].map((s) => (
              <div key={s.n} className="bg-white/4 hover:bg-white/6 border border-white/8 rounded-2xl p-6 transition-colors">
                <div className="flex items-start gap-3 mb-4">
                  <span className="text-3xl font-black text-white/8 leading-none tabular-nums">{s.n}</span>
                  <div className="w-9 h-9 rounded-xl bg-rose-600/15 border border-rose-500/20 flex items-center justify-center flex-shrink-0">
                    <s.icon className="w-4.5 h-4.5 text-rose-400 w-[18px] h-[18px]" />
                  </div>
                </div>
                <h3 className="font-semibold text-white mb-2 text-sm">{s.title}</h3>
                <p className="text-sm text-white/45 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-20 sm:py-28 px-4 sm:px-6 border-t border-white/6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-block text-xs font-semibold text-rose-400 uppercase tracking-widest mb-4">Platform</div>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">Everything you need</h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {[
              {
                icon: Search,
                title: "Hybrid AI Search",
                desc: "Keyword + semantic + metadata fusion across the entire DARE repository. Ask questions, get evidence-backed answers.",
                tag: "Core",
                href: "/app/search",
              },
              {
                icon: BookOpen,
                title: "Research Notebooks",
                desc: "Collect DARE sources into AI-powered notebooks. Annotate, question, and synthesise across multiple documents.",
                tag: "Notebooks",
                href: "/app/notebook",
              },
              {
                icon: Brain,
                title: "AI Copilot",
                desc: "Multi-agent AI assistants for researchers, students, and librarians. Literature reviews in seconds.",
                tag: "Copilot",
                href: "/app/copilot",
              },
              {
                icon: Shield,
                title: "Trusted Answers Only",
                desc: "Every answer is grounded in DARE sources with inline citations and full audit trails. No internet scraping.",
                tag: "Trust",
                href: "/app/search",
              },
            ].map((f) => (
              <Link key={f.title} href={f.href}
                className="group bg-white/4 hover:bg-white/6 border border-white/8 hover:border-rose-500/30 rounded-2xl p-6 transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-9 h-9 rounded-xl bg-white/6 group-hover:bg-rose-600/15 border border-white/8 group-hover:border-rose-500/20 flex items-center justify-center transition-all">
                    <f.icon className="w-[18px] h-[18px] text-white/50 group-hover:text-rose-400 transition-colors" />
                  </div>
                  <span className="text-[10px] font-semibold text-white/25 uppercase tracking-widest">{f.tag}</span>
                </div>
                <h3 className="font-semibold text-white mb-2 text-sm">{f.title}</h3>
                <p className="text-sm text-white/45 leading-relaxed">{f.desc}</p>
                <div className="flex items-center gap-1 text-rose-400 text-xs font-medium mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  Open <ArrowRight className="w-3 h-3" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 sm:py-24 px-4 sm:px-6 border-t border-white/6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-4">
            Start searching DARE with AI
          </h2>
          <p className="text-white/45 mb-8 leading-relaxed">
            Ask a question about the DARE institutional repository and get a cited,
            evidence-based answer in seconds. No account needed.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/app/search"
              className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white font-bold px-6 py-3 rounded-xl text-sm transition-colors">
              <Search className="w-4 h-4" />
              Search DARE
            </Link>
            <a href="https://dspace.dare.co.zw" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white/6 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white font-medium px-6 py-3 rounded-xl text-sm transition-all">
              Visit DARE Repository
              <ExternalLink className="w-3.5 h-3.5 opacity-50" />
            </a>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/6 py-8 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/30">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded bg-rose-600 flex items-center justify-center text-white text-[10px] font-black">R</span>
            <span>RoseRAG · ChengetAI Labs · {new Date().getFullYear()}</span>
          </div>
          <div className="flex items-center gap-5">
            <Link href="/app" className="hover:text-white transition-colors">Platform</Link>
            <Link href="/download" className="hover:text-white transition-colors">Android App</Link>
            <a href="https://dspace.dare.co.zw" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-1">
              DARE Repository <ExternalLink className="w-3 h-3 opacity-40" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
