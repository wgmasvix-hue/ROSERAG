"use client";

import { useState } from "react";
import {
  Settings, Key, Database, Bell, Shield, Users, Building2,
  CheckCircle, AlertCircle, Zap, Globe, Cpu, Save, Eye, EyeOff
} from "lucide-react";

const TABS = [
  { id: "general", label: "General", icon: Settings },
  { id: "api", label: "API Keys", icon: Key },
  { id: "connectors", label: "Connectors", icon: Database },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security & RBAC", icon: Shield },
  { id: "team", label: "Team", icon: Users },
];

const CONNECTORS_LIST = [
  { id: "dspace", name: "DSpace", emoji: "📚", desc: "Academic institutional repository", category: "Repository", configured: true },
  { id: "koha", name: "Koha", emoji: "📖", desc: "Library management system", category: "Library", configured: false },
  { id: "openalexapi", name: "OpenAlex", emoji: "🔬", desc: "Open research metadata API", category: "Academic", configured: true },
  { id: "pubmed", name: "PubMed", emoji: "🧬", desc: "Biomedical literature database", category: "Academic", configured: false },
  { id: "semantic", name: "Semantic Scholar", emoji: "📑", desc: "AI-powered research discovery", category: "Academic", configured: false },
  { id: "gdrive", name: "Google Drive", emoji: "📁", desc: "Cloud file storage", category: "Storage", configured: true },
  { id: "onedrive", name: "OneDrive", emoji: "🗂️", desc: "Microsoft cloud storage", category: "Storage", configured: false },
  { id: "notion", name: "Notion", emoji: "📝", desc: "Knowledge management workspace", category: "Productivity", configured: false },
];

const ROLES = [
  { name: "Admin", perms: ["All permissions"], color: "bg-red-100 text-red-700" },
  { name: "Researcher", perms: ["Read", "Write", "Search", "Copilot"], color: "bg-blue-100 text-blue-700" },
  { name: "Librarian", perms: ["Read", "Write", "Manage connectors"], color: "bg-purple-100 text-purple-700" },
  { name: "Student", perms: ["Read", "Search", "Copilot (limited)"], color: "bg-green-100 text-green-700" },
  { name: "Viewer", perms: ["Read only"], color: "bg-slate-100 text-slate-700" },
];

function ShowHideInput({ label, value, placeholder }: { label: string; value: string; placeholder?: string }) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-700 mb-1.5">{label}</label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          defaultValue={value}
          placeholder={placeholder}
          className="input pr-10"
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

function GeneralTab() {
  return (
    <div className="space-y-6">
      <div className="card p-6">
        <h3 className="font-bold text-slate-900 mb-4">Workspace Settings</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Workspace Name</label>
            <input className="input" defaultValue="MUST University Research Hub" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Institution</label>
            <input className="input" defaultValue="Midlands State University" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Default Language</label>
            <select className="input">
              <option>English</option>
              <option>Shona</option>
              <option>Ndebele</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Default Top-K Results</label>
            <input className="input" type="number" defaultValue={5} />
          </div>
        </div>
        <button className="btn-primary mt-4">
          <Save className="w-4 h-4" /> Save Settings
        </button>
      </div>

      <div className="card p-6">
        <h3 className="font-bold text-slate-900 mb-1">LLM Provider</h3>
        <p className="text-xs text-slate-500 mb-4">Configure which AI provider powers your knowledge system</p>
        <div className="grid grid-cols-2 gap-3 mb-4">
          {["DeepSeek (Default)", "OpenAI", "Anthropic", "Ollama (Local)"].map((p) => (
            <label key={p} className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:border-rose-300 has-[:checked]:border-rose-500 has-[:checked]:bg-rose-50">
              <input type="radio" name="provider" className="accent-rose-600" defaultChecked={p.includes("DeepSeek")} />
              <span className="text-sm font-medium text-slate-700">{p}</span>
            </label>
          ))}
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Chat Model</label>
          <input className="input" defaultValue="deepseek-chat" />
        </div>
      </div>
    </div>
  );
}

function APIKeysTab() {
  return (
    <div className="card p-6 space-y-5">
      <h3 className="font-bold text-slate-900">API Configuration</h3>
      <ShowHideInput label="LLM API Key (DeepSeek / OpenAI)" value="sk-••••••••••••••••" />
      <ShowHideInput label="Embedding API Key (Jina AI)" value="jina_••••••••••••" />
      <ShowHideInput label="Qdrant API Key" value="eyJhbGci••••••••" />
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">Qdrant Host URL</label>
        <input className="input" defaultValue="https://your-cluster.qdrant.io" />
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">Supabase Project URL</label>
        <input className="input" defaultValue="https://your-project.supabase.co" />
      </div>
      <ShowHideInput label="Supabase Anon Key" value="eyJhbGci••••••••" />
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">Redis URL</label>
        <input className="input" defaultValue="redis://localhost:6379" />
      </div>
      <button className="btn-primary">
        <Save className="w-4 h-4" /> Save API Keys
      </button>
    </div>
  );
}

