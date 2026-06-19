export interface BrandConfig {
  institution_name: string;
  institution_tagline: string;
  brand_prefix: string;
  brand_suffix: string;
  brand_color_primary: string;
  brand_color_accent: string;
}

export interface Document {
  id: string;
  filename: string;
  pages: number;
  chunks: number;
  ingested_at: string;
  agent_tag?: string;
}

export interface Source {
  document: string;
  page: number;
  score: number;
  chunk: string;
}

export interface Trust {
  trust_level: 'HIGH' | 'MEDIUM' | 'LOW';
  trust_score: number;
  components: Record<string, number>;
}

export interface AskResponse {
  answer: string;
  sources: Source[];
  trust: Trust;
}

export interface AnalyticsData {
  documents: number;
  chunks: number;
  questions: number;
  avg_trust_score: number;
  topics: string[];
  entities: Record<string, number>;
  knowledge_graph: { nodes: number; edges: number };
}

export interface HistoryEntry {
  id: string;
  question: string;
  answer: string;
  trust_level: string;
  trust_score: number;
  asked_at: string;
  sources: Source[];
}

export interface GraphData {
  nodes: GraphNode[];
  stats: Record<string, number>;
}

export interface GraphNode {
  name: string;
  type: string;
  frequency: number;
}

export interface CopilotResponse {
  agent: string;
  agent_description: string;
  answer: string;
  reasoning_notes: string;
  trust: Trust;
  sources: Source[];
}

// ---- DSpace Bridge ----

export interface BridgePaper {
  id: string;
  title: string;
  authors: string[];
  abstract: string;
  year?: number;
  doi?: string;
  url: string;
  pdf_url?: string;
  source: string;
  open_access: boolean;
}

export interface BridgeSearchResponse {
  query: string;
  results: BridgePaper[];
  total: number;
  sources_searched: string[];
  errors: Record<string, string>;
}

export interface BridgeImportResponse {
  paper_id: string;
  document_id: string;
  filename: string;
  pages: number;
  chunks: number;
  message: string;
}

export interface BridgeSourceInfo {
  id: string;
  label: string;
  enabled: boolean;
  description: string;
}
