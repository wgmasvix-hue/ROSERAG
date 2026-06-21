"use client";

import { useState } from "react";
import {
  Layers, Plus, X, FileText, Search, Folder, Tag, ChevronRight,
  MoreHorizontal, Trash2, Edit3, Check, BookOpen, ArrowLeft,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type CollectionColor = "rose" | "blue" | "green" | "purple" | "amber";

interface CollectionDocument {
  id: string;
  title: string;
  type: "pdf" | "web" | "dataset" | "spreadsheet";
  addedAt: string;
}

interface Collection {
  id: string;
  name: string;
  description: string;
  color: CollectionColor;
  tags: string[];
  documentCount: number;
  createdAt: string;
  documents: CollectionDocument[];
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const AVAILABLE_DOCS: CollectionDocument[] = [
  { id: "d1", title: "FAO Food Security Report 2024", type: "pdf", addedAt: "2024-06-01" },
  { id: "d2", title: "Zimbabwe Agricultural Survey 2023", type: "pdf", addedAt: "2024-05-15" },
  { id: "d3", title: "SADC Policy Framework 2030", type: "pdf", addedAt: "2024-04-10" },
  { id: "d4", title: "Climate Adaptation Strategies — CGIAR", type: "pdf", addedAt: "2024-03-22" },
  { id: "d5", title: "Post-Harvest Loss Dataset 2022–2023", type: "dataset", addedAt: "2024-02-18" },
  { id: "d6", title: "ZIMSTAT Crop Production Stats", type: "dataset", addedAt: "2024-01-30" },
];

const INITIAL_COLLECTIONS: Collection[] = [
  {
    id: "c1",
    name: "Food Security Research",
    description: "Core documents and datasets on regional food security challenges and interventions.",
    color: "rose",
    tags: ["food security", "nutrition", "FAO"],
    documentCount: 14,
    createdAt: "2024-01-10",
    documents: [
      { id: "d1", title: "FAO Food Security Report 2024", type: "pdf", addedAt: "2024-06-01" },
      { id: "d5", title: "Post-Harvest Loss Dataset 2022–2023", type: "dataset", addedAt: "2024-02-18" },
    ],
  },
  {
    id: "c2",
    name: "Climate Adaptation",
    description: "Research on climate-resilient agriculture and adaptation strategies for smallholder farmers.",
    color: "blue",
    tags: ["climate", "adaptation", "resilience"],
    documentCount: 9,
    createdAt: "2024-02-05",
    documents: [
      { id: "d4", title: "Climate Adaptation Strategies — CGIAR", type: "pdf", addedAt: "2024-03-22" },
    ],
  },
  {
    id: "c3",
    name: "SADC Policy Briefs",
    description: "Official policy documents and frameworks from SADC member states.",
    color: "purple",
    tags: ["policy", "SADC", "governance"],
    documentCount: 7,
    createdAt: "2024-03-01",
    documents: [
      { id: "d3", title: "SADC Policy Framework 2030", type: "pdf", addedAt: "2024-04-10" },
    ],
  },
  {
    id: "c4",
    name: "Zimbabwe Country Data",
    description: "National-level agricultural statistics and survey data for Zimbabwe.",
    color: "green",
    tags: ["Zimbabwe", "statistics", "national"],
    documentCount: 5,
    createdAt: "2024-03-18",
    documents: [
      { id: "d2", title: "Zimbabwe Agricultural Survey 2023", type: "pdf", addedAt: "2024-05-15" },
      { id: "d6", title: "ZIMSTAT Crop Production Stats", type: "dataset", addedAt: "2024-01-30" },
    ],
  },
  {
    id: "c5",
    name: "Baseline Literature",
    description: "Foundational academic literature for the project's theoretical background.",
    color: "amber",
    tags: ["literature", "academic", "baseline"],
    documentCount: 18,
    createdAt: "2024-01-02",
    documents: [],
  },
];

const COLOR_OPTIONS: { key: CollectionColor; bg: string; icon: string; border: string }[] = [
  { key: "rose",   bg: "bg-rose-50",   icon: "text-rose-600",   border: "border-rose-400" },
  { key: "blue",   bg: "bg-blue-50",   icon: "text-blue-600",   border: "border-blue-400" },
  { key: "green",  bg: "bg-green-50",  icon: "text-green-600",  border: "border-green-400" },
  { key: "purple", bg: "bg-purple-50", icon: "text-purple-600", border: "border-purple-400" },
  { key: "amber",  bg: "bg-amber-50",  icon: "text-amber-600",  border: "border-amber-400" },
];

const DOC_TYPE_LABELS: Record<string, string> = {
  pdf: "PDF", web: "Web", dataset: "Dataset", spreadsheet: "Spreadsheet",
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// ─── Sub-components ───────────────────────────────────────────────────────────

function colorMeta(color: CollectionColor) {
  return COLOR_OPTIONS.find((c) => c.key === color) ?? COLOR_OPTIONS[0];
}

function CollectionCard({
  collection,
  onOpen,
  onDelete,
}: {
  collection: Collection;
  onOpen: () => void;
  onDelete: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { bg, icon } = colorMeta(collection.color);

  return (
    <div
      onClick={onOpen}
      className="card-hover p-5 flex flex-col gap-3 group relative cursor-pointer"
    >
      {/* Menu button */}
      <button
        onClick={(e) => { e.stopPropagation(); setMenuOpen((p) => !p); }}
        className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity z-10"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>
      {menuOpen && (
        <div
          className="absolute top-10 right-3 bg-white border border-slate-200 rounded-xl shadow-lg z-20 py-1 min-w-[140px]"
          onClick={(e) => e.stopPropagation()}
        >
          <button className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">
            <Edit3 className="w-3.5 h-3.5" /> Rename
          </button>
          <button
            onClick={() => { onDelete(); setMenuOpen(false); }}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </button>
        </div>
      )}

      {/* Icon + name */}
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
          <Folder className={`w-5 h-5 ${icon}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-slate-900 text-sm truncate">{collection.name}</h3>
          <p className="text-xs text-slate-400">{collection.documentCount} documents</p>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors flex-shrink-0" />
      </div>

      {/* Description */}
      <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{collection.description}</p>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5 mt-auto">
        {collection.tags.map((tag) => (
          <span key={tag} className="badge badge-blue">
            <Tag className="w-2.5 h-2.5 mr-0.5" />{tag}
          </span>
        ))}
      </div>

      <div className="text-xs text-slate-300 pt-1 border-t border-slate-100">
        Created {new Date(collection.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
      </div>
    </div>
  );
}

function NewCollectionForm({
  onSave,
  onCancel,
}: {
  onSave: (name: string, description: string, color: CollectionColor) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState<CollectionColor>("rose");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave(name.trim(), description.trim(), color);
  };

  return (
    <form onSubmit={handleSubmit} className="card p-5 border-2 border-rose-200 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-slate-800 text-sm">New Collection</h3>
        <button type="button" onClick={onCancel} className="text-slate-400 hover:text-slate-600">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1">Name</label>
        <input
          className="input text-sm"
          placeholder="e.g. Food Security Research"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
          maxLength={60}
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1">Description</label>
        <textarea
          className="input text-sm resize-none"
          rows={2}
          placeholder="What is this collection about?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={200}
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-2">Color</label>
        <div className="flex gap-2">
          {COLOR_OPTIONS.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => setColor(c.key)}
              className={`w-8 h-8 rounded-lg ${c.bg} border-2 flex items-center justify-center transition-all ${
                color === c.key ? c.border : "border-transparent"
              }`}
            >
              {color === c.key && <Check className={`w-3.5 h-3.5 ${c.icon}`} />}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={!name.trim()} className="btn-primary text-sm py-2 flex-1 justify-center disabled:opacity-50">
          <Plus className="w-4 h-4" /> Create Collection
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary text-sm py-2 px-4">
          Cancel
        </button>
      </div>
    </form>
  );
}

function AddDocumentModal({
  collection,
  onAdd,
  onClose,
}: {
  collection: Collection;
  onAdd: (docId: string) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const existing = new Set(collection.documents.map((d) => d.id));
  const filtered = AVAILABLE_DOCS.filter(
    (d) => !existing.has(d.id) && d.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="card w-full max-w-md p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900">Add Documents to "{collection.name}"</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            className="input pl-9 text-sm"
            placeholder="Search documents…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {filtered.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-6">No documents available to add.</p>
          )}
          {filtered.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-rose-200 hover:bg-rose-50/30 transition-colors group"
            >
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                <FileText className="w-4 h-4 text-slate-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{doc.title}</p>
                <p className="text-xs text-slate-400">{DOC_TYPE_LABELS[doc.type]}</p>
              </div>
              <button
                onClick={() => onAdd(doc.id)}
                className="btn-primary py-1 px-2.5 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Plus className="w-3 h-3" /> Add
              </button>
            </div>
          ))}
        </div>

        <div className="pt-1 border-t border-slate-100">
          <button onClick={onClose} className="btn-secondary w-full justify-center text-sm">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

function CollectionDetail({
  collection,
  onBack,
  onAddDocument,
  onRemoveDocument,
}: {
  collection: Collection;
  onBack: () => void;
  onAddDocument: () => void;
  onRemoveDocument: (docId: string) => void;
}) {
  const { bg, icon } = colorMeta(collection.color);

  return (
    <div className="space-y-5">
      {/* Back + header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="btn-secondary py-2 px-3 text-sm">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
          <Folder className={`w-5 h-5 ${icon}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-black text-slate-900">{collection.name}</h2>
          <p className="text-sm text-slate-500">{collection.description}</p>
        </div>
        <button onClick={onAddDocument} className="btn-primary text-sm">
          <Plus className="w-4 h-4" /> Add Documents
        </button>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2">
        {collection.tags.map((tag) => (
          <span key={tag} className="badge badge-blue text-xs">
            <Tag className="w-2.5 h-2.5 mr-0.5" />{tag}
          </span>
        ))}
      </div>

      {/* Documents */}
      {collection.documents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
            <BookOpen className="w-7 h-7 text-slate-400" />
          </div>
          <div>
            <h3 className="font-bold text-slate-700">No documents yet</h3>
            <p className="text-sm text-slate-400 mt-1">Add documents to this collection to get started.</p>
          </div>
          <button onClick={onAddDocument} className="btn-primary text-sm mt-1">
            <Plus className="w-4 h-4" /> Add Documents
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {collection.documents.map((doc) => (
            <div key={doc.id} className="card p-4 flex items-center gap-3 group hover:border-rose-200 transition-colors">
              <div className="w-9 h-9 rounded-lg bg-rose-50 flex items-center justify-center flex-shrink-0">
                <FileText className="w-4 h-4 text-rose-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{doc.title}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {DOC_TYPE_LABELS[doc.type]} · Added{" "}
                  {new Date(doc.addedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>
              <button
                onClick={() => onRemoveDocument(doc.id)}
                className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-50"
                title="Remove from collection"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>(INITIAL_COLLECTIONS);
  const [showNewForm, setShowNewForm] = useState(false);
  const [activeCollection, setActiveCollection] = useState<string | null>(null);
  const [showAddDocModal, setShowAddDocModal] = useState(false);
  const [filterQuery, setFilterQuery] = useState("");

  const openCollection = collections.find((c) => c.id === activeCollection);

  const filteredCollections = collections.filter(
    (c) =>
      c.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
      c.tags.some((t) => t.toLowerCase().includes(filterQuery.toLowerCase()))
  );

  const handleCreateCollection = async (name: string, description: string, color: CollectionColor) => {
    const newCol: Collection = {
      id: `c-${Date.now()}`,
      name,
      description,
      color,
      tags: [],
      documentCount: 0,
      createdAt: new Date().toISOString().split("T")[0],
      documents: [],
    };
    setCollections((prev) => [newCol, ...prev]);
    setShowNewForm(false);

    try {
      await fetch(`${API_BASE}/api/collections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, color }),
      });
    } catch {
      // optimistic update already applied; backend sync failed silently
    }
  };

  const handleDeleteCollection = (id: string) => {
    if (!confirm("Delete this collection? Documents will not be removed from the knowledge base.")) return;
    setCollections((prev) => prev.filter((c) => c.id !== id));
  };

  const handleAddDocument = (docId: string) => {
    if (!activeCollection) return;
    const doc = AVAILABLE_DOCS.find((d) => d.id === docId);
    if (!doc) return;
    setCollections((prev) =>
      prev.map((c) =>
        c.id === activeCollection
          ? { ...c, documents: [...c.documents, { ...doc, addedAt: new Date().toISOString().split("T")[0] }], documentCount: c.documentCount + 1 }
          : c
      )
    );
  };

  const handleRemoveDocument = (docId: string) => {
    if (!activeCollection) return;
    setCollections((prev) =>
      prev.map((c) =>
        c.id === activeCollection
          ? { ...c, documents: c.documents.filter((d) => d.id !== docId), documentCount: Math.max(0, c.documentCount - 1) }
          : c
      )
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {!activeCollection ? (
        <>
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black text-slate-900">Collections</h2>
              <p className="text-sm text-slate-500 mt-1">Organise your documents into curated research collections.</p>
            </div>
            <button onClick={() => { setShowNewForm((p) => !p); }} className="btn-primary">
              <Plus className="w-4 h-4" /> New Collection
            </button>
          </div>

          {/* New collection form */}
          {showNewForm && (
            <NewCollectionForm onSave={handleCreateCollection} onCancel={() => setShowNewForm(false)} />
          )}

          {/* Search filter */}
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              className="input pl-9 text-sm"
              placeholder="Filter collections…"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
            />
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-6 text-sm text-slate-500">
            <span>
              <span className="font-bold text-slate-900">{collections.length}</span> collections
            </span>
            <span>
              <span className="font-bold text-slate-900">
                {collections.reduce((a, c) => a + c.documentCount, 0)}
              </span>{" "}
              total documents
            </span>
          </div>

          {/* Grid */}
          {filteredCollections.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
                <Layers className="w-7 h-7 text-slate-400" />
              </div>
              <div>
                <h3 className="font-bold text-slate-700">No collections found</h3>
                <p className="text-sm text-slate-400 mt-1">Try a different search or create a new collection.</p>
              </div>
              <button onClick={() => setShowNewForm(true)} className="btn-primary text-sm mt-1">
                <Plus className="w-4 h-4" /> New Collection
              </button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredCollections.map((col) => (
                <CollectionCard
                  key={col.id}
                  collection={col}
                  onOpen={() => setActiveCollection(col.id)}
                  onDelete={() => handleDeleteCollection(col.id)}
                />
              ))}
            </div>
          )}
        </>
      ) : openCollection ? (
        <>
          <CollectionDetail
            collection={openCollection}
            onBack={() => setActiveCollection(null)}
            onAddDocument={() => setShowAddDocModal(true)}
            onRemoveDocument={handleRemoveDocument}
          />
          {showAddDocModal && (
            <AddDocumentModal
              collection={openCollection}
              onAdd={handleAddDocument}
              onClose={() => setShowAddDocModal(false)}
            />
          )}
        </>
      ) : null}
    </div>
  );
}
