import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { ApiService } from '../../core/services/api.service';
import { BridgePaper, BridgeSourceInfo } from '../../core/models/api.models';

interface SourceDef {
  id: string;
  label: string;
  icon: string;
  desc: string;
  enabled: boolean;
}

@Component({
  selector: 'app-bridge',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './bridge.component.html',
  styleUrls: ['./bridge.component.scss'],
})
export class BridgeComponent implements OnInit, OnDestroy {
  private readonly api = inject(ApiService);
  private readonly destroy$ = new Subject<void>();

  sources: SourceDef[] = [
    { id: 'arxiv',            label: 'arXiv',            icon: '📄', desc: 'Preprints',                enabled: true },
    { id: 'openalex',         label: 'OpenAlex',         icon: '🌍', desc: 'Open scholarly graph',     enabled: true },
    { id: 'semantic_scholar', label: 'Semantic Scholar', icon: '🔬', desc: 'AI/CS focused',            enabled: true },
    { id: 'dspace',           label: 'Local DSpace',     icon: '🏛️', desc: 'Institutional repository', enabled: false },
  ];

  selectedSources: Set<string> = new Set(['arxiv', 'openalex']);

  query = '';
  results: BridgePaper[] = [];
  isLoading = false;
  error: string | null = null;
  sourceErrors: Record<string, string> = {};
  hasSearched = false;

  importingIds = new Set<string>();
  importedIds = new Set<string>();
  importErrors: Record<string, string> = {};

  expandedAbstracts = new Set<string>();

  ngOnInit(): void {
    this.loadSources();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadSources(): void {
    this.api.getBridgeSources()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (serverSources: BridgeSourceInfo[]) => {
          // Merge server-side enabled flags (e.g. DSpace only enabled if configured)
          this.sources = this.sources.map(s => {
            const serverInfo = serverSources.find(ss => ss.id === s.id);
            return { ...s, enabled: serverInfo ? serverInfo.enabled : s.enabled };
          });
          // Remove dspace from selectedSources if not enabled
          if (!this.sources.find(s => s.id === 'dspace')?.enabled) {
            this.selectedSources.delete('dspace');
          }
        },
        error: () => {
          // Non-fatal: continue with defaults
        }
      });
  }

  get enabledSources(): SourceDef[] {
    return this.sources.filter(s => s.enabled);
  }

  isSourceSelected(id: string): boolean {
    return this.selectedSources.has(id);
  }

  toggleSource(id: string): void {
    const source = this.sources.find(s => s.id === id);
    if (!source?.enabled) return;
    if (this.selectedSources.has(id)) {
      this.selectedSources.delete(id);
    } else {
      this.selectedSources.add(id);
    }
  }

  get selectedSourcesArray(): string[] {
    return Array.from(this.selectedSources);
  }

  search(): void {
    if (!this.query.trim() || this.isLoading) return;
    if (this.selectedSources.size === 0) {
      this.error = 'Please select at least one source to search.';
      return;
    }

    this.isLoading = true;
    this.error = null;
    this.sourceErrors = {};
    this.results = [];
    this.hasSearched = true;

    this.api.bridgeSearch(this.query.trim(), this.selectedSourcesArray, 10)
      .pipe(takeUntil(this.destroy$), finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (res) => {
          this.results = res.results;
          this.sourceErrors = res.errors ?? {};
          if (Object.keys(this.sourceErrors).length > 0 && this.results.length === 0) {
            this.error = 'All sources returned errors. Please try again.';
          }
        },
        error: (err) => {
          this.error = err?.error?.detail ?? 'Search failed. Please try again.';
        }
      });
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.search();
    }
  }

  importPaper(paper: BridgePaper): void {
    if (this.importingIds.has(paper.id) || this.importedIds.has(paper.id)) return;

    this.importingIds.add(paper.id);
    delete this.importErrors[paper.id];

    this.api.bridgeImport(paper)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.importingIds.delete(paper.id))
      )
      .subscribe({
        next: () => {
          this.importedIds.add(paper.id);
        },
        error: (err) => {
          this.importErrors[paper.id] = err?.error?.detail ?? 'Import failed.';
        }
      });
  }

  toggleAbstract(id: string): void {
    if (this.expandedAbstracts.has(id)) {
      this.expandedAbstracts.delete(id);
    } else {
      this.expandedAbstracts.add(id);
    }
  }

  isAbstractExpanded(id: string): boolean {
    return this.expandedAbstracts.has(id);
  }

  formatAuthors(authors: string[]): string {
    if (!authors || authors.length === 0) return 'Unknown authors';
    if (authors.length <= 3) return authors.join(', ');
    return `${authors.slice(0, 3).join(', ')} +${authors.length - 3} more`;
  }

  get sourceErrorEntries(): { key: string; value: string }[] {
    return Object.entries(this.sourceErrors).map(([key, value]) => ({ key, value }));
  }

  trackByPaperId(_: number, paper: BridgePaper): string {
    return paper.id;
  }
}
