"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useRef } from "react";
import {
  Search, BookOpen, ArrowRight, Database, ExternalLink,
  ChevronLeft, Brain, Microscope, Wheat, HeartPulse,
  GraduationCap, Cpu, Globe, BarChart3, CheckCircle,
} from "lucide-react";

// ─── Subject catalogue ────────────────────────────────────────────────────────

const SUBJECTS: Record<string, {
  label: string;
  tagline: string;
  description: string;
  icon: React.ElementType;
  gradient: string;
  queries: string[];
  relatedSubjects: string[];
}> = {
  "food-science": {
    label: "Food Science & Nutrition",
    tagline: "From farm to evidence-based policy",
    description: "Explore research on food security, nutrition, post-harvest management, food systems, and dietary policy in the DARE repository.",
    icon: Wheat,
    gradient: "from-amber-600 to-orange-700",
    queries: [
      "food security Zimbabwe 2024",
      "post-harvest losses smallholder farmers",
      "nutrition intervention outcomes Southern Africa",
      "food systems climate change Africa",
      "dietary diversity indicators",
    ],
    relatedSubjects: ["agriculture", "health-sciences", "climate-science"],
  },
  "agriculture": {
    label: "Agriculture & Farming",
    tagline: "Grounding practice in peer-reviewed evidence",
    description: "Research on crop science, irrigation, smallholder farming, soil health, and sustainable agricultural systems across Southern Africa.",
    icon: Wheat,
    gradient: "from-green-600 to-emerald-700",
    queries: [
      "smallholder farmer productivity Zimbabwe",
      "irrigation systems Sub-Saharan Africa",
      "soil degradation Southern Africa",
      "drought-resistant crop varieties",
      "sustainable agriculture practices",
    ],
    relatedSubjects: ["food-science", "climate-science", "economics"],
  },
  "climate-science": {
    label: "Climate Science",
    tagline: "Understanding the data behind the crisis",
    description: "Research on climate variability, adaptation strategies, carbon emissions, and the environmental impacts of development across Africa.",
    icon: Globe,
    gradient: "from-blue-600 to-sky-700",
    queries: [
      "climate change adaptation Southern Africa",
      "El Niño drought Zimbabwe impact",
      "carbon sequestration woodland Africa",
      "climate variability rainfall patterns",
      "renewable energy transition Africa",
    ],
    relatedSubjects: ["agriculture", "health-sciences", "economics"],
  },
  "health-sciences": {
    label: "Health Sciences",
    tagline: "Evidence-based medicine for African contexts",
    description: "Medical research, public health interventions, epidemiology, disease burden, and health systems strengthening across Southern Africa.",
    icon: HeartPulse,
    gradient: "from-rose-600 to-red-700",
    queries: [
      "HIV prevalence Zimbabwe interventions",
      "maternal mortality Southern Africa",
      "malaria prevention Sub-Saharan Africa",
      "health system strengthening Zimbabwe",
      "non-communicable disease burden Africa",
    ],
    relatedSubjects: ["social-sciences", "economics", "education"],
  },
  "education": {
    label: "Education Research",
    tagline: "Evidence for better learning outcomes",
    description: "Research on pedagogy, educational policy, literacy, teacher training, and outcomes in African educational systems.",
    icon: GraduationCap,
    gradient: "from-purple-600 to-violet-700",
    queries: [
      "learning outcomes primary school Zimbabwe",
      "teacher training effectiveness Africa",
      "ICT education developing countries",
      "early childhood development Southern Africa",
      "university enrolment rates Zimbabwe",
    ],
    relatedSubjects: ["social-sciences", "economics", "engineering"],
  },
  "engineering": {
    label: "Engineering & Technology",
    tagline: "Applied research for development",
    description: "Engineering innovations, infrastructure research, renewable energy, water systems, and technology for development contexts.",
    icon: Cpu,
    gradient: "from-slate-700 to-slate-800",
    queries: [
      "solar energy rural Zimbabwe",
      "water sanitation infrastructure Africa",
      "civil engineering standards Southern Africa",
      "mobile technology innovation Africa",
      "infrastructure development financing",
    ],
    relatedSubjects: ["economics", "climate-science", "education"],
  },
  "social-sciences": {
    label: "Social Sciences",
    tagline: "Understanding people, communities, and systems",
    description: "Sociology, anthropology, political science, gender studies, and community development research from the DARE repository.",
    icon: Brain,
    gradient: "from-indigo-600 to-blue-700",
    queries: [
      "gender inequality Zimbabwe",
      "youth unemployment Southern Africa",
      "community development rural Africa",
      "migration patterns Sub-Saharan Africa",
      "governance institutions Africa",
    ],
    relatedSubjects: ["economics", "education", "health-sciences"],
  },
  "economics": {
    label: "Economics & Finance",
    tagline: "Data-driven economic insight",
    description: "Macroeconomic analysis, development economics, trade, investment, poverty reduction, and financial inclusion research.",
    icon: BarChart3,
    gradient: "from-teal-600 to-cyan-700",
    queries: [
      "economic growth Zimbabwe drivers",
      "poverty reduction strategies Southern Africa",
      "financial inclusion mobile money Africa",
      "trade policy SADC region",
      "foreign direct investment Zimbabwe",
    ],
    relatedSubjects: ["social-sciences", "agriculture", "education"],
  },
};

