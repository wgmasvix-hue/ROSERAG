"use client";

import Link from "next/link";
import {
  FileText, Database, Layers, MessageSquare, CheckCircle, Bot,
  TrendingUp, TrendingDown, ArrowRight, Upload, Search, BookOpen,
  Activity, Clock, Shield, Zap, BarChart2
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

// ─── Mock data ───────────────────────────────────────────────────────────────

const STATS_CARDS = [
  {
    title: "Documents Indexed",
    value: "12,847",
    delta: "+234 this week",
    positive: true,
    icon: FileText,
    color: "bg-blue-50 text-blue-600",
    href: "/app/ingestion",
  },
  {
    title: "Sources Connected",
    value: "18",
    delta: "+3 this month",
    positive: true,
    icon: Database,
    color: "bg-purple-50 text-purple-600",
    href: "/app/settings",
  },
  {
    title: "Collections",
    value: "24",
    delta: "+2 this week",
    positive: true,
    icon: Layers,
    color: "bg-amber-50 text-amber-600",
    href: "/app/collections",
  },
  {
    title: "Queries",
    value: "3,291",
    delta: "+89 today",
    positive: true,
    icon: MessageSquare,
    color: "bg-rose-50 text-rose-600",
    href: "/app/search",
  },
  {
    title: "Verified Answers",
    value: "2,964",
    delta: "90.1% accuracy",
    positive: true,
    icon: CheckCircle,
    color: "bg-green-50 text-green-600",
    href: "/app/analytics",
  },
  {
    title: "Active Copilots",
    value: "5",
    delta: "All healthy",
    positive: true,
    icon: Bot,
    color: "bg-cyan-50 text-cyan-600",
    href: "/app/copilot",
  },
];

const QUERY_TREND = [
  { date: "Jun 1", queries: 120, documents: 80 },
  { date: "Jun 5", queries: 190, documents: 110 },
  { date: "Jun 9", queries: 165, documents: 95 },
  { date: "Jun 13", queries: 240, documents: 140 },
  { date: "Jun 17", queries: 310, documents: 200 },
  { date: "Jun 20", queries: 289, documents: 180 },
];

const TOP_SEARCHES = [
  { query: "Food security Zimbabwe 2024", count: 124 },
  { query: "Climate change adaptation Africa", count: 98 },
  { query: "Post-harvest losses grain storage", count: 87 },
  { query: "SADC agricultural policy", count: 76 },
  { query: "Smallholder farmer empowerment", count: 64 },
];

const RECENT_DOCS = [
  { title: "FAO Food Security Report 2024", type: "PDF", status: "ready", time: "2h ago" },
  { title: "ZIMSTAT Agricultural Survey", type: "XLSX", status: "processing", time: "4h ago" },
  { title: "Climate Adaptation Strategies", type: "DOCX", status: "ready", time: "6h ago" },
  { title: "SADC Policy Framework 2023", type: "PDF", status: "ready", time: "1d ago" },
];

const QUICK_ACTIONS = [
  { label: "Upload Documents", icon: Upload, href: "/app/ingestion", color: "bg-rose-50 text-rose-600 hover:bg-rose-100" },
  { label: "New Notebook", icon: BookOpen, href: "/app/studio", color: "bg-blue-50 text-blue-600 hover:bg-blue-100" },
  { label: "Search Knowledge", icon: Search, href: "/app/search", color: "bg-purple-50 text-purple-600 hover:bg-purple-100" },
  { label: "Open Copilot", icon: Bot, href: "/app/copilot", color: "bg-green-50 text-green-600 hover:bg-green-100" },
];

// ─── Components ──────────────────────────────────────────────────────────────

function StatCard({ s }: { s: typeof STATS_CARDS[0] }) {
  return (
    <Link href={s.href} className="card-hover p-5 block group">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center`}>
          <s.icon className="w-5 h-5" />
        </div>
        {s.positive ? (
          <TrendingUp className="w-4 h-4 text-green-500" />
        ) : (
          <TrendingDown className="w-4 h-4 text-red-500" />
        )}
      </div>
      <div className="text-2xl font-black text-slate-900 mb-1">{s.value}</div>
      <div className="text-xs text-slate-500 font-medium">{s.title}</div>
      <div className={`text-xs mt-1 font-medium ${s.positive ? "text-green-600" : "text-red-500"}`}>
        {s.delta}
      </div>
    </Link>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Good morning, Researcher 👋</h2>
          <p className="text-slate-500 text-sm mt-1">
            Your knowledge base is healthy. 94.2% trust score across 12,847 documents.
          </p>
        </div>
        <Link href="/app/studio" className="btn-primary hidden sm:inline-flex">
          New Notebook <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {STATS_CARDS.map((s) => <StatCard key={s.title} s={s} />)}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {QUICK_ACTIONS.map((a) => (
          <Link key={a.label} href={a.href}
            className={`flex items-center gap-3 p-4 rounded-xl border border-slate-200 font-medium text-sm transition-all duration-150 ${a.color}`}>
            <a.icon className="w-5 h-5 flex-shrink-0" />
            {a.label}
          </Link>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Query trend */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-bold text-slate-900">Query Trends</h3>
              <p className="text-xs text-slate-500 mt-0.5">Queries and documents over time</p>
            </div>
            <span className="badge badge-green">↑ 24% this week</span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={QUERY_TREND}>
              <defs>
                <linearGradient id="gQuery" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#e11d48" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#e11d48" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gDocs" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}
              />
              <Area type="monotone" dataKey="queries" stroke="#e11d48" strokeWidth={2} fill="url(#gQuery)" name="Queries" />
              <Area type="monotone" dataKey="documents" stroke="#3b82f6" strokeWidth={2} fill="url(#gDocs)" name="Documents" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Trust score */}
        <div className="card p-6 flex flex-col">
          <h3 className="font-bold text-slate-900 mb-1">Trust Score</h3>
          <p className="text-xs text-slate-500 mb-6">Answer confidence metrics</p>

          <div className="flex-1 flex flex-col justify-center">
            <div className="relative w-32 h-32 mx-auto mb-6">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#f1f5f9" strokeWidth="12" />
                <circle cx="50" cy="50" r="40" fill="none" stroke="#e11d48" strokeWidth="12"
                  strokeDasharray={`${94.2 * 2.51} ${(100 - 94.2) * 2.51}`}
                  strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-slate-900">94.2%</span>
                <span className="text-xs text-slate-500">Trust</span>
              </div>
            </div>

            <div className="space-y-2.5">
              {[
                { label: "Source Quality", val: 96 },
                { label: "Citation Density", val: 92 },
                { label: "Consistency", val: 94 },
                { label: "Recency", val: 89 },
              ].map((m) => (
                <div key={m.label}>
                  <div className="flex justify-between text-xs mb-1 text-slate-600">
                    <span>{m.label}</span>
                    <span className="font-semibold">{m.val}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-rose-500 rounded-full transition-all" style={{ width: `${m.val}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent documents */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900">Recent Documents</h3>
            <Link href="/app/ingestion" className="text-xs text-rose-600 hover:text-rose-700 font-medium flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {RECENT_DOCS.map((doc) => (
              <div key={doc.title} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-rose-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-900 truncate">{doc.title}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{doc.type} · {doc.time}</div>
                </div>
                <span className={`badge ${doc.status === "ready" ? "badge-green" : "badge-amber"}`}>
                  {doc.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top searches */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900">Top Searches</h3>
            <Link href="/app/analytics" className="text-xs text-rose-600 hover:text-rose-700 font-medium flex items-center gap-1">
              Analytics <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {TOP_SEARCHES.map((s, i) => (
              <div key={s.query} className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-slate-700 truncate">{s.query}</div>
                  <div className="h-1.5 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
                    <div
                      className="h-full bg-rose-400 rounded-full"
                      style={{ width: `${(s.count / 124) * 100}%` }}
                    />
                  </div>
                </div>
                <span className="text-xs font-semibold text-slate-400 flex-shrink-0">{s.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
