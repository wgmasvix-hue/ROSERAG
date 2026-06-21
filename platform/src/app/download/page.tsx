"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Smartphone, Download, Shield, CheckCircle2, ArrowLeft,
  ExternalLink, Wifi, BookOpen, Search, FileText, Star,
  Zap, Globe, ArrowRight, Copy, Check,
} from "lucide-react";

const REPO = "wgmasvix-hue/roserag";
const VERSION = "1.0.0";
const APK_URL = `https://github.com/${REPO}/releases/latest/download/RoseRAG-${VERSION}-debug.apk`;
const RELEASES_URL = `https://github.com/${REPO}/releases/latest`;

const STEPS = [
  {
    num: 1,
    title: "Download the APK",
    desc: 'Tap the "Download APK" button on this page. The file is about 15 MB.',
    icon: Download,
  },
  {
    num: 2,
    title: "Allow unknown sources",
    desc: 'Settings → Security → "Install unknown apps" → allow your browser or Files app.',
    icon: Shield,
  },
  {
    num: 3,
    title: "Install the file",
    desc: "Open the downloaded .apk from your notifications or Downloads folder and tap Install.",
    icon: Smartphone,
  },
  {
    num: 4,
    title: "Start searching",
    desc: "Launch RoseRAG from your app drawer. It automatically connects to your institution.",
    icon: Zap,
  },
];

const FEATURES = [
  { icon: Search,   label: "Semantic Search",      desc: "AI-powered document discovery across your entire knowledge base" },
  { icon: BookOpen, label: "Knowledge Notebooks",  desc: "Save research threads and curate your own knowledge collections" },
  { icon: FileText, label: "Document Ingestion",   desc: "Upload PDFs, DOCX, TXT, and images on the go" },
  { icon: Wifi,     label: "Offline Access",        desc: "Cached answers available even without an internet connection" },
  { icon: Globe,    label: "DSpace & Koha Sync",   desc: "Pull directly from institutional repositories" },
  { icon: Star,     label: "AI Copilot Agents",    desc: "Persona-based agents: Research, Librarian, Policy, Executive" },
];