function formatLabel(slug: string) {
  return slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SubjectResearchClient({ subject: subjectSlug }: { subject: string }) {
  const router = useRouter();
  const subject = SUBJECTS[subjectSlug] ?? {
    label: formatLabel(subjectSlug) || "Research",
    tagline: "Evidence-based discovery from DARE",
    description: "Search the DARE institutional repository for peer-reviewed research, theses, reports, and academic papers.",
    icon: Microscope,
    gradient: "from-rose-600 to-rose-800",
    queries: ["research Africa", "development Southern Africa", "Zimbabwe academic research"],
    relatedSubjects: ["food-science", "health-sciences", "climate-science"],
  };

  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim() || subject.queries[0];
    router.push(`/app/search?q=${encodeURIComponent(q)}`);
  }

  const Icon = subject.icon;

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* Top bar */}
      <div className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-slate-400 hover:text-white transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </Link>
            <span className="text-slate-700">|</span>
            <Link href="/" className="font-black text-sm">
              <span className="text-rose-400">Chenget</span><span className="text-white">AI</span>
              <span className="text-slate-500 font-semibold text-xs ml-1">Labs</span>
            </Link>
            <span className="text-slate-700 hidden sm:block">›</span>
            <span className="text-slate-300 text-sm hidden sm:block">{subject.label}</span>
          </div>
          <div className="flex items-center gap-2">
            <a href="https://dspace.dare.co.zw" target="_blank" rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 text-xs text-amber-400/70 hover:text-amber-400 transition-colors border border-amber-500/20 px-3 py-1.5 rounded-lg">
              <Database className="w-3 h-3" /> DARE Repository
            </a>
            <Link href="/app"
              className="text-xs bg-rose-600 hover:bg-rose-500 text-white font-semibold px-3 py-1.5 rounded-lg transition-colors">
              Launch Platform
            </Link>
          </div>
        </div>
      </div>

      {/* Hero */}
      <section className={`bg-gradient-to-br ${subject.gradient} py-16`}>
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex items-center gap-2 text-xs text-white/50 mb-6">
            <Link href="/" className="hover:text-white/80 transition-colors">ChengetAI Labs</Link>
            <span>›</span>
            <span>Research Areas</span>
            <span>›</span>
            <span className="text-white/80">{subject.label}</span>
          </div>

          <div className="flex items-start gap-5 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center flex-shrink-0">
              <Icon className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-white/50 mb-1">
                DARE Repository · Research Area
              </p>
              <h1 className="text-3xl lg:text-4xl font-black text-white leading-tight">
                {subject.label}
              </h1>
              <p className="text-white/60 text-sm mt-1">{subject.tagline}</p>
            </div>
          </div>

          <p className="text-white/75 text-base leading-relaxed max-w-2xl mb-8">
            {subject.description}
          </p>

          {/* Search */}
          <form onSubmit={handleSearch} className="max-w-2xl">
            <div className="flex items-center bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-1.5 gap-2 focus-within:border-white/40 transition-colors">
              <Search className="w-5 h-5 text-white/40 ml-3 flex-shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Search ${subject.label} in DARE…`}
                className="flex-1 bg-transparent text-white placeholder:text-white/35 text-sm focus:outline-none py-2.5"
              />
              <button type="submit"
                className="bg-white/20 hover:bg-white/30 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors flex-shrink-0">
                Search DARE
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {subject.queries.map((q) => (
                <button key={q} type="button"
                  onClick={() => { setQuery(q); inputRef.current?.focus(); }}
                  className="text-xs bg-black/20 hover:bg-black/35 text-white/65 hover:text-white border border-white/10 px-3 py-1.5 rounded-full transition-colors">
                  {q}
                </button>
              ))}
            </div>
          </form>
        </div>
      </section>

      {/* DARE source bar */}
      <div className="bg-slate-900 border-b border-slate-800 py-3">
        <div className="max-w-5xl mx-auto px-6 flex flex-wrap items-center gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Database className="w-3.5 h-3.5 text-amber-400" />
            <span>Source:{" "}
              <a href="https://dspace.dare.co.zw" target="_blank" rel="noopener noreferrer"
                className="text-amber-400 hover:text-amber-300 transition-colors">
                dspace.dare.co.zw
              </a>
            </span>
          </div>
          <span className="text-slate-700">·</span>
          <span>DSpace 8.1 · Public Access</span>
          <span className="text-slate-700">·</span>
          <div className="flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-green-400" />
            <span className="text-green-400">AI-powered · Cited answers only</span>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-3 gap-8">

          {/* Left */}
          <div className="lg:col-span-2 space-y-8">

            {/* Actions */}
            <div>
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">
                What do you want to do?
              </h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  {
                    icon: Search,
                    title: "Search with AI",
                    desc: `Ask any question about ${subject.label} in DARE`,
                    href: `/app/search?q=${encodeURIComponent(subject.queries[0])}`,
                    border: "border-rose-500/30 hover:border-rose-500/60",
                    badge: "Hybrid Search",
                    external: false,
                  },
                  {
                    icon: BookOpen,
                    title: "Open a Notebook",
                    desc: "Collect DARE sources and build a research workspace",
                    href: "/app/notebook",
                    border: "border-blue-500/30 hover:border-blue-500/60",
                    badge: "Notebook",
                    external: false,
                  },
                  {
                    icon: Brain,
                    title: "Ask the Copilot",
                    desc: `Get an AI literature review for ${subject.label}`,
                    href: `/app/copilot`,
                    border: "border-purple-500/30 hover:border-purple-500/60",
                    badge: "AI Copilot",
                    external: false,
                  },
                  {
                    icon: Database,
                    title: "Browse DARE Directly",
                    desc: "View the raw DSpace repository for this subject",
                    href: "https://dspace.dare.co.zw",
                    border: "border-amber-500/30 hover:border-amber-500/60",
                    badge: "DSpace 8.1",
                    external: true,
                  },
                ].map((a) => {
                  const content = (
                    <>
                      <div className="flex items-center justify-between">
                        <a.icon className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600 bg-slate-800 px-2 py-0.5 rounded-full">
                          {a.badge}
                        </span>
                      </div>
                      <div className="mt-3">
                        <div className="font-semibold text-white text-sm flex items-center gap-1.5">
                          {a.title}
                          {a.external && <ExternalLink className="w-3 h-3 text-slate-500" />}
                        </div>
                        <div className="text-slate-400 text-xs mt-0.5 leading-relaxed">{a.desc}</div>
                      </div>
                      {!a.external && (
                        <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-white group-hover:translate-x-1 transition-all mt-3" />
                      )}
                    </>
                  );
                  return a.external ? (
                    <a key={a.title} href={a.href} target="_blank" rel="noopener noreferrer"
                      className={`group flex flex-col p-5 rounded-2xl border ${a.border} bg-slate-900 transition-all`}>
                      {content}
                    </a>
                  ) : (
                    <Link key={a.title} href={a.href}
                      className={`group flex flex-col p-5 rounded-2xl border ${a.border} bg-slate-900 transition-all`}>
                      {content}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Suggested questions */}
            <div>
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">
                Suggested Research Questions
              </h2>
              <div className="space-y-2">
                {subject.queries.map((q, i) => (
                  <Link key={q} href={`/app/search?q=${encodeURIComponent(q)}`}
                    className="flex items-center gap-4 p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-600 hover:bg-slate-800/50 transition-all group">
                    <span className="w-6 h-6 rounded-full bg-slate-800 group-hover:bg-rose-600/20 border border-slate-700 text-slate-500 group-hover:text-rose-400 text-xs font-bold flex items-center justify-center flex-shrink-0 transition-colors">
                      {i + 1}
                    </span>
                    <span className="text-slate-300 text-sm flex-1 leading-snug">{q}</span>
                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-rose-400 group-hover:translate-x-1 transition-all flex-shrink-0" />
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Right sidebar */}
          <div className="space-y-5">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-lg bg-rose-600 flex items-center justify-center">
                  <span className="text-white text-[10px] font-black">C</span>
                </div>
                <span className="text-white font-semibold text-sm">ChengetAI Labs</span>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed mb-4">
                AI-powered research intelligence built on top of the DARE Institutional Repository. Cited answers, no hallucinations.
              </p>
              <Link href="/app"
                className="flex items-center justify-center gap-2 w-full bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm py-2.5 rounded-xl transition-colors">
                Open Full Platform <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
                Related Research Areas
              </h3>
              <div className="space-y-2">
                {subject.relatedSubjects.map((slug) => {
                  const rel = SUBJECTS[slug];
                  if (!rel) return null;
                  const RelIcon = rel.icon;
                  return (
                    <Link key={slug} href={`/${slug}/research`}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800 transition-colors group">
                      <div className="w-8 h-8 rounded-lg bg-slate-800 group-hover:bg-slate-700 flex items-center justify-center flex-shrink-0 transition-colors">
                        <RelIcon className="w-4 h-4 text-slate-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-white text-xs font-medium truncate">{rel.label}</div>
                        <div className="text-slate-500 text-[11px] truncate">{rel.tagline}</div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 flex-shrink-0" />
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <Database className="w-4 h-4 text-amber-400" />
                <span className="text-amber-300 font-semibold text-sm">DARE Repository</span>
              </div>
              <p className="text-amber-200/70 text-xs leading-relaxed mb-3">
                All content sourced from dspace.dare.co.zw · DSpace 8.1 · Public Access
              </p>
              <a href="https://dspace.dare.co.zw" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-medium transition-colors">
                Browse DARE directly <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* All research areas */}
        <div className="mt-12 pt-10 border-t border-slate-800">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6">
            All Research Areas
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {Object.entries(SUBJECTS).map(([slug, s]) => {
              const S = s.icon;
              const isActive = slug === subjectSlug;
              return (
                <Link key={slug} href={`/${slug}/research`}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all group ${
                    isActive
                      ? "border-rose-500/50 bg-rose-500/10 text-rose-400"
                      : "border-slate-800 hover:border-slate-600 bg-slate-900 hover:bg-slate-800"
                  }`}>
                  <S className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-rose-400" : "text-slate-500 group-hover:text-slate-300"}`} />
                  <span className={`text-xs font-medium leading-snug ${isActive ? "text-rose-300" : "text-slate-300"}`}>
                    {s.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800 mt-8 py-8">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-black text-sm text-white">
              <span className="text-rose-400">Chenget</span>AI
            </span>
            <span>Labs · Powered by RoseRAG</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="https://dspace.dare.co.zw" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-amber-400/60 hover:text-amber-400 transition-colors">
              <Database className="w-3 h-3" /> DARE
            </a>
            <Link href="/app" className="hover:text-white transition-colors">Platform</Link>
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
