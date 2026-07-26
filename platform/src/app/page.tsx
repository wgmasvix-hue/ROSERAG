"use client";

import Link from "next/link";
import { useState, useRef } from "react";
import {
  Search, BookOpen, GitBranch, Mic, Shield, BarChart3,
  ArrowRight, CheckCircle, Star, Brain, Menu, X,
  Smartphone, Download, Database, Zap, Globe, ExternalLink,
  FileText, Users, Building2,
} from "lucide-react";
import { useRouter } from "next/navigation";

// ─── Data ──────────────────────────────────────────────────────────────────

const NAV_LINKS = [
  { label: "Search", href: "#search" },
  { label: "Features", href: "#features" },
  { label: "For Researchers", href: "#solutions" },
  { label: "DARE Repository", href: "https://dspace.dare.co.zw", external: true },
  { label: "About", href: "#about" },
];

const FEATURES = [
  {
    icon: Search,
    title: "Hybrid AI Search",
    desc: "Ask questions in plain language. RoseRAG searches across the entire DARE repository using keyword, semantic, and metadata fusion — returning cited, evidence-backed answers.",
    color: "bg-rose-50 text-rose-600",
  },
  {
    icon: Brain,
    title: "AI Copilot",
    desc: "Multi-agent AI assistants trained on DARE content for researchers, students, librarians, and institutional leaders. Get answers, summaries, and literature reviews in seconds.",
    color: "bg-blue-50 text-blue-600",
  },
  {
    icon: GitBranch,
    title: "Knowledge Graph",
    desc: "Automatically maps entities, citations, and relationships across DARE documents — revealing hidden connections between research papers, authors, and themes.",
    color: "bg-purple-50 text-purple-600",
  },
  {
    icon: BookOpen,
    title: "Research Notebooks",
    desc: "Collect sources from the DARE repository into AI-powered notebooks. Annotate, question, and synthesise across multiple documents in a single workspace.",
    color: "bg-amber-50 text-amber-600",
  },
  {
    icon: Mic,
    title: "Audio Summaries",
    desc: "Transform DARE research papers into podcast-style audio briefings and accessible summaries in multiple languages.",
    color: "bg-green-50 text-green-600",
  },
  {
    icon: Shield,
    title: "Trusted Answers",
    desc: "Every answer is grounded in DARE sources with inline citations, confidence scores, and full audit trails. No hallucinations.",
    color: "bg-orange-50 text-orange-600",
  },
];

const PERSONAS = [
  {
    id: "researcher",
    title: "Researchers",
    badge: "Research AI",
    desc: "Accelerate literature reviews, identify research gaps, and generate citation-backed syntheses from the DARE repository in minutes, not days.",
    features: ["Literature Reviews", "Gap Analysis", "Citation Engine", "Methodology AI"],
    color: "from-blue-600 to-blue-800",
    bgColor: "bg-blue-600",
    emoji: "🔬",
  },
  {
    id: "student",
    title: "Students",
    badge: "Study AI",
    desc: "Get AI-powered explanations, summaries, and study guides grounded in trusted DARE sources — not the open internet.",
    features: ["Smart Summaries", "Concept Explainer", "Quiz Builder", "Citation Finder"],
    color: "from-rose-600 to-rose-800",
    bgColor: "bg-rose-600",
    emoji: "🎓",
  },
  {
    id: "library",
    title: "Librarians",
    badge: "Library AI",
    desc: "Modernise library operations with AI-powered cataloguing, metadata enrichment, and intelligent DSpace integration.",
    features: ["Auto Cataloguing", "Metadata AI", "DSpace Sync", "Collection Insights"],
    color: "from-purple-600 to-purple-800",
    bgColor: "bg-purple-600",
    emoji: "📚",
  },
  {
    id: "institution",
    title: "Institutions",
    badge: "Enterprise",
    desc: "Multi-tenant platform with RBAC, SSO, audit logs, and institutional analytics — deploy RoseRAG as your institution's AI research portal.",
    features: ["Multi-tenancy", "SAML SSO", "Audit Logs", "Data Governance"],
    color: "from-slate-700 to-slate-900",
    bgColor: "bg-slate-700",
    emoji: "🏛️",
  },
];