function PhoneMockup() {
  return (
    <div className="relative mx-auto w-[260px]">
      {/* Glow */}
      <div className="absolute inset-0 bg-rose-600/25 blur-3xl rounded-full scale-90 -z-10" />

      {/* Phone shell */}
      <div className="relative bg-slate-800 rounded-[2.8rem] border-4 border-slate-600 shadow-2xl shadow-slate-950 overflow-hidden">
        {/* Notch */}
        <div className="bg-slate-900 h-8 flex items-center justify-between px-5 text-[10px] text-slate-500">
          <span>9:41</span>
          <div className="w-16 h-3 bg-slate-800 rounded-full mx-auto -mt-1" />
          <span>●●●</span>
        </div>

        {/* App bar */}
        <div className="bg-slate-900 px-4 pt-3 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-rose-500 to-rose-700 flex items-center justify-center">
              <span className="text-white text-[11px] font-black">RR</span>
            </div>
            <span className="text-white text-sm font-semibold">RoseRAG</span>
          </div>
          <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center">
            <span className="text-slate-400 text-xs">W</span>
          </div>
        </div>

        {/* Search bar */}
        <div className="bg-slate-900 px-4 pb-3">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl px-3 py-2.5 flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="text-slate-500 text-[11px]">Ask your knowledge base…</span>
          </div>
        </div>

        {/* Chat */}
        <div className="bg-slate-950 px-3 py-3 space-y-3 min-h-[240px]">
          {/* User message */}
          <div className="flex justify-end">
            <div className="bg-rose-600 rounded-2xl rounded-tr-sm px-3 py-2 max-w-[80%]">
              <p className="text-white text-[11px] leading-relaxed">
                Key findings on food security in Zimbabwe?
              </p>
            </div>
          </div>

          {/* AI reply */}
          <div className="flex gap-2 items-start">
            <div className="w-5 h-5 rounded-full bg-blue-600 shrink-0 mt-0.5 flex items-center justify-center">
              <span className="text-white text-[9px] font-bold">AI</span>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-tl-sm px-3 py-2 flex-1">
              <p className="text-slate-200 text-[11px] leading-relaxed">
                Based on <span className="text-rose-400 font-medium">[1]</span> FAO 2024 and{" "}
                <span className="text-rose-400 font-medium">[2]</span> WFP Assessment, food
                insecurity affects 5.3M people…
              </p>
              <div className="flex gap-1 mt-2 flex-wrap">
                {["FAO Report", "WFP Data", "ZIMSTAT"].map((t) => (
                  <span key={t} className="bg-rose-500/20 border border-rose-500/30 text-rose-300 px-1.5 py-0.5 rounded-lg text-[9px] font-medium">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Confidence */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2">
            <div className="flex justify-between text-[9px] mb-1.5">
              <span className="text-slate-500">Confidence Score</span>
              <span className="text-green-400 font-semibold">94.2%</span>
            </div>
            <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full" style={{ width: "94%" }} />
            </div>
          </div>

          {/* Input bar */}
          <div className="flex gap-2 items-center">
            <div className="flex-1 bg-slate-800 border border-slate-700 rounded-full px-3 py-2">
              <span className="text-slate-600 text-[10px]">Ask a follow-up…</span>
            </div>
            <div className="w-7 h-7 rounded-full bg-rose-600 flex items-center justify-center shrink-0">
              <ArrowRight className="w-3 h-3 text-white" />
            </div>
          </div>
        </div>

        {/* Home bar */}
        <div className="bg-slate-900 py-2 flex justify-center">
          <div className="w-20 h-1 bg-slate-600 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export default function DownloadPage() {
  const [copied, setCopied] = useState(false);

  function copyLink() {
    navigator.clipboard.writeText(APK_URL).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* ── Nav ─────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/60 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-sm">
              <ArrowLeft className="w-4 h-4" />
              Home
            </Link>
            <div className="h-4 w-px bg-slate-700" />
            <Link href="/" className="font-black text-lg">
              <span className="text-rose-500">ROSE</span>
              <span className="text-white">RAG</span>
            </Link>
          </div>
          <a
            href={APK_URL}
            className="hidden sm:inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors"
          >
            <Download className="w-4 h-4" />
            Download v{VERSION}
          </a>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-rose-950/30 via-transparent to-transparent" />
        <div className="absolute top-20 left-1/4 w-64 h-64 bg-rose-600/10 rounded-full blur-3xl" />
        <div className="absolute top-10 right-1/4 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl" />

        <div className="relative max-w-6xl mx-auto px-6 py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            <div>
              <div className="inline-flex items-center gap-2 bg-rose-500/10 border border-rose-500/25 rounded-full px-4 py-1.5 text-rose-400 text-xs font-semibold mb-6">
                <Smartphone className="w-3.5 h-3.5" />
                Android — Free Download
              </div>

              <h1 className="text-5xl lg:text-6xl font-black leading-[1.05] mb-6">
                RoseRAG
                <br />
                <span className="text-rose-500">for Android</span>
              </h1>

              <p className="text-lg text-slate-300 leading-relaxed mb-10 max-w-lg">
                Your institution&apos;s entire AI knowledge base — in your pocket.
                Search documents, get cited answers, and conduct research from anywhere.
              </p>

              {/* Download buttons */}
              <div className="flex flex-wrap gap-3 mb-8">
                <a
                  href={APK_URL}
                  className="inline-flex items-center gap-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold px-7 py-3.5 rounded-2xl text-base transition-all hover:scale-105 shadow-lg shadow-rose-900/40"
                >
                  <Download className="w-5 h-5" />
                  Download APK  <span className="text-rose-200 font-normal text-sm">v{VERSION}</span>
                </a>
                <a
                  href={RELEASES_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-white/8 hover:bg-white/12 border border-white/10 text-slate-300 font-medium px-6 py-3.5 rounded-2xl transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  All Releases
                </a>
              </div>

              {/* Meta */}
              <div className="flex flex-wrap gap-5 text-sm text-slate-500">
                {[
                  "Android 7.0+",
                  "~15 MB",
                  "Free forever",
                  "Open source",
                ].map((t) => (
                  <span key={t} className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Phone preview */}
            <div className="flex justify-center lg:justify-end">
              <PhoneMockup />
            </div>
          </div>
        </div>
      </section>

      {/* ── App card ────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 pb-16">
        <div className="bg-slate-900 border border-slate-700/60 rounded-3xl p-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">

            {/* Icon */}
            <div className="shrink-0 w-24 h-24 rounded-[1.5rem] bg-gradient-to-br from-rose-500 to-rose-800 flex items-center justify-center shadow-2xl shadow-rose-950">
              <span className="text-white font-black text-3xl tracking-tight">RR</span>
            </div>

            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                <h2 className="text-xl font-bold">RoseRAG</h2>
                <span className="inline-flex items-center gap-1 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium px-2.5 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  Latest release
                </span>
              </div>
              <p className="text-slate-400 text-sm mb-3">co.zw.chengetai.rag · v{VERSION} · Knowledge Operating System</p>

              {/* Direct link copy */}
              <div className="flex items-center gap-2 max-w-lg">
                <code className="flex-1 bg-slate-950 border border-slate-800 text-slate-400 text-xs px-3 py-2 rounded-xl overflow-x-auto whitespace-nowrap">
                  {APK_URL}
                </code>
                <button
                  onClick={copyLink}
                  className="shrink-0 flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs px-3 py-2 rounded-xl transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Install steps ───────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black mb-3">Install in 4 steps</h2>
          <p className="text-slate-400">No Play Store needed — sideload in under 2 minutes</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {STEPS.map((step) => (
            <div key={step.num} className="relative bg-slate-900 border border-slate-800 rounded-2xl p-6 group hover:border-rose-500/30 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-rose-600 flex items-center justify-center font-black text-lg">
                  {step.num}
                </div>
                <step.icon className="w-5 h-5 text-slate-600 group-hover:text-rose-500 transition-colors" />
              </div>
              <h3 className="font-bold mb-2">{step.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{step.desc}</p>
              {step.num < 4 && (
                <div className="hidden lg:block absolute top-10 -right-2 z-10">
                  <ArrowRight className="w-4 h-4 text-slate-700" />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── Security notice ─────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 pb-16">
        <div className="flex items-start gap-4 bg-amber-500/8 border border-amber-500/20 rounded-2xl p-5">
          <Shield className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-amber-300 font-semibold text-sm mb-1">Sideloaded APK — security note</p>
            <p className="text-amber-200/65 text-sm leading-relaxed">
              This APK is distributed outside the Google Play Store. It is built automatically from our{" "}
              <a href={`https://github.com/${REPO}`} target="_blank" rel="noopener noreferrer" className="underline text-amber-300/80 hover:text-amber-300">
                open-source repository
              </a>{" "}
              via GitHub Actions. You can verify the SHA-256 checksum of every release on the{" "}
              <a href={RELEASES_URL} target="_blank" rel="noopener noreferrer" className="underline text-amber-300/80 hover:text-amber-300">
                Releases page
              </a>
              .
            </p>
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black mb-3">Everything in your pocket</h2>
          <p className="text-slate-400">Full platform features, optimised for mobile</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map(({ icon: Icon, label, desc }) => (
            <div key={label} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-rose-500/25 transition-colors group">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/15 flex items-center justify-center mb-4 group-hover:bg-rose-500/15 transition-colors">
                <Icon className="w-5 h-5 text-rose-400" />
              </div>
              <p className="font-semibold mb-1.5">{label}</p>
              <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Requirements ────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h3 className="font-bold mb-5 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-rose-400" />
              System requirements
            </h3>
            <ul className="space-y-3">
              {[
                "Android 7.0 (Nougat) or later",
                "~15 MB free storage",
                "Internet connection for AI queries",
                "Camera (optional, for document scanning)",
              ].map((req) => (
                <li key={req} className="flex items-center gap-2.5 text-slate-300 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                  {req}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h3 className="font-bold mb-5 flex items-center gap-2">
              <Zap className="w-4 h-4 text-rose-400" />
              What&apos;s new in v{VERSION}
            </h3>
            <ul className="space-y-3">
              {[
                "Initial release — full web app wrapped in native shell",
                "DeepSeek AI for all chat and reasoning",
                "Jina AI semantic embeddings",
                "Dark-mode status bar and splash screen",
                "Native file picker for document uploads",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-slate-300 text-sm">
                  <span className="text-rose-400 mt-0.5 shrink-0">→</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="bg-gradient-to-br from-rose-950/60 to-slate-900 border border-rose-900/30 rounded-3xl p-10 text-center">
          <h2 className="text-3xl font-black mb-3">Ready to install?</h2>
          <p className="text-slate-400 mb-8 max-w-md mx-auto">
            Download the APK now and carry your institution&apos;s knowledge base everywhere.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <a
              href={APK_URL}
              className="inline-flex items-center gap-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold px-8 py-3.5 rounded-2xl transition-all hover:scale-105 shadow-lg shadow-rose-950"
            >
              <Download className="w-5 h-5" />
              Download APK — Free
            </a>
            <Link
              href="/app/dashboard"
              className="inline-flex items-center gap-2 bg-white/8 hover:bg-white/12 border border-white/10 text-slate-300 font-medium px-7 py-3.5 rounded-2xl transition-colors"
            >
              <Globe className="w-4 h-4" />
              Use Web App Instead
            </Link>
          </div>
          <p className="text-slate-600 text-xs mt-5">
            Web app available at{" "}
            <Link href="/" className="text-slate-500 hover:text-slate-400 underline">
              rag.chengetai.co.zw
            </Link>
          </p>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-800 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <div className="flex items-center gap-1 font-black text-base">
            <span className="text-rose-500">ROSE</span>
            <span className="text-white">RAG</span>
            <span className="text-slate-600 font-normal ml-2">© 2025</span>
          </div>
          <div className="flex gap-6">
            <Link href="/" className="hover:text-slate-300 transition-colors">Home</Link>
            <Link href="/app/dashboard" className="hover:text-slate-300 transition-colors">Web App</Link>
            <a href={`https://github.com/${REPO}`} target="_blank" rel="noopener noreferrer" className="hover:text-slate-300 transition-colors">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
