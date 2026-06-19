import { Component, inject, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { ApiService } from '../../core/services/api.service';
import { CopilotResponse, Document, Source, Trust } from '../../core/models/api.models';

export interface AgentDef {
  id: string;
  label: string;
  icon: string;
  description: string;
  color: string;
}

@Component({
  selector: 'app-copilot',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './copilot.component.html',
  styleUrls: ['./copilot.component.scss']
})
export class CopilotComponent implements OnInit, OnDestroy {
  private readonly api = inject(ApiService);
  private readonly destroy$ = new Subject<void>();

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  readonly agents: AgentDef[] = [
    { id: 'research',   label: 'Research',   icon: '🔬', description: 'Deep literature analysis and evidence synthesis', color: '#3b82f6' },
    { id: 'librarian',  label: 'Librarian',  icon: '📚', description: 'Document discovery and reference management',    color: '#8b5cf6' },
    { id: 'policy',     label: 'Policy',     icon: '📋', description: 'Policy interpretation and compliance guidance',  color: '#f59e0b' },
    { id: 'compliance', label: 'Compliance', icon: '✅', description: 'Regulatory checks and audit trail support',      color: '#10b981' },
    { id: 'executive',  label: 'Executive',  icon: '📊', description: 'Strategic summaries and decision support',       color: '#ef4444' },
  ];

  selectedAgent: AgentDef = this.agents[0];
  question = '';
  result: CopilotResponse | null = null;
  isLoading = false;
  error: string | null = null;

  // Per-agent document management
  agentDocs: Document[] = [];
  isLoadingDocs = false;
  isUploading = false;
  uploadMessage: string | null = null;
  uploadError: string | null = null;
  showDocs = false;
  deleteConfirmId: string | null = null;
  isDeleting = false;

  readonly ACCEPTED = '.pdf,.txt,.md,.docx,.csv,.json,.html,.htm';
  readonly SUPPORTED_EXT = new Set(['.pdf','.txt','.md','.docx','.csv','.json','.html','.htm']);

  ngOnInit(): void {
    this.loadAgentDocs();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  selectAgent(agent: AgentDef): void {
    this.selectedAgent = agent;
    this.result = null;
    this.error = null;
    this.uploadMessage = null;
    this.uploadError = null;
    this.loadAgentDocs();
  }

  submit(): void {
    const q = this.question.trim();
    if (!q || this.isLoading) return;
    this.isLoading = true;
    this.error = null;
    this.result = null;

    this.api.queryCopilot(q, this.selectedAgent.id)
      .pipe(takeUntil(this.destroy$), finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (res) => (this.result = res),
        error: (err) => {
          this.error = err?.error?.detail ?? 'The copilot agent failed to respond.';
        }
      });
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.submit();
    }
  }

  scorePercent(score: number): string {
    return `${Math.round(score * 100)}%`;
  }

  trustClass(trust: Trust): string {
    return trust.trust_level.toLowerCase();
  }

  // ── Per-agent document management ─────────────────────────────────────────

  loadAgentDocs(): void {
    this.isLoadingDocs = true;
    this.api.getDocuments(this.selectedAgent.id)
      .pipe(takeUntil(this.destroy$), finalize(() => (this.isLoadingDocs = false)))
      .subscribe({
        next: (res) => (this.agentDocs = res.documents),
        error: () => (this.agentDocs = [])
      });
  }

  triggerUpload(): void {
    this.fileInput?.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    if (!this.SUPPORTED_EXT.has(ext)) {
      this.uploadError = `Unsupported type "${ext}". Supported: PDF, TXT, MD, DOCX, CSV, JSON, HTML`;
      return;
    }

    this.isUploading = true;
    this.uploadMessage = null;
    this.uploadError = null;

    this.api.uploadDocument(file, this.selectedAgent.id)
      .pipe(takeUntil(this.destroy$), finalize(() => (this.isUploading = false)))
      .subscribe({
        next: () => {
          this.uploadMessage = `"${file.name}" added to ${this.selectedAgent.label} knowledge base.`;
          this.loadAgentDocs();
        },
        error: (err) => {
          this.uploadError = err?.error?.detail ?? 'Upload failed.';
        }
      });

    input.value = '';
  }

  confirmDelete(id: string): void {
    this.deleteConfirmId = id;
  }

  cancelDelete(): void {
    this.deleteConfirmId = null;
  }

  deleteDoc(id: string): void {
    this.isDeleting = true;
    this.api.deleteDocument(id)
      .pipe(takeUntil(this.destroy$), finalize(() => (this.isDeleting = false)))
      .subscribe({
        next: () => {
          this.deleteConfirmId = null;
          this.agentDocs = this.agentDocs.filter(d => d.id !== id);
        },
        error: () => {
          this.deleteConfirmId = null;
        }
      });
  }

  formatDate(iso: string): string {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch { return iso; }
  }
}
