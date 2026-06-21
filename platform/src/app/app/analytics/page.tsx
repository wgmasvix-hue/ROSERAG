"use client";

import { useState } from "react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";
import {
  MessageSquare, FileText, Shield, Users,
  TrendingUp, TrendingDown, BarChart2, ArrowUpRight, ArrowDownRight,
} from "lucide-react";

// ─── Mock data ────────────────────────────────────────────────────────────────

const DATE_RANGES = ["7d", "30d", "90d", "1y"] as const;
type DateRange = typeof DATE_RANGES[number];

function generateQueryVolume(range: DateRange) {
  const points = range === "7d" ? 7 : range === "30d" ? 30 : range === "90d" ? 12 : 12;
  const labels: string[] = [];
  const now = new Date(2026, 5, 20); // June 20 2026

  if (range === "7d") {
    for (let i = points - 1; i >= 0; i--) {
      const d = new Date(now); d.setDate(d.getDate() - i);
      labels.push(d.toLocaleDateString("en", { month: "short", day: "numeric" }));
    }
  } else if (range === "30d") {
    for (let i = points - 1; i >= 0; i--) {
      const d = new Date(now); d.setDate(d.getDate() - i);
      labels.push(d.toLocaleDateString("en", { month: "short", day: "numeric" }));
    }
  } else if (range === "90d") {
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    for (let i = points - 1; i >= 0; i--) {
      const d = new Date(now); d.setMonth(d.getMonth() - i);
      labels.push(`${months[d.getMonth()]} W${Math.ceil(d.getDate()/7)}`);
    }
  } else {
    const months = ["Jul","Aug","Sep","Oct","Nov","Dec","Jan","Feb","Mar","Apr","May","Jun"];
    labels.push(...months);
  }

  const base = range === "7d" ? 80 : range === "30d" ? 200 : range === "90d" ? 600 : 2000;
  return labels.map((label, i) => ({
    label,
    queries: Math.round(base + Math.sin(i * 0.9) * base * 0.35 + Math.random() * base * 0.2 + i * (base / points) * 0.3),
    documents: Math.round((base * 0.6) + Math.cos(i * 0.7) * base * 0.2 + Math.random() * base * 0.15),
  }));
}

const REPOSITORIES = [
  { name: "DSpace Institutional", docs: 5842, color: "#e11d48" },
  { name: "OpenAlex Harvest", docs: 3201, color: "#3b82f6" },
  { name: "PubMed Central", docs: 2450, color: "#8b5cf6" },
  { name: "Koha Library", docs: 1874, color: "#f59e0b" },
  { name: "Google Scholar", docs: 1203, color: "#10b981" },
  { name: "Web Crawl", docs: 867, color: "#64748b" },
];

const TRUST_TREND = [
  { month: "Jan", score: 88.2 },
  { month: "Feb", score: 89.5 },
  { month: "Mar", score: 91.0 },
  { month: "Apr", score: 90.3 },
  { month: "May", score: 92.7 },
  { month: "Jun", score: 94.2 },
];

const TOP_TOPICS = [
  { topic: "Food Security Zimbabwe 2024", queries: 124, trend: "up", delta: "+18%" },
  { topic: "Climate Change Adaptation Africa", queries: 98, trend: "up", delta: "+12%" },
  { topic: "Post-Harvest Losses Grain Storage", queries: 87, trend: "up", delta: "+9%" },
  { topic: "SADC Agricultural Policy", queries: 76, trend: "down", delta: "-3%" },
  { topic: "Smallholder Farmer Empowerment", queries: 64, trend: "up", delta: "+22%" },
  { topic: "Water Resource Management", queries: 58, trend: "up", delta: "+5%" },
  { topic: "Land Reform Zimbabwe", queries: 49, trend: "down", delta: "-7%" },
  { topic: "Fertilizer Subsidy Programs", queries: 43, trend: "up", delta: "+14%" },
];

