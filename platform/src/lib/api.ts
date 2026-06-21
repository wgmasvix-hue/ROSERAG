import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
});

// Chat / Ask
export async function askQuestion(
  question: string,
  topK = 5
): Promise<{ answer: string; sources: unknown[]; confidence: number }> {
  const { data } = await api.post("/api/ask", { question, top_k: topK });
  return data;
}

// Documents
export async function listDocuments() {
  const { data } = await api.get("/api/documents");
  return data;
}

export async function uploadDocument(file: File, onProgress?: (p: number) => void) {
  const form = new FormData();
  form.append("file", file);
  const { data } = await api.post("/api/documents/upload", form, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (e) => {
      if (onProgress && e.total) onProgress(Math.round((e.loaded * 100) / e.total));
    },
  });
  return data;
}

export async function deleteDocument(id: string) {
  const { data } = await api.delete(`/api/documents/${id}`);
  return data;
}

// Search
export async function hybridSearch(query: string, filters?: Record<string, string>) {
  const { data } = await api.post("/api/search", { query, filters });
  return data;
}

// Analytics
export async function getAnalytics() {
  const { data } = await api.get("/api/analytics");
  return data;
}

// Knowledge Graph
export async function getKnowledgeGraph(query?: string) {
  const { data } = await api.get("/api/graph", { params: { q: query } });
  return data;
}

// Collections
export async function getCollections() {
  const { data } = await api.get("/api/collections");
  return data;
}

// History
export async function getChatHistory() {
  const { data } = await api.get("/api/history");
  return data;
}

// Stream ask
export async function* streamAsk(
  question: string,
  signal?: AbortSignal
): AsyncGenerator<{ type: string; content?: string; sources?: unknown[]; confidence?: number }> {
  const resp = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/ask/stream`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
      signal,
    }
  );
  if (!resp.ok || !resp.body) throw new Error("Stream failed");
  const reader = resp.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const parts = buf.split("\n\n");
    buf = parts.pop() || "";
    for (const part of parts) {
      const line = part.trim();
      if (!line.startsWith("data: ")) continue;
      const raw = line.slice(6);
      if (raw === "[DONE]") return;
      try {
        yield JSON.parse(raw);
      } catch {
        // skip malformed
      }
    }
  }
}

export default api;
