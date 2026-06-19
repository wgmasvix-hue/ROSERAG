import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { ApiService } from '../../core/services/api.service';
import { AnalyticsData } from '../../core/models/api.models';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.scss']
})
export class AnalyticsComponent implements OnInit, OnDestroy {
  private readonly api = inject(ApiService);
  private readonly destroy$ = new Subject<void>();

  data: AnalyticsData | null = null;
  isLoading = false;
  error: string | null = null;

  get entityEntries(): { key: string; value: number }[] {
    if (!this.data?.entities) return [];
    return Object.entries(this.data.entities).map(([key, value]) => ({ key, value }))
      .sort((a, b) => b.value - a.value);
  }

  get avgTrustPercent(): string {
    return `${Math.round((this.data?.avg_trust_score ?? 0) * 100)}%`;
  }

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
    this.api.getAnalytics()
      .pipe(takeUntil(this.destroy$), finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (d) => (this.data = d),
        error: (err) => {
          this.error = err?.error?.detail ?? 'Failed to load analytics.';
        }
      });
  }
}