function ConnectorsTab() {
  const [configured, setConfigured] = useState<Record<string, boolean>>(
    Object.fromEntries(CONNECTORS_LIST.map((c) => [c.id, c.configured]))
  );
  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        {CONNECTORS_LIST.map((c) => (
          <div key={c.id} className="card p-4">
            <div className="flex items-start gap-3 mb-3">
              <span className="text-2xl">{c.emoji}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900 text-sm">{c.name}</span>
                  <span className={`badge ${configured[c.id] ? "badge-green" : "badge-amber"}`}>
                    {configured[c.id] ? "Connected" : "Not configured"}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{c.desc}</p>
                <span className="badge badge-blue mt-1">{c.category}</span>
              </div>
            </div>
            <button
              onClick={() => setConfigured((p) => ({ ...p, [c.id]: !p[c.id] }))}
              className={configured[c.id] ? "btn-secondary w-full justify-center !text-xs !py-1.5" : "btn-primary w-full justify-center !text-xs !py-1.5"}
            >
              {configured[c.id] ? "Disconnect" : "Connect"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function SecurityTab() {
  return (
    <div className="space-y-6">
      <div className="card p-6">
        <h3 className="font-bold text-slate-900 mb-4">Role-Based Access Control</h3>
        <div className="space-y-3">
          {ROLES.map((role) => (
            <div key={role.name} className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg">
              <span className={`badge ${role.color} min-w-[90px] justify-center`}>{role.name}</span>
              <div className="flex flex-wrap gap-2">
                {role.perms.map((p) => (
                  <span key={p} className="text-xs text-slate-600 bg-white border border-slate-200 rounded px-2 py-0.5">{p}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-6">
        <h3 className="font-bold text-slate-900 mb-4">Authentication</h3>
        <div className="space-y-3">
          {[
            { label: "Email / Password", enabled: true },
            { label: "Google OAuth", enabled: true },
            { label: "Microsoft OAuth", enabled: false },
            { label: "SAML SSO", enabled: false },
          ].map((m) => (
            <label key={m.label} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg cursor-pointer">
              <span className="text-sm font-medium text-slate-700">{m.label}</span>
              <input type="checkbox" defaultChecked={m.enabled} className="accent-rose-600 w-4 h-4" />
            </label>
          ))}
        </div>
      </div>

      <div className="card p-6">
        <h3 className="font-bold text-slate-900 mb-2">Audit Logs</h3>
        <p className="text-xs text-slate-500 mb-4">All user actions are logged for compliance</p>
        <div className="space-y-2">
          {[
            { user: "researcher@must.ac.zw", action: "Uploaded document", time: "2m ago" },
            { user: "admin@must.ac.zw", action: "Added DSpace connector", time: "1h ago" },
            { user: "student@must.ac.zw", action: "Queried knowledge base", time: "3h ago" },
          ].map((log, i) => (
            <div key={i} className="flex items-center gap-3 text-xs p-2.5 bg-slate-50 rounded-lg">
              <Shield className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <span className="font-medium text-slate-700">{log.user}</span>
              <span className="text-slate-400">·</span>
              <span className="text-slate-500 flex-1">{log.action}</span>
              <span className="text-slate-400 flex-shrink-0">{log.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("general");

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-black text-slate-900">Settings</h2>
        <p className="text-slate-500 text-sm mt-1">Configure your RoseRAG Knowledge Operating System</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar tabs */}
        <nav className="w-48 flex-shrink-0">
          <div className="space-y-0.5">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`nav-item w-full ${activeTab === tab.id ? "active" : ""}`}
              >
                <tab.icon className="w-4 h-4 flex-shrink-0" />
                {tab.label}
              </button>
            ))}
          </div>
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {activeTab === "general" && <GeneralTab />}
          {activeTab === "api" && <APIKeysTab />}
          {activeTab === "connectors" && <ConnectorsTab />}
          {activeTab === "security" && <SecurityTab />}
          {["notifications", "team"].includes(activeTab) && (
            <div className="card p-12 text-center">
              <div className="text-4xl mb-3">🚧</div>
              <h3 className="font-bold text-slate-900 mb-2">Coming Soon</h3>
              <p className="text-slate-500 text-sm">This section is under active development.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