const STAT_CARDS = [
  {
    title: "Total Queries",
    value: "3,291",
    delta: "+89 today",
    positive: true,
    icon: MessageSquare,
    color: "bg-rose-50 text-rose-600",
  },
  {
    title: "Documents Processed",
    value: "12,847",
    delta: "+234 this week",
    positive: true,
    icon: FileText,
    color: "bg-blue-50 text-blue-600",
  },
  {
    title: "Avg Trust Score",
    value: "94.2%",
    delta: "+1.5% this month",
    positive: true,
    icon: Shield,
    color: "bg-green-50 text-green-600",
  },
  {
    title: "Active Users",
    value: "248",
    delta: "-12 vs last week",
    positive: false,
    icon: Users,
    color: "bg-purple-50 text-purple-600",
  },
];

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="card px-3 py-2 text-xs shadow-lg">
      <div className="font-semibold text-slate-700 mb-1">{label}</div>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
          <span className="text-slate-500">{p.name}:</span>
          <span className="font-bold text-slate-900">{typeof p.value === "number" && p.value % 1 !== 0 ? p.value.toFixed(1) : p.value}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [range, setRange] = useState<DateRange>("30d");
  const queryData = generateQueryVolume(range);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <BarChart2 className="w-7 h-7 text-rose-500" />
            Analytics Center
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Platform usage, knowledge base health, and query intelligence
          </p>
        </div>
        {/* Date range filter */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
          {DATE_RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                range === r
                  ? "bg-white text-rose-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map((s) => (
          <div key={s.title} className="card p-5">
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center`}>
                <s.icon className="w-5 h-5" />
              </div>
              {s.positive ? (
                <TrendingUp className="w-4 h-4 text-green-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-400" />
              )}
            </div>
            <div className="text-2xl font-black text-slate-900 mb-0.5">{s.value}</div>
            <div className="text-xs text-slate-500 font-medium">{s.title}</div>
            <div className={`text-xs mt-1 font-medium ${s.positive ? "text-green-600" : "text-red-500"}`}>
              {s.delta}
            </div>
          </div>
        ))}
      </div>

      {/* Charts row 1 */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Query volume AreaChart */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-bold text-slate-900">Query Volume</h3>
              <p className="text-xs text-slate-500 mt-0.5">Queries vs. documents over {range}</p>
            </div>
            <span className="badge badge-rose">Live</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={queryData} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="gQ" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#e11d48" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#e11d48" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gD" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#f1f5f9" strokeDasharray="4 4" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} axisLine={false} tickLine={false}
                interval={Math.max(Math.floor(queryData.length / 6) - 1, 0)} />
              <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={36} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="queries" name="Queries" stroke="#e11d48" strokeWidth={2} fill="url(#gQ)" dot={false} />
              <Area type="monotone" dataKey="documents" name="Documents" stroke="#3b82f6" strokeWidth={2} fill="url(#gD)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Trust score LineChart */}
        <div className="card p-6">
          <div className="mb-5">
            <h3 className="font-bold text-slate-900">Trust Score Trend</h3>
            <p className="text-xs text-slate-500 mt-0.5">Avg answer confidence monthly</p>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={TRUST_TREND} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
              <CartesianGrid stroke="#f1f5f9" strokeDasharray="4 4" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} domain={[85, 97]} width={36} />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone" dataKey="score" name="Trust Score"
                stroke="#e11d48" strokeWidth={2.5} dot={{ fill: "#e11d48", r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
            <span>Current: <strong className="text-slate-900">94.2%</strong></span>
            <span className="badge badge-green">+6.0 pts YTD</span>
          </div>
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Repositories BarChart */}
        <div className="card p-6">
          <div className="mb-5">
            <h3 className="font-bold text-slate-900">Top Repositories</h3>
            <p className="text-xs text-slate-500 mt-0.5">Document count by source</p>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={REPOSITORIES} layout="vertical" margin={{ top: 0, right: 10, bottom: 0, left: 0 }}>
              <CartesianGrid stroke="#f1f5f9" strokeDasharray="4 4" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={130} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="docs" name="Documents" radius={[0, 4, 4, 0]}>
                {REPOSITORIES.map((entry) => (
                  <rect key={entry.name} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top topics table */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900">Top Searched Topics</h3>
              <p className="text-xs text-slate-500 mt-0.5">By query count with trend</p>
            </div>
            <span className="badge badge-blue">{range}</span>
          </div>
          <div className="overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left text-xs font-semibold text-slate-400 pb-2 pr-3">#</th>
                  <th className="text-left text-xs font-semibold text-slate-400 pb-2">Topic</th>
                  <th className="text-right text-xs font-semibold text-slate-400 pb-2">Queries</th>
                  <th className="text-right text-xs font-semibold text-slate-400 pb-2">Trend</th>
                </tr>
              </thead>
              <tbody>
                {TOP_TOPICS.map((t, i) => (
                  <tr key={t.topic} className="border-b border-slate-50 last:border-0">
                    <td className="py-2.5 pr-3 text-xs font-bold text-slate-300">{i + 1}</td>
                    <td className="py-2.5 pr-2">
                      <span className="text-xs text-slate-700 font-medium line-clamp-1">{t.topic}</span>
                    </td>
                    <td className="py-2.5 text-right text-xs font-bold text-slate-900 pr-2">{t.queries}</td>
                    <td className="py-2.5 text-right">
                      <span className={`inline-flex items-center gap-0.5 text-xs font-semibold
                        ${t.trend === "up" ? "text-green-600" : "text-red-500"}`}>
                        {t.trend === "up"
                          ? <ArrowUpRight className="w-3 h-3" />
                          : <ArrowDownRight className="w-3 h-3" />}
                        {t.delta}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
