"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, BookOpen, Search, GitBranch, Bot, BarChart3,
  FolderOpen, Upload, Settings, ChevronLeft, ChevronRight, Bell,
  User, LogOut, HelpCircle, Layers, Menu, X, Building2
} from "lucide-react";

// ─── Nav config ─────────────────────────────────────────────────────────────

const NAV_SECTIONS = [
  {
    label: "Workspace",
    items: [
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/app/dashboard" },
      { id: "studio", label: "RoseRAG Studio", icon: BookOpen, href: "/app/studio" },
      { id: "search", label: "Hybrid Search", icon: Search, href: "/app/search" },
      { id: "collections", label: "Collections", icon: Layers, href: "/app/collections" },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { id: "copilot", label: "AI Copilot", icon: Bot, href: "/app/copilot" },
      { id: "graph", label: "Knowledge Graph", icon: GitBranch, href: "/app/graph" },
      { id: "analytics", label: "Analytics", icon: BarChart3, href: "/app/analytics" },
    ],
  },
  {
    label: "Data",
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
      className="flex flex-col bg-white border-r border-slate-200 transition-all duration-300 flex-shrink-0"
      style={{ width: collapsed ? 64 : 240 }}
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-slate-200 gap-3">
        <div className="w-8 h-8 rounded-lg bg-rose-600 flex items-center justify-center text-white font-black text-sm flex-shrink-0">
          R
        </div>
        {!collapsed && (
          <span className="font-black text-lg tracking-tight">
            <span className="text-rose-600">ROSE</span>
            <span className="text-slate-800">RAG</span>
          </span>
        )}
        <button
          onClick={onToggle}
          className="ml-auto p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 scrollbar-thin">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label} className="mb-2">
            {!collapsed && (
              <div className="section-label">{section.label}</div>
            )}
            {section.items.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`nav-item mx-2 mb-0.5 ${active ? "active" : ""}`}
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
      <div className="p-3 border-t border-slate-200">
        <div className={`flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer ${collapsed ? "justify-center" : ""}`}>
          <div className="w-7 h-7 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
            <User className="w-4 h-4 text-rose-600" />
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-slate-900 truncate">Researcher</div>
              <div className="text-[10px] text-slate-400 truncate">MUST University</div>
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
  const title = NAV_SECTIONS.flatMap((s) => s.items).find((i) => pathname.startsWith(i.href))?.label ?? "RoseRAG";

  return (
    <header className="h-16 flex items-center justify-between px-6 bg-white border-b border-slate-200 flex-shrink-0">
      <div className="flex items-center gap-3">
        <button className="md:hidden p-1.5 rounded-md hover:bg-slate-100" onClick={onMobileMenu}>
          <Menu className="w-5 h-5 text-slate-600" />
        </button>
        <h1 className="text-base font-bold text-slate-900">{title}</h1>
      </div>

      <div className="flex items-center gap-2">
        <button className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors relative">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-rose-500 rounded-full" />
        </button>
        <button className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors">
          <HelpCircle className="w-4 h-4" />
        </button>
        <div className="h-6 w-px bg-slate-200 mx-1" />
        <Link href="/" className="text-xs text-slate-500 hover:text-rose-600 transition-colors font-medium">
          ← Back to site
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
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 md:hidden transform transition-transform duration-300 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <Sidebar collapsed={false} onToggle={() => setMobileOpen(false)} />
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      </div>

      {/* Main */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar onMobileMenu={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
