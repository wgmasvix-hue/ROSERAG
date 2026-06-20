"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Search, BookOpen, GitBranch, Mic, Shield, BarChart3,
  ArrowRight, CheckCircle, Star, Brain, Menu, X
} from "lucide-react";

// ─── Data ──────────────────────────────────────────────────────────────────

const NAV_LINKS = [
  { label: "Home", href: "#home" },
  { label: "Features", href: "#features" },
  { label: "Solutions", href: "#solutions" },
  { label: "Resources", href: "#resources" },
  { label: "Pricing", href: "#pricing" },
  { label: "About", href: "#about" },
];

const FEATURES = [
  {
    icon: Search,
    title: "Hybrid Search",
    desc: "Combines keyword, semantic, and metadata search to find exactly what you need across all your repositories.",
    color: "bg-rose-50 text-rose-600",
  },
  {
    icon: Brain,
    title: "AI Copilot",
    desc: "Multi-agent AI assistants for students, teachers, researchers, librarians, and institutional leaders.",
    color: "bg-blue-50 text-blue-600",
  },
  {
    icon: GitBranch,
    title: "Knowledge Graph",
    desc: "Automatically maps entities and relationships across your documents, revealing hidden connections.",
    color: "bg-purple-50 text-purple-600",
  },
  {
    icon: BarChart3,
    title: "Document Analytics",
    desc: "Deep insights into usage patterns, citation networks, and repository growth over time.",
    color: "bg-amber-50 text-amber-600",
  },
  {
    icon: Mic,
    title: "Audio Intelligence",
    desc: "Transform documents into podcast summaries and research briefings in multiple languages.",
    color: "bg-green-50 text-green-600",
  },
  {
    icon: Shield,
    title: "Trust & Auditing",
    desc: "Every answer is backed by citations. Hallucination reduction, confidence scoring, and full audit trails.",
    color: "bg-orange-50 text-orange-600",
  },
];

const PERSONAS = [
  {
    id: "student",
    title: "Student Capital",
    badge: "DARA AI",
    desc: "Study smarter with AI-powered summaries, flashcards, quizzes, and explanations grounded in trusted sources.",
    features: ["Smart Summaries", "Flashcard Generator", "Quiz Builder", "Citation Finder"],
    color: "from-rose-600 to-rose-800",
    bgColor: "bg-rose-600",
    emoji: "🎓",
  },
  {
    id: "research",
    title: "Research Capital",
    badge: "Research AI",
    desc: "Accelerate research with literature review automation, gap analysis, and intelligent citation management.",
    features: ["Literature Reviews", "Gap Analysis", "Citation Engine", "Methodology AI"],
    color: "from-blue-600 to-blue-800",
    bgColor: "bg-blue-600",
    emoji: "🔬",
  },
  {
    id: "library",
    title: "Library Capital",
    badge: "Librarian AI",
    desc: "Modernize library operations with AI-powered cataloging, metadata enrichment, and DSpace/Koha integration.",
    features: ["Auto Cataloging", "Metadata AI", "DSpace Sync", "Koha Integration"],
    color: "from-purple-600 to-purple-800",
    bgColor: "bg-purple-600",
    emoji: "📚",
  },
  {
    id: "institution",
    title: "Institutional Mode",
    badge: "Enterprise",
    desc: "Multi-tenant platform with RBAC, SSO, audit logs, and institutional analytics for organizations at scale.",
    features: ["Multi-tenancy", "SAML SSO", "Audit Logs", "Data Governance"],
    color: "from-slate-700 to-slate-900",
    bgColor: "bg-slate-700",
    emoji: "🏛️",
  },
];

const STATS = [
  { value: "12M+", label: "Documents Indexed" },
  { value: "$60M+", label: "Research Unlocked" },
  { value: "50K+", label: "Active Researchers" },
  { value: "200+", label: "Institutions" },
  { value: "3", label: "Languages Supported" },
];

const TRUST_LOGOS = ["MUST", "FUU", "Bindura", "NUST", "CUT", "UZ", "MSU"];
const CONNECTORS = [
  "DSpace", "Koha", "OpenAlex", "PubMed", "Semantic Scholar",
  "Google Drive", "OneDrive", "Crossref", "FAO", "WHO",
];

// ─── Hero Dashboard Preview ─────────────────────────────────────────────────

