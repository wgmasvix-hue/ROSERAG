export interface Source {
  id: string;
  title: string;
  url?: string;
  repository?: string;
  author?: string;
  date?: string;
  excerpt?: string;
  score?: number;
  type: "document" | "url" | "api" | "repository";
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  confidence?: number;
  reasoning?: string;
  timestamp: Date;
  isStreaming?: boolean;
}

export interface Notebook {
  id: string;
  title: string;
  description?: string;
  type: "research" | "teaching" | "project" | "personal";
  sourceCount: number;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
}

export interface Document {
  id: string;
  title: string;
  filename: string;
  fileType: string;
  fileSize: number;
  status: "processing" | "ready" | "error";
  chunkCount?: number;
  createdAt: string;
  repository?: string;
  author?: string;
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  documentCount: number;
  color: string;
  icon?: string;
  createdAt: string;
  tags?: string[];
}

export interface SearchResult {
  id: string;
  title: string;
  excerpt: string;
  score: number;
  source: Source;
  metadata: Record<string, unknown>;
}

export interface KnowledgeGraphNode {
  id: string;
  label: string;
  type: "concept" | "entity" | "document" | "author" | "institution";
  weight?: number;
  x?: number;
  y?: number;
}

export interface KnowledgeGraphEdge {
  source: string;
  target: string;
  label?: string;
  weight?: number;
}

export interface DashboardStats {
  documentsIndexed: number;
  sourcesConnected: number;
  collections: number;
  queries: number;
  verifiedAnswers: number;
  activeCopilots: number;
  trustScore: number;
  storageUsed: number;
}

export interface AnalyticsPoint {
  date: string;
  queries: number;
  documents: number;
  users?: number;
}

export interface TrustAssessment {
  score: number;
  level: "high" | "medium" | "low";
  factors: {
    sourceQuality: number;
    citationDensity: number;
    consistency: number;
    recency: number;
  };
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: "admin" | "researcher" | "librarian" | "student";
  institution?: string;
  createdAt: string;
}

export interface Connector {
  id: string;
  name: string;
  type: string;
  logo: string;
  status: "connected" | "disconnected" | "error";
  documentCount?: number;
  lastSync?: string;
  description: string;
}

export interface CopilotAgent {
  id: string;
  name: string;
  type: "student" | "teacher" | "research" | "librarian" | "institutional";
  description: string;
  capabilities: string[];
  icon: string;
  color: string;
}

export type ViewId =
  | "dashboard"
  | "studio"
  | "search"
  | "graph"
  | "copilot"
  | "analytics"
  | "collections"
  | "ingestion"
  | "dspace"
  | "settings";
