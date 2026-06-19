import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { ApiService } from '../../core/services/api.service';
import { HistoryEntry } from '../../core/models/api.models';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.scss']
})
export class HistoryComponent implements OnInit, OnDestroy {
  private readonly api = inject(ApiService);
  private readonly destroy$ = new Subject<void>();

  entries: HistoryEntry[] = [];
  isLoading = false;
  error: string | null = null;
  expandedId: string | number | null = null;

  ngOnInit(): void {
    this.load();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  load(): void {
    this.isLoading = true;
    this.error = null;
    this.api.getHistory(50)
      .pipe(takeUntil(this.destroy$), finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (res) => (this.entries = res.entries),
        error: (err) => {
          this.error = err?.error?.detail ?? 'Failed to load history.';
        }
      });
  }

  toggle(id: string | number): void {
    this.expandedId = this.expandedId === id ? null : id;
  }

  isExpanded(id: string | number): boolean {
    return this.expandedId === id;
  }

  formatDate(iso: string): string {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } catch {
      return iso;
    }
  }

  trustClass(level: string): string {
    return `trust-badge-${(level || 'low').toUpperCase()}`;
  }

  scorePercent(score: number | undefined): string {
    if (score === undefined || score === null) return '—';
    return `${Math.round(score * 100)}%`;
  }
}