const DARE_STATS = [
  { icon: FileText, value: "DARE Repository", sub: "dspace.dare.co.zw" },
  { icon: Database, value: "DSpace 8.1", sub: "Public access · REST API" },
  { icon: Zap, value: "AI-Powered", sub: "DeepSeek + Jina AI" },
  { icon: Globe, value: "Open Access", sub: "No login required" },
];

// ─── Hero Search Bar ─────────────────────────────────────────────────────────

function HeroSearch() {
  const [query, setQuery] = useState("");
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (q) {
      router.push(`/app/search?q=${encodeURIComponent(q)}`);
    } else {
      router.push("/app/search");
    }
  }

  return (
    <form onSubmit={handleSearch} className="w-full max-w-2xl">
      <div className="flex items-center bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-1.5 gap-2 focus-within:border-rose-400/60 transition-colors shadow-lg">
        <Search className="w-5 h-5 text-white/40 ml-3 flex-shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask anything about the DARE repository…"
          className="flex-1 bg-transparent text-white placeholder:text-white/40 text-sm focus:outline-none py-2"
        />
        <button
          type="submit"
          className="bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors flex-shrink-0"
        >
          Search
        </button>
      </div>
      <div className="flex flex-wrap gap-2 mt-3">
        {[
          "food security Zimbabwe",
          "climate change Southern Africa",
          "AI in education",
          "public health interventions",
        ].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => { setQuery(s); inputRef.current?.focus(); }}
            className="text-xs bg-white/10 hover:bg-white/20 text-white/70 hover:text-white border border-white/10 px-3 py-1.5 rounded-full transition-colors"
          >
            {s}
          </button>
        ))}
      </div>
    </form>
  );
}

// ─── Dashboard Preview ──────────────────────────────────────────────────────

