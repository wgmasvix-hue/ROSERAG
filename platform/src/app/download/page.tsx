"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Smartphone,
  Download,
  Shield,
  CheckCircle2,
  ArrowLeft,
  ExternalLink,
  Wifi,
  BookOpen,
  Search,
  FileText,
} from "lucide-react";

const REPO = "wgmasvix-hue/roserag";
const VERSION = "1.0.0";

const steps = [
  {
    num: 1,
    title: "Download the APK",
    desc: 'Tap the "Download APK" button below to get the latest version.',
  },
  {
    num: 2,
    title: "Allow unknown sources",
    desc: 'Go to Settings → Security → "Install unknown apps" and allow your browser or Files app.',
  },
  {
    num: 3,
    title: "Install the file",
    desc: "Open the downloaded .apk file from your notifications or Downloads folder.",
  },
  {
    num: 4,
    title: "Launch RoseRAG",
    desc: "Find RoseRAG in your app drawer and tap to open. It connects to your institution's knowledge base automatically.",
  },
];

const features = [
  { icon: Search, label: "Semantic Search", desc: "AI-powered document discovery" },
  { icon: BookOpen, label: "Knowledge Notebooks", desc: "Save and organise your research" },
  { icon: FileText, label: "Document Ingestion", desc: "Upload PDFs, DOCX, and more" },
  { icon: Wifi, label: "Works Offline", desc: "Cached responses available offline" },
];

export default function DownloadPage() {
  const [copied, setCopied] = useState(false);

  const apkUrl = `https://github.com/${REPO}/releases/latest/download/RoseRAG-${VERSION}-debug.apk`;
  const releasesUrl = `https://github.com/${REPO}/releases/latest`;

  function copyLink() {
    navigator.clipboard.writeText(apkUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Nav */}
      <nav className="border-b border-slate-800 px-6 py-4 flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back</span>
        </Link>
        <div className="h-4 w-px bg-slate-700" />
        <span className="text-sm font-semibold">
          <span className="text-rose-500">ROSE</span>RAG
        </span>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-16">
        {/* Hero */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 rounded-full px-4 py-1.5 text-rose-400 text-sm font-medium mb-6">
            <Smartphone className="w-4 h-4" />
            Android App — v{VERSION}
          </div>
          <h1 className="text-5xl font-bold mb-4">
            RoseRAG for{" "}
            <span className="text-rose-500">Android</span>
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Your institution&apos;s AI knowledge base in your pocket. Search, query, and
            discover insights from anywhere.
          </p>
        </div>

        {/* Download card */}
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 mb-12">
          <div className="flex flex-col md:flex-row items-center gap-8">
            {/* App icon mockup */}
            <div className="shrink-0 w-28 h-28 rounded-3xl bg-gradient-to-br from-rose-600 to-rose-800 flex items-center justify-center shadow-2xl shadow-rose-900/50">
              <span className="text-4xl font-black tracking-tight">
                <span className="text-white">R</span>
                <span className="text-rose-200">R</span>
              </span>
            </div>

            <div className="flex-1 text-center md:text-left">
              <h2 className="text-2xl font-bold mb-1">RoseRAG</h2>
              <p className="text-slate-400 text-sm mb-1">co.zw.chengetai.rag</p>
              <div className="flex items-center justify-center md:justify-start gap-3 text-sm text-slate-500 mb-4">
                <span>Version {VERSION}</span>
                <span>·</span>
                <span>Android 7.0+</span>
                <span>·</span>
                <span>~15 MB</span>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                <a
                  href={apkUrl}
                  className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
                >
                  <Download className="w-5 h-5" />
                  Download APK
                </a>
                <a
                  href={releasesUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium px-6 py-3 rounded-xl transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  All Releases
                </a>
              </div>
            </div>
          </div>

          {/* Copy link */}
          <div className="mt-6 pt-6 border-t border-slate-800">
            <p className="text-xs text-slate-500 mb-2">Direct APK link</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-slate-950 text-slate-400 text-xs px-3 py-2 rounded-lg overflow-x-auto whitespace-nowrap">
                {apkUrl}
              </code>
              <button
                onClick={copyLink}
                className="shrink-0 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-3 py-2 rounded-lg transition-colors"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
        </div>

        {/* Security notice */}
        <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-12">
          <Shield className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-amber-300 font-medium text-sm">Sideloaded app — security note</p>
            <p className="text-amber-200/70 text-sm mt-1">
              This APK is distributed outside the Play Store. It is built directly from our open-source
              repository. You can verify the SHA-256 checksum on the{" "}
              <a href={releasesUrl} target="_blank" rel="noopener noreferrer" className="underline">
                Releases page
              </a>
              .
            </p>
          </div>
        </div>

        {/* Installation steps */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-8 text-center">How to install</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {steps.map((step) => (
              <div key={step.num} className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex gap-4">
                <div className="shrink-0 w-8 h-8 rounded-full bg-rose-600 flex items-center justify-center text-sm font-bold">
                  {step.num}
                </div>
                <div>
                  <p className="font-semibold mb-1">{step.title}</p>
                  <p className="text-slate-400 text-sm">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Features */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-8 text-center">What&apos;s included</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {features.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-center">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center mx-auto mb-3">
                  <Icon className="w-5 h-5 text-rose-400" />
                </div>
                <p className="font-semibold text-sm mb-1">{label}</p>
                <p className="text-slate-500 text-xs">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Requirements */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-12">
          <h3 className="font-semibold mb-4">System requirements</h3>
          <ul className="space-y-2">
            {[
              "Android 7.0 (Nougat) or later",
              "~15 MB free storage",
              "Internet connection for AI queries",
              "Camera permission (optional, for document scanning)",
            ].map((req) => (
              <li key={req} className="flex items-center gap-2 text-slate-400 text-sm">
                <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                {req}
              </li>
            ))}
          </ul>
        </div>

        {/* CTA */}
        <div className="text-center">
          <p className="text-slate-500 text-sm mb-4">
            Also available as a web app at{" "}
            <Link href="/app/dashboard" className="text-rose-400 hover:text-rose-300">
              rag.chengetai.co.zw
            </Link>
          </p>
          <Link
            href="/app/dashboard"
            className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-6 py-3 rounded-xl transition-colors text-sm font-medium"
          >
            Open Web App instead
          </Link>
        </div>
      </main>
    </div>
  );
}
