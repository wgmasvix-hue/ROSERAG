"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, BookOpen, Search, GitBranch, Bot, BarChart3,
  Upload, Settings, ChevronLeft, ChevronRight, Bell,
  User, HelpCircle, Layers, Menu, Plus, Database
} from "lucide-react";

// ─── Nav config ─────────────────────────────────────────────────────────────

const NAV_SECTIONS = [
  {
    label: "Notebooks",
    items: [
      { id: "notebooks", label: "My Notebooks", icon: BookOpen, href: "/app/notebook" },
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/app/dashboard" },
    ],
  },
  {
    label: "Knowledge",
    items: [
      { id: "search", label: "Hybrid Search", icon: Search, href: "/app/search" },
      { id: "graph", label: "Knowledge Graph", icon: GitBranch, href: "/app/graph" },
      { id: "collections", label: "Collections", icon: Layers, href: "/app/collections" },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { id: "copilot", label: "AI Copilot", icon: Bot, href: "/app/copilot" },
      { id: "analytics", label: "Analytics", icon: BarChart3, href: "/app/analytics" },
    ],
  },
  {
    label: "System",
    items: [
      { id: "ingestion", label: "Ingestion Hub", icon: Upload, href: "/app/ingestion" },
      { id: "settings", label: "Settings", icon: Settings, href: "/app/settings" },
    ],
  },
];

// ─── Sidebar ─────────────────────────────────────────────────────────────────

function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const pathname = usePathname();

  return (
    <aside
      className="flex flex-col bg-slate-950 border-r border-slate-800 transition-all duration-300 flex-shrink-0"
      style={{ width: collapsed ? 64 : 240 }}
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-slate-800 gap-3">
        <div className="w-8 h-8 rounded-lg bg-rose-600 flex items-center justify-center text-white font-black text-sm flex-shrink-0">
          R
        </div>
        {!collapsed && (
          <div className="flex flex-col min-w-0">
            <span className="font-black text-base tracking-tight leading-tight">
              <span className="text-rose-500">ROSE</span>
              <span className="text-white">RAG</span>
            </span>
            <span className="text-slate-500 text-[10px] font-medium tracking-wide">Knowledge OS</span>
          </div>
        )}
        <button
          onClick={onToggle}
          className="ml-auto p-1 rounded-md hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition-colors flex-shrink-0"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* New Notebook CTA */}
      {!collapsed && (
        <div className="px-3 pt-3">
          <Link
            href="/app/notebook"
            className="flex items-center gap-2 w-full bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold px-3 py-2.5 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4 flex-shrink-0" />
            <span>New Notebook</span>
          </Link>
        </div>
      )}
      {collapsed && (
        <div className="px-2 pt-3">
          <Link
            href="/app/notebook"
            className="flex items-center justify-center w-full bg-rose-600 hover:bg-rose-700 text-white py-2.5 rounded-lg transition-colors"
            title="New Notebook"
          >
            <Plus className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 scrollbar-thin">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label} className="mb-2">
            {!collapsed && (
              <div className="section-label" style={{ color: "#475569" }}>{section.label}</div>
            )}
            {section.items.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`flex items-center gap-2.5 mx-2 mb-0.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                    active
                      ? "bg-rose-500/15 text-rose-400 shadow-[inset_3px_0_0_#e11d48]"
                      : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                  }`}
                  title={collapsed ? item.label : undefined}
                >
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-slate-800">
        <div className={`flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800 cursor-pointer transition-colors ${collapsed ? "justify-center" : ""}`}>
          <div className="w-7 h-7 rounded-full bg-rose-900/60 border border-rose-700/40 flex items-center justify-center flex-shrink-0">
            <User className="w-3.5 h-3.5 text-rose-400" />
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-slate-200 truncate">Researcher</div>
              <div className="text-[10px] text-slate-500 truncate">MUST University</div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

// ─── Top bar ────────────────────────────────────────────────────────────────

function Topbar({ onMobileMenu }: { onMobileMenu: () => void }) {
  const pathname = usePathname();
  const allItems = NAV_SECTIONS.flatMap((s) => s.items);
  const title = allItems.find((i) => pathname === i.href || pathname.startsWith(i.href + "/"))?.label ?? "ROSERAG";

  return (
    <header className="h-14 flex items-center justify-between px-6 bg-slate-950 border-b border-slate-800 flex-shrink-0">
      <div className="flex items-center gap-3">
        <button className="md:hidden p-1.5 rounded-md hover:bg-slate-800 text-slate-400" onClick={onMobileMenu}>
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-sm font-bold text-slate-200">{title}</h1>
      </div>

      <div className="flex items-center gap-1.5">
        <button className="p-2 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition-colors relative">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-rose-500 rounded-full" />
        </button>
        <button className="p-2 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition-colors">
          <HelpCircle className="w-4 h-4" />
        </button>
        <div className="h-5 w-px bg-slate-800 mx-1" />
        <Link href="/" className="text-xs text-slate-500 hover:text-rose-400 transition-colors font-medium">
          ← Site
        </Link>
      </div>
    </header>
  );
}

// ─── Layout ─────────────────────────────────────────────────────────────────

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 md:hidden transform transition-transform duration-300 w-72 max-w-[85vw] ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <Sidebar collapsed={false} onToggle={() => setMobileOpen(false)} />
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      </div>

      {/* Main */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar onMobileMenu={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-auto bg-slate-950">
          {children}
        </main>
      </div>
    </div>
  );
}