function DashboardPreview() {
  return (
    <div className="relative w-full max-w-lg mx-auto">
      <div className="absolute inset-0 bg-rose-500/20 blur-3xl rounded-full scale-75" />
      <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-5 shadow-2xl">
        {/* Window chrome */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex gap-1.5">
            {["bg-red-400", "bg-yellow-400", "bg-green-400"].map((c) => (
              <div key={c} className={`w-2.5 h-2.5 rounded-full ${c}`} />
            ))}
          </div>
          <div className="flex-1 h-5 bg-white/10 rounded-md mx-2 flex items-center px-2">
            <span className="text-white/30 text-[9px]">roserag.dare.co.zw/app/search</span>
          </div>
        </div>

        {/* Source badge */}
        <div className="flex items-center gap-2 bg-amber-500/15 border border-amber-500/20 rounded-lg px-3 py-1.5 mb-3">
          <Database className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-amber-300 text-xs font-medium">Searching: DARE Repository — dspace.dare.co.zw</span>
        </div>

        {/* Query + answer */}
        <div className="bg-white/5 rounded-lg p-3 mb-3 space-y-3">
          <div className="flex gap-2">
            <div className="w-6 h-6 rounded-full bg-rose-500 flex-shrink-0" />
            <div className="bg-white/10 rounded-lg p-2 text-white/80 text-xs flex-1">
              What are the key findings on food security in Zimbabwe?
            </div>
          </div>
          <div className="flex gap-2">
            <div className="w-6 h-6 rounded-full bg-blue-500 flex-shrink-0" />
            <div className="bg-white/15 rounded-lg p-2 flex-1">
              <div className="text-white text-xs mb-2 leading-relaxed">
                Based on <span className="text-rose-300 font-medium">[1]</span> the FAO Assessment 2024 and{" "}
                <span className="text-rose-300 font-medium">[2]</span> ZIMSTAT Agricultural Survey in DARE…
              </div>
              <div className="flex gap-1 flex-wrap">
                {["DARE: FAO Report", "DARE: ZIMSTAT", "DARE: WFP Assessment"].map((t) => (
                  <span key={t} className="bg-rose-500/30 text-rose-200 px-1.5 py-0.5 rounded text-[9px]">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Confidence */}
        <div className="bg-white/5 rounded-lg p-2.5">
          <div className="flex justify-between text-[10px] text-white/60 mb-1.5">
            <span>Confidence Score — DARE sources</span>
            <span className="text-green-400 font-medium">94.2%</span>
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full" style={{ width: "94%" }} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activePersona, setActivePersona] = useState(0);
  const persona = PERSONAS[activePersona];

  return (
    <div className="min-h-screen bg-white">

      {/* ── Navigation ──────────────────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex items-center gap-1 font-black text-xl">
              <span className="text-rose-600">Chenget</span>
              <span className="text-slate-800">AI</span>
            </div>
            <span className="hidden sm:block text-[10px] font-semibold text-slate-400 uppercase tracking-widest border-l border-slate-200 pl-2 ml-1">
              Labs
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map((l) =>
              l.external ? (
                <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer"
                  className="text-sm text-slate-600 hover:text-rose-600 font-medium transition-colors flex items-center gap-1">
                  {l.label}
                  <ExternalLink className="w-3 h-3 opacity-50" />
                </a>
              ) : (
                <Link key={l.label} href={l.href}
                  className="text-sm text-slate-600 hover:text-slate-900 font-medium transition-colors">
                  {l.label}
                </Link>
              )
            )}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <a href="https://dspace.dare.co.zw" target="_blank" rel="noopener noreferrer"
              className="text-xs text-slate-500 hover:text-rose-600 font-medium flex items-center gap-1 transition-colors border border-slate-200 px-3 py-1.5 rounded-lg hover:border-rose-200">
              <Database className="w-3.5 h-3.5" />
              DARE Repository
            </a>
            <Link href="/app" className="bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
              Launch Platform
            </Link>
          </div>

          <button className="md:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden bg-white border-t border-slate-200 px-6 py-4">
            {NAV_LINKS.map((l) =>
              l.external ? (
                <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 py-2.5 text-sm text-slate-700 font-medium">
                  {l.label} <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              ) : (
                <Link key={l.label} href={l.href} className="block py-2.5 text-sm text-slate-700 font-medium">
                  {l.label}
                </Link>
              )
            )}
            <div className="flex gap-3 pt-3 border-t border-slate-100 mt-2">
              <Link href="/app" className="flex-1 text-center bg-rose-600 text-white text-sm font-semibold py-2.5 rounded-lg">
                Launch Platform
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ── Hero ──────────────────────────────────────────────────────────────── */}
      <section id="search">
        <div className="min-h-screen flex items-center pt-16"
          style={{ background: "linear-gradient(135deg,#0f172a 0%,#1e293b 45%,#1a0a10 100%)" }}>
          <div className="max-w-7xl mx-auto px-6 py-24 w-full">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                {/* Eyebrow */}
                <div className="inline-flex items-center gap-2 bg-rose-500/15 border border-rose-500/25 text-rose-300 px-3.5 py-1.5 rounded-full text-xs font-semibold mb-6">
                  <Database className="w-3.5 h-3.5" />
                  AI Discovery Layer for DARE · dspace.dare.co.zw
                </div>

                <h1 className="text-5xl lg:text-6xl font-black text-white leading-[1.05] mb-5">
                  <span className="text-rose-400">ChengetAI</span>{" "}
                  Labs
                  <br />
                  <span className="text-3xl lg:text-4xl text-white/60 font-bold">
                    Research Intelligence
                    <br />
                    Platform
                  </span>
                </h1>

                <p className="text-base text-slate-300 leading-relaxed mb-8 max-w-lg">
                  The AI layer that sits on top of the DARE Institutional Repository.
                  Ask questions, get cited answers, build research notebooks — all powered
                  by <a href="https://dspace.dare.co.zw" target="_blank" rel="noopener noreferrer"
                    className="text-rose-300 hover:text-rose-200 underline underline-offset-2">
                    dspace.dare.co.zw
                  </a> content.
                </p>

                {/* Search bar */}
                <HeroSearch />

                <div className="flex flex-wrap gap-5 mt-8">
                  {["Grounded in DARE sources", "Cited answers only", "Open access"].map((t) => (
                    <div key={t} className="flex items-center gap-1.5 text-sm text-slate-400">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      {t}
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-3 mt-6">
                  <Link href="/app/notebook"
                    className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 border border-white/15 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors">
                    <BookOpen className="w-4 h-4" />
                    Open Notebook
                  </Link>
                  <a href="https://dspace.dare.co.zw" target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm font-medium px-4 py-2.5 transition-colors">
                    Browse DARE directly
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              <div className="hidden lg:block">
                <DashboardPreview />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── DARE Repository Banner ──────────────────────────────────────────── */}
      <section className="py-8 bg-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                <Database className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <div className="text-white font-bold text-sm">DARE Institutional Repository</div>
                <div className="text-slate-400 text-xs">
                  dspace.dare.co.zw · DSpace 8.1 · Public Access · REST API Connected
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-6 text-center">
              {DARE_STATS.map((s) => (
                <div key={s.value} className="flex items-center gap-2">
                  <s.icon className="w-4 h-4 text-rose-400 flex-shrink-0" />
                  <div>
                    <div className="text-white text-sm font-semibold">{s.value}</div>
                    <div className="text-slate-500 text-[11px]">{s.sub}</div>
                  </div>
                </div>
              ))}
            </div>
            <a href="https://dspace.dare.co.zw" target="_blank" rel="noopener noreferrer"
              className="flex-shrink-0 flex items-center gap-1.5 text-sm text-amber-400 hover:text-amber-300 border border-amber-500/25 hover:border-amber-500/50 px-4 py-2 rounded-lg transition-colors">
              Visit Repository <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────────────────────── */}
      <section className="py-16 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="inline-block bg-rose-100 text-rose-700 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4">
              How It Works
            </span>
            <h2 className="text-3xl font-black text-slate-900 mb-3">
              DARE Repository, Supercharged
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto">
              ChengetAI Labs sits on top of the DARE DSpace repository and adds a layer of AI intelligence — without replacing the underlying repository.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                step: "01",
                icon: Database,
                title: "Connected to DARE",
                desc: "RoseRAG is live-connected to dspace.dare.co.zw via the DSpace 8.1 REST API. Every item, collection, and bitstream is accessible to the AI layer.",
                color: "text-amber-600 bg-amber-50",
              },
              {
                step: "02",
                icon: Brain,
                title: "AI Understands It",
                desc: "Documents are chunked, embedded, and indexed into a vector knowledge base. The AI can reason across thousands of papers simultaneously.",
                color: "text-rose-600 bg-rose-50",
              },
              {
                step: "03",
                icon: CheckCircle,
                title: "You Get Cited Answers",
                desc: "Ask questions in plain language and get answers grounded in DARE sources — with citations, confidence scores, and links back to the original item.",
                color: "text-green-600 bg-green-50",
              },
            ].map((s) => (
              <div key={s.step} className="bg-white rounded-2xl border border-slate-200 p-6 hover:border-rose-200 hover:shadow-md transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl font-black text-slate-100">{s.step}</span>
                  <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center`}>
                    <s.icon className="w-5 h-5" />
                  </div>
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{s.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────────────── */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-block bg-rose-100 text-rose-700 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4">
              Platform Features
            </span>
            <h2 className="text-4xl font-black text-slate-900 mb-4">
              Everything Researchers Need
            </h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              ChengetAI Labs is the AI layer that transforms the DARE repository into an evidence-first research intelligence platform.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="group border border-slate-200 rounded-2xl p-6 hover:border-rose-200 hover:shadow-lg transition-all">
                <div className={`w-11 h-11 rounded-xl ${f.color} flex items-center justify-center mb-4`}>
                  <f.icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
                <div className="mt-4 flex items-center gap-1 text-rose-600 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  Try it <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Solutions / Personas ─────────────────────────────────────────────── */}
      <section id="solutions" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-block bg-purple-100 text-purple-700 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4">
              Built For Every Role
            </span>
            <h2 className="text-4xl font-black text-slate-900 mb-4">
              Purpose-Built for DARE Users
            </h2>
            <p className="text-lg text-slate-500 max-w-xl mx-auto">
              AI copilots for every person in your institution who works with the DARE repository
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-10 items-start">
            <div className="grid gap-3">
              {PERSONAS.map((p, i) => (
                <button key={p.id} onClick={() => setActivePersona(i)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                    i === activePersona
                      ? "border-rose-500 bg-rose-50 shadow-lg"
                      : "border-slate-200 bg-white hover:border-rose-200"
                  }`}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-10 h-10 rounded-xl ${p.bgColor} flex items-center justify-center text-xl`}>
                      {p.emoji}
                    </div>
                    <div>
                      <div className={`inline-block text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full mb-1 ${
                        i === activePersona ? "bg-rose-100 text-rose-700" : "bg-blue-100 text-blue-700"
                      }`}>{p.badge}</div>
                      <div className="font-semibold text-slate-900 text-sm">{p.title}</div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">{p.desc}</p>
                </button>
              ))}
            </div>

            <div className={`rounded-2xl p-8 bg-gradient-to-br ${persona.color} text-white`}>
              <div className="text-4xl mb-5">{persona.emoji}</div>
              <div className="inline-block bg-white/20 text-white text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded-full mb-4">
                {persona.badge}
              </div>
              <h3 className="text-2xl font-black mb-3">{persona.title}</h3>
              <p className="text-white/80 mb-6 leading-relaxed">{persona.desc}</p>
              <div className="space-y-3 mb-8">
                {persona.features.map((f) => (
                  <div key={f} className="flex items-center gap-3">
                    <CheckCircle className="w-4 h-4 text-white/70 flex-shrink-0" />
                    <span className="text-sm font-medium">{f}</span>
                  </div>
                ))}
              </div>
              <Link href="/app"
                className="inline-flex items-center gap-2 bg-white text-rose-700 font-bold px-5 py-2.5 rounded-lg text-sm hover:bg-white/90 transition-colors">
                Get Started <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── About ChengetAI Labs ─────────────────────────────────────────────── */}
      <section id="about" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="inline-block bg-rose-100 text-rose-700 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-6">
                About
              </span>
              <h2 className="text-4xl font-black text-slate-900 mb-6">
                ChengetAI Labs
              </h2>
              <p className="text-lg text-slate-600 leading-relaxed mb-6">
                ChengetAI Labs builds AI-powered research intelligence tools for institutions across Africa and beyond.
                Our flagship product, RoseRAG, is an open-source Knowledge Operating System that connects to institutional
                repositories and transforms raw documents into actionable, cited intelligence.
              </p>
              <p className="text-slate-500 leading-relaxed mb-8">
                This platform is powered by the{" "}
                <a href="https://dspace.dare.co.zw" target="_blank" rel="noopener noreferrer"
                  className="text-rose-600 hover:text-rose-700 font-medium underline underline-offset-2">
                  DARE Institutional Repository
                </a>{" "}
                (dspace.dare.co.zw), running DSpace 8.1. All answers are grounded in DARE content — no hallucinations, no internet scraping.
              </p>
              <div className="grid grid-cols-3 gap-6 mb-8">
                {[
                  { icon: Database, label: "DARE Repository", sub: "Live Connected" },
                  { icon: Users, label: "Researchers", sub: "First Focus" },
                  { icon: Building2, label: "Institutional", sub: "Grade Platform" },
                ].map((s) => (
                  <div key={s.label} className="text-center">
                    <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center mx-auto mb-2">
                      <s.icon className="w-5 h-5 text-rose-600" />
                    </div>
                    <div className="text-slate-900 font-bold text-sm">{s.label}</div>
                    <div className="text-slate-400 text-xs">{s.sub}</div>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-3">
                <Link href="/app"
                  className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors">
                  Launch Platform <ArrowRight className="w-4 h-4" />
                </Link>
                <a href="https://dspace.dare.co.zw" target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 border border-slate-200 hover:border-rose-200 text-slate-600 hover:text-rose-600 font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors">
                  Visit DARE Repository <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Diagram */}
            <div className="relative">
              <div className="bg-slate-900 rounded-2xl p-8">
                {/* Top: DARE */}
                <div className="flex flex-col items-center gap-3">
                  <div className="w-full bg-amber-500/15 border border-amber-500/30 rounded-xl p-4 text-center">
                    <Database className="w-6 h-6 text-amber-400 mx-auto mb-2" />
                    <div className="text-white font-bold text-sm">DARE Institutional Repository</div>
                    <div className="text-amber-400/70 text-xs">dspace.dare.co.zw · DSpace 8.1</div>
                    <div className="flex flex-wrap justify-center gap-1.5 mt-2">
                      {["Theses", "Reports", "Journals", "Books"].map((t) => (
                        <span key={t} className="bg-amber-500/20 text-amber-300 text-[10px] px-2 py-0.5 rounded">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="flex flex-col items-center">
                    <div className="w-px h-8 bg-gradient-to-b from-amber-500/50 to-rose-500/50" />
                    <div className="text-slate-500 text-[10px] bg-slate-800 px-2 py-1 rounded border border-slate-700">
                      REST API · DSpace 8.1
                    </div>
                    <div className="w-px h-8 bg-gradient-to-b from-rose-500/50 to-rose-600/50" />
                  </div>

                  {/* ChengetAI Layer */}
                  <div className="w-full bg-rose-600/20 border-2 border-rose-500/50 rounded-xl p-4 text-center">
                    <div className="font-black text-white text-lg mb-1">
                      <span className="text-rose-400">Chenget</span>AI Labs
                    </div>
                    <div className="text-rose-300/80 text-xs mb-3">AI Intelligence Layer · roserag.dare.co.zw</div>
                    <div className="flex flex-wrap justify-center gap-1.5">
                      {["AI Search", "Notebooks", "Copilot", "Knowledge Graph"].map((t) => (
                        <span key={t} className="bg-rose-500/30 text-rose-200 text-[10px] px-2 py-0.5 rounded">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Arrow down */}
                  <div className="flex flex-col items-center">
                    <div className="w-px h-6 bg-rose-500/50" />
                  </div>

                  {/* Users */}
                  <div className="w-full bg-white/5 border border-white/10 rounded-xl p-3 flex justify-around">
                    {[
                      { emoji: "🔬", label: "Researchers" },
                      { emoji: "🎓", label: "Students" },
                      { emoji: "📚", label: "Librarians" },
                      { emoji: "🏛️", label: "Institutions" },
                    ].map((u) => (
                      <div key={u.label} className="text-center">
                        <div className="text-xl mb-1">{u.emoji}</div>
                        <div className="text-slate-400 text-[10px]">{u.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────────── */}
      <section className="py-20 bg-gradient-to-br from-rose-600 to-rose-800">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-black text-white mb-4 leading-tight">
            Start Searching DARE with AI
          </h2>
          <p className="text-lg text-rose-100 mb-8 max-w-xl mx-auto">
            Ask a question about the DARE institutional repository and get a cited, evidence-based answer in seconds.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/app/search"
              className="inline-flex items-center gap-2 bg-white text-rose-700 font-bold px-7 py-3.5 rounded-xl text-sm hover:bg-rose-50 transition-colors shadow-lg">
              <Search className="w-4 h-4" />
              Search DARE Now
            </Link>
            <Link href="/app/notebook"
              className="inline-flex items-center gap-2 bg-rose-700/60 hover:bg-rose-700 border border-white/20 text-white font-semibold px-7 py-3.5 rounded-xl text-sm transition-colors">
              <BookOpen className="w-4 h-4" />
              Open a Notebook
            </Link>
          </div>
          <p className="text-rose-200/60 text-xs mt-6">
            Powered by DARE Repository · dspace.dare.co.zw · No login required
          </p>
        </div>
      </section>

      {/* ── Mobile App ──────────────────────────────────────────────────────── */}
      <section id="mobile" className="py-20 bg-slate-950 text-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-14 items-center">
            <div>
              <span className="inline-flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 px-3.5 py-1.5 rounded-full text-xs font-semibold mb-6">
                <Smartphone className="w-3.5 h-3.5" />
                Now on Android
              </span>
              <h2 className="text-4xl font-black mb-6 leading-tight">
                DARE in Your <span className="text-rose-400">Pocket</span>
              </h2>
              <p className="text-slate-300 leading-relaxed mb-8">
                Search the DARE institutional repository, get AI answers, and read your research notebooks anywhere — even offline.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  "AI-powered search across all DARE content",
                  "Offline-capable with cached responses",
                  "Import DARE items directly into notebooks",
                  "Dark mode and adaptive UI",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-slate-300 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-3">
                <Link href="/download"
                  className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white font-bold px-6 py-3 rounded-xl transition-colors">
                  <Download className="w-5 h-5" />
                  Download APK
                </Link>
                <Link href="/download"
                  className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white font-medium px-6 py-3 rounded-xl transition-colors border border-white/10">
                  <Smartphone className="w-4 h-4" />
                  Install Guide
                </Link>
              </div>
              <p className="text-slate-500 text-xs mt-3">Android 7.0+ · Free download · ~15 MB</p>
            </div>

            <div className="flex justify-center lg:justify-end">
              <div className="relative">
                <div className="absolute inset-0 bg-rose-600/20 blur-3xl rounded-full scale-75" />
                <div className="relative w-64 bg-slate-900 rounded-[2.5rem] border-4 border-slate-700 shadow-2xl overflow-hidden">
                  <div className="bg-slate-950 px-4 py-2 flex justify-between text-[10px] text-slate-500">
                    <span>9:41</span><span>●●●</span>
                  </div>
                  <div className="bg-slate-900 px-4 py-3 border-b border-slate-800 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-rose-600 flex items-center justify-center">
                      <span className="text-white text-[10px] font-black">C</span>
                    </div>
                    <span className="text-white text-sm font-semibold">ChengetAI Labs</span>
                  </div>
                  <div className="px-3 py-3">
                    <div className="flex items-center gap-1.5 bg-amber-500/15 border border-amber-500/20 rounded-lg px-2.5 py-1.5 mb-2">
                      <Database className="w-3 h-3 text-amber-400" />
                      <span className="text-amber-300/80 text-[10px]">DARE Repository</span>
                    </div>
                    <div className="bg-slate-800 rounded-xl px-3 py-2 flex items-center gap-2">
                      <Search className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-slate-500 text-xs">Ask about DARE…</span>
                    </div>
                  </div>
                  <div className="px-3 pb-3 space-y-2.5">
                    <div className="flex gap-2">
                      <div className="w-5 h-5 rounded-full bg-rose-600 shrink-0 mt-0.5" />
                      <div className="bg-slate-800 rounded-xl rounded-tl-sm px-3 py-2 flex-1">
                        <p className="text-slate-300 text-[11px] leading-relaxed">Food security findings in Zimbabwe?</p>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-row-reverse">
                      <div className="w-5 h-5 rounded-full bg-blue-600 shrink-0 mt-0.5" />
                      <div className="bg-rose-950 border border-rose-900 rounded-xl rounded-tr-sm px-3 py-2 flex-1">
                        <p className="text-slate-200 text-[11px] leading-relaxed">
                          Based on <span className="text-rose-300">[DARE:1]</span> FAO 2024…
                        </p>
                        <div className="flex gap-1 mt-1.5">
                          {["DARE", "FAO", "WFP"].map((t) => (
                            <span key={t} className="bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded text-[9px]">{t}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-slate-950 flex justify-center py-2">
                    <div className="w-16 h-1 bg-slate-600 rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-10">
            <div>
              <div className="font-black text-xl text-white mb-1">
                <span className="text-rose-400">Chenget</span>AI Labs
              </div>
              <div className="text-xs text-slate-500 mb-3">Powered by RoseRAG</div>
              <p className="text-sm leading-relaxed">
                AI-powered research intelligence for the DARE Institutional Repository.
              </p>
            </div>
            {[
              {
                title: "Platform",
                links: [
                  { label: "AI Search", href: "/app/search" },
                  { label: "Notebooks", href: "/app/notebook" },
                  { label: "AI Copilot", href: "/app/copilot" },
                  { label: "Dashboard", href: "/app/dashboard" },
                ],
              },
              {
                title: "Repository",
                links: [
                  { label: "DARE Repository", href: "https://dspace.dare.co.zw" },
                  { label: "Browse Collections", href: "https://dspace.dare.co.zw/collections" },
                  { label: "REST API", href: "https://dspace.dare.co.zw/server/api" },
                ],
              },
              {
                title: "Downloads",
                links: [
                  { label: "Android App", href: "/download" },
                  { label: "Install Guide", href: "/download" },
                ],
              },
            ].map((col) => (
              <div key={col.title}>
                <div className="text-white font-semibold text-sm mb-3">{col.title}</div>
                <ul className="space-y-2">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      {l.href.startsWith("http") ? (
                        <a href={l.href} target="_blank" rel="noopener noreferrer"
                          className="text-sm hover:text-white transition-colors flex items-center gap-1">
                          {l.label} <ExternalLink className="w-2.5 h-2.5 opacity-40" />
                        </a>
                      ) : (
                        <Link href={l.href} className="text-sm hover:text-white transition-colors">{l.label}</Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-slate-800 pt-6 flex flex-col md:flex-row justify-between gap-3 text-xs">
            <span>© 2025 ChengetAI Labs · Powered by RoseRAG</span>
            <div className="flex items-center gap-4">
              <a href="https://dspace.dare.co.zw" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-amber-400/70 hover:text-amber-400 transition-colors">
                <Database className="w-3 h-3" /> DARE Repository
              </a>
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
