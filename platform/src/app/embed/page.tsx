"use client";

import { useState, FormEvent } from "react";

const SUGGESTIONS = [
  "climate-smart agriculture Zimbabwe",
  "food security sub-Saharan Africa",
  "renewable energy rural communities",
  "maternal health outcomes Zimbabwe",
  "smallholder farmer adaptation strategies",
];

const PLATFORM_URL = "https://rag.dare.co.zw";

export default function EmbedPage() {
  const [query, setQuery] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    window.open(
      `${PLATFORM_URL}/app/search?q=${encodeURIComponent(query.trim())}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  function pickSuggestion(q: string) {
    window.open(
      `${PLATFORM_URL}/app/search?q=${encodeURIComponent(q)}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  return (
    <div
      style={{
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        background: "linear-gradient(135deg, #0f0d1a 0%, #1a1028 50%, #0f1822 100%)",
        minHeight: "100vh",
        color: "#f1f0f7",
        padding: "0",
        margin: "0",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 20px 12px",
          borderBottom: "1px solid rgba(155,34,72,0.25)",
          background: "rgba(0,0,0,0.25)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 7,
              background: "linear-gradient(135deg, #9b2248, #d44e72)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
              fontWeight: 700,
              color: "#fff",
              flexShrink: 0,
            }}
          >
            C
          </div>
          <div>
            <span style={{ fontWeight: 700, fontSize: 13, color: "#fff", letterSpacing: "-0.01em" }}>
              ChengetAI Labs
            </span>
            <span
              style={{
                display: "block",
                fontSize: 10,
                color: "#9b8faa",
                lineHeight: 1.2,
                marginTop: 1,
              }}
            >
              AI layer · DARE Repository
            </span>
          </div>
        </div>
        <a
          href={PLATFORM_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: 11,
            color: "#d44e72",
            textDecoration: "none",
            fontWeight: 600,
            padding: "5px 10px",
            borderRadius: 6,
            border: "1px solid rgba(212,78,114,0.35)",
            transition: "all 0.15s",
            whiteSpace: "nowrap",
          }}
        >
          Open Platform ↗
        </a>
      </div>

      {/* Body */}
      <div style={{ flex: 1, padding: "20px 20px 16px", display: "flex", flexDirection: "column" }}>
        {/* Tagline */}
        <p
          style={{
            margin: "0 0 16px",
            fontSize: 13,
            color: "#b8afc8",
            lineHeight: 1.5,
          }}
        >
          Ask research questions across the DARE institutional repository —
          get cited, AI-powered answers in seconds.
        </p>

        {/* Search form */}
        <form onSubmit={handleSubmit} style={{ marginBottom: 16 }}>
          <div
            style={{
              display: "flex",
              gap: 8,
              background: "rgba(255,255,255,0.06)",
              border: "1.5px solid rgba(155,34,72,0.4)",
              borderRadius: 10,
              padding: "4px 4px 4px 12px",
              transition: "border-color 0.15s",
            }}
          >
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search DARE research with AI…"
              style={{
                flex: 1,
                background: "none",
                border: "none",
                outline: "none",
                color: "#f1f0f7",
                fontSize: 13,
                padding: "6px 0",
              }}
            />
            <button
              type="submit"
              style={{
                background: "linear-gradient(135deg, #9b2248, #c43060)",
                color: "#fff",
                border: "none",
                borderRadius: 7,
                padding: "8px 16px",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              Search
            </button>
          </div>
        </form>

        {/* Suggested queries */}
        <div style={{ marginBottom: 16 }}>
          <p style={{ margin: "0 0 8px", fontSize: 11, color: "#7a6e8a", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Try asking
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => pickSuggestion(s)}
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 7,
                  color: "#c8bfd8",
                  fontSize: 12,
                  padding: "7px 12px",
                  textAlign: "left",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span style={{ color: "#9b2248", fontSize: 14, lineHeight: 1 }}>›</span>
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* DARE badge */}
        <div
          style={{
            marginTop: "auto",
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 12px",
            background: "rgba(180,130,0,0.08)",
            border: "1px solid rgba(180,130,0,0.2)",
            borderRadius: 8,
          }}
        >
          <span style={{ fontSize: 14 }}>🔒</span>
          <span style={{ fontSize: 11, color: "#c8a84b", lineHeight: 1.4 }}>
            Searches run across{" "}
            <a
              href="https://dspace.dare.co.zw"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#d4a820", fontWeight: 600, textDecoration: "none" }}
            >
              dspace.dare.co.zw
            </a>
            {" "}— public read access · DSpace 8.1
          </span>
        </div>
      </div>
    </div>
  );
}