function DashboardPreview() {
  return (
    <div className="relative w-full max-w-lg mx-auto">
      <div className="absolute inset-0 bg-rose-500/20 blur-3xl rounded-full scale-75" />
      <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-5 shadow-2xl">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex gap-1.5">
            {["bg-red-400", "bg-yellow-400", "bg-green-400"].map((c) => (
              <div key={c} className={`w-3 h-3 rounded-full ${c}`} />
            ))}
          </div>
          <div className="flex-1 h-5 bg-white/10 rounded-md mx-2" />
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { label: "Documents", val: "12,847", delta: "+234" },
            { label: "Queries", val: "3,291", delta: "+89" },
            { label: "Trust Score", val: "94.2%", delta: "+1.3%" },
          ].map((s) => (
            <div key={s.label} className="bg-white/10 rounded-lg p-2.5">
              <div className="text-white/50 text-[10px] mb-1">{s.label}</div>
              <div className="text-white font-bold text-sm">{s.val}</div>
              <div className="text-green-400 text-[10px]">{s.delta}</div>
            </div>
          ))}
        </div>

        <div className="bg-white/5 rounded-lg p-3 mb-3">
          <div className="flex gap-2 mb-2">
            <div className="w-6 h-6 rounded-full bg-rose-500 flex-shrink-0" />
            <div className="bg-white/10 rounded-lg p-2 text-white/80 text-xs flex-1">
              What are the key findings on food security in Zimbabwe?
            </div>
          </div>
          <div className="flex gap-2">
            <div className="w-6 h-6 rounded-full bg-blue-500 flex-shrink-0" />
            <div className="bg-white/15 rounded-lg p-2 flex-1">
              <div className="text-white text-xs mb-1.5">
                Based on <span className="text-rose-300">[1]</span> FAO Report 2024 and{" "}
                <span className="text-rose-300">[2]</span> WFP Assessment...
              </div>
              <div className="flex gap-1 flex-wrap">
                {["FAO Report", "WFP Data", "ZIMSTAT"].map((t) => (
                  <span key={t} className="bg-rose-500/30 text-rose-200 px-1.5 py-0.5 rounded text-[9px]">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/5 rounded-lg p-2.5">
          <div className="flex justify-between text-[10px] text-white/60 mb-1.5">
            <span>Confidence Score</span>
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
      {/* Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-1 font-black text-xl">
            <span className="text-rose-600">ROSE</span>
            <span className="text-slate-800">RAG</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map((l) => (
              <Link key={l.label} href={l.href}
                className="text-sm text-slate-600 hover:text-slate-900 font-medium transition-colors">
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Link href="/app" className="btn-secondary !text-sm !px-4 !py-2">Log in</Link>
            <Link href="/app" className="btn-primary !text-sm !px-4 !py-2">Get Started</Link>
          </div>

          <button className="md:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden bg-white border-t border-slate-200 px-6 py-4">
            {NAV_LINKS.map((l) => (
              <Link key={l.label} href={l.href} className="block py-2.5 text-sm text-slate-700 font-medium">
                {l.label}
              </Link>
            ))}
            <div className="flex gap-3 pt-3 border-t border-slate-100 mt-2">
              <Link href="/app" className="btn-secondary !text-sm flex-1 justify-center">Log in</Link>
              <Link href="/app" className="btn-primary !text-sm flex-1 justify-center">Get Started</Link>
            </div>
          </div>
        )}
      </header>

      {/* Hero */}
      <section id="home">
        <div className="min-h-screen flex items-center pt-16"
          style={{ background: "linear-gradient(135deg,#0f172a 0%,#1e293b 45%,#1a0a10 100%)" }}>
          <div className="max-w-7xl mx-auto px-6 py-24 w-full">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <div className="inline-flex items-center gap-2 bg-white/10 text-rose-300 px-3.5 py-1.5 rounded-full text-xs font-semibold border border-white/10 mb-6">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  AI Knowledge Operating System
                </div>

                <h1 className="text-5xl lg:text-6xl font-black text-white leading-[1.08] mb-6">
                  From Knowledge to
                  <br />
                  <span className="text-rose-400">Evidence-Based</span>
                  <br />
                  Intelligence
                </h1>

                <p className="text-lg text-slate-300 leading-relaxed mb-8 max-w-lg">
                  RoseRAG transforms your documents, repositories, and institutional knowledge
                  into trusted, cited, evidence-based intelligence — built for researchers,
                  libraries, universities, and enterprises.
                </p>

                <div className="flex flex-wrap gap-3 mb-10">
                  <Link href="/app" className="btn-primary !text-base !px-6 !py-3">
                    Get Started Free <ArrowRight className="w-4 h-4" />
                  </Link>
                  <a href="#features" className="btn-secondary !text-base !px-6 !py-3 !border-white/20 !bg-white/10 !text-white hover:!bg-white/20">
                    See How It Works
                  </a>
                </div>

                <div className="flex flex-wrap gap-5">
                  {["No hallucinations", "Cited answers", "Enterprise-ready"].map((t) => (
                    <div key={t} className="flex items-center gap-1.5 text-sm text-slate-400">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      {t}
                    </div>
                  ))}
                </div>
              </div>

              <div className="hidden lg:block">
                <DashboardPreview />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section className="py-10 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-xs font-bold uppercase tracking-widest text-slate-400 mb-6">
            Trusted by Institutions and Organizations
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {TRUST_LOGOS.map((name) => (
              <div key={name} className="px-5 py-2 bg-white rounded-lg border border-slate-200 text-sm font-semibold text-slate-500 hover:border-rose-200 hover:text-rose-600 transition-colors">
                {name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="badge badge-rose mb-4">Platform Features</span>
            <h2 className="text-4xl font-black text-slate-900 mb-4">
              Everything You Need to Work with Knowledge
            </h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              RoseRAG is the AI layer that transforms your institution into an evidence-first,
              secure knowledge platform.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="card-hover p-6 group">
                <div className={`w-11 h-11 rounded-xl ${f.color} flex items-center justify-center mb-4`}>
                  <f.icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
                <div className="mt-4 flex items-center gap-1 text-rose-600 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  Learn more <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Connectors */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-10">
            <span className="badge badge-blue mb-4">Connector Marketplace</span>
            <h2 className="text-2xl font-black text-slate-900 mb-3">
              Connect Every Source of Knowledge
            </h2>
            <p className="text-slate-500">Ingest from 50+ repositories, databases, APIs, and cloud storage providers</p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {CONNECTORS.map((c) => (
              <span key={c} className="px-4 py-2 bg-white rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:border-rose-300 hover:text-rose-700 transition-colors cursor-pointer shadow-sm">
                {c}
              </span>
            ))}
            <span className="px-4 py-2 bg-rose-50 rounded-lg border border-rose-200 text-sm font-medium text-rose-700">
              + 40 more
            </span>
          </div>
        </div>
      </section>

      {/* Solutions / Personas */}
      <section id="solutions" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="badge badge-purple mb-4">Built For Every Role</span>
            <h2 className="text-4xl font-black text-slate-900 mb-4">
              Built For Every Knowledge Worker
            </h2>
            <p className="text-lg text-slate-500 max-w-xl mx-auto">
              Purpose-built AI copilots for every role in your institution
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
                      <span className={`badge ${i === activePersona ? "badge-rose" : "badge-blue"} mb-1`}>{p.badge}</span>
                      <div className="font-semibold text-slate-900 text-sm">{p.title}</div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">{p.desc}</p>
                </button>
              ))}
            </div>

            <div className={`rounded-2xl p-8 bg-gradient-to-br ${persona.color} text-white`}>
              <div className="text-4xl mb-5">{persona.emoji}</div>
              <span className="badge bg-white/20 text-white mb-4">{persona.badge}</span>
              <h3 className="text-2xl font-black mb-3">{persona.title}</h3>
              <p className="text-white/80 mb-6 leading-relaxed">{persona.desc}</p>
              <div className="space-y-3">
                {persona.features.map((f) => (
                  <div key={f} className="flex items-center gap-3">
                    <CheckCircle className="w-4 h-4 text-white/70 flex-shrink-0" />
                    <span className="text-sm font-medium">{f}</span>
                  </div>
                ))}
              </div>
              <Link href="/app" className="mt-8 inline-flex items-center gap-2 bg-white text-rose-700 font-bold px-5 py-2.5 rounded-lg text-sm hover:bg-white/90 transition-colors">
                Get Started <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-gradient-to-r from-rose-600 to-rose-700">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 text-center">
            {STATS.map((s) => (
              <div key={s.label}>
                <div className="text-4xl font-black text-white mb-1">{s.value}</div>
                <div className="text-rose-200 text-sm">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <span className="badge badge-rose mb-6">Start Today</span>
          <h2 className="text-5xl font-black text-slate-900 mb-6 leading-tight">
            Ready to Transform Your Knowledge
            <br />
            <span className="gradient-text">Into Intelligence?</span>
          </h2>
          <p className="text-lg text-slate-500 mb-10 max-w-xl mx-auto">
            Join 50,000+ researchers, students, and institutions using RoseRAG
            to unlock evidence-based answers from their knowledge base.
          </p>
          <div className="flex flex-wrap gap-4 justify-center mb-6">
            <Link href="/app" className="btn-primary !text-base !px-8 !py-3.5">
              Get Started Free <ArrowRight className="w-4 h-4" />
            </Link>
            <a href="#" className="btn-secondary !text-base !px-8 !py-3.5">
              Schedule a Demo
            </a>
          </div>
          <div className="flex flex-wrap gap-5 justify-center text-sm text-slate-500">
            {["No credit card required", "Always-on support", "Secure & Private", "Supports that lasts"].map((t) => (
              <span key={t}>✓ {t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-10">
            <div>
              <div className="font-black text-xl text-white mb-3">
                <span className="text-rose-400">ROSE</span>RAG
              </div>
              <p className="text-sm leading-relaxed">
                AI-powered Knowledge Operating System for institutions, researchers, and enterprises.
              </p>
            </div>
            {[
              { title: "Product", links: ["Features", "Solutions", "Pricing", "Changelog"] },
              { title: "Platform", links: ["DSpace", "Koha", "API", "Integrations"] },
              { title: "Company", links: ["About", "Blog", "Careers", "Contact"] },
            ].map((col) => (
              <div key={col.title}>
                <div className="text-white font-semibold text-sm mb-3">{col.title}</div>
                <ul className="space-y-2">
                  {col.links.map((l) => (
                    <li key={l}><a href="#" className="text-sm hover:text-white transition-colors">{l}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-slate-800 pt-6 flex flex-col md:flex-row justify-between gap-3 text-xs">
            <span>© 2025 RoseRAG. All rights reserved.</span>
            <div className="flex gap-4">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
