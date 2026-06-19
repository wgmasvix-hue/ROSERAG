import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  BrandConfig,
  Document,
  AskResponse,
  GraphData,
  AnalyticsData,
  HistoryEntry,
  CopilotResponse
} from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api';

  getConfig(): Observable<BrandConfig> {
    return this.http.get<BrandConfig>(`${this.base}/config`);
  }

  checkHealth(): Observable<{ status: string; documents: number }> {
    return this.http.get<{ status: string; documents: number }>(`${this.base}/health`);
  }

  ask(question: string): Observable<AskResponse> {
    return this.http.post<AskResponse>(`${this.base}/ask`, {
      question,
      top_k: 5
    });
  }

  getDocuments(agentTag?: string): Observable<{ documents: Document[] }> {
    const params: Record<string, string> = {};
    if (agentTag !== undefined && agentTag !== null) {
      params['agent_tag'] = agentTag;
    }
    return this.http.get<{ documents: Document[] }>(`${this.base}/documents`, { params });
  }

  uploadDocument(file: File, agentTag = ''): Observable<{ message: string; document_id: string }> {
    const form = new FormData();
    form.append('file', file);
    if (agentTag) {
      form.append('agent_tag', agentTag);
    }
    return this.http.post<{ message: string; document_id: string }>(
      `${this.base}/documents/upload`,
      form
    );
  }

  deleteDocument(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.base}/documents/${id}`);
  }

  getGraph(entityType?: string): Observable<GraphData> {
    const params: Record<string, string> = {};
    if (entityType && entityType !== 'all') {
      params['entity_type'] = entityType;
    }
    return this.http.get<GraphData>(`${this.base}/graph`, { params });
  }

  getAnalytics(): Observable<AnalyticsData> {
    return this.http.get<AnalyticsData>(`${this.base}/analytics`);
  }

  getHistory(limit = 30): Observable<{ entries: HistoryEntry[] }> {
    return this.http.get<{ entries: HistoryEntry[] }>(`${this.base}/history`, {
      params: { limit: limit.toString() }
    });
  }

  queryCopilot(question: string, agent: string): Observable<CopilotResponse> {
    return this.http.post<CopilotResponse>(`${this.base}/copilot/query`, {
      question,
      agent
    });
  }
}
