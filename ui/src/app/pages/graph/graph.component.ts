import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { ApiService } from '../../core/services/api.service';
import { GraphData, GraphNode } from '../../core/models/api.models';

interface StatPill {
  type: string;
  count: number;
  label: string;
}

@Component({
  selector: 'app-graph',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './graph.component.html',
  styleUrls: ['./graph.component.scss']
})
export class GraphComponent implements OnInit, OnDestroy {
  private readonly api = inject(ApiService);
  private readonly destroy$ = new Subject<void>();

  graphData: GraphData | null = null;
  isLoading = false;
  error: string | null = null;
  selectedType = 'all';

  readonly entityTypes = [
    { value: 'all',          label: 'All Types' },
    { value: 'ORGANIZATION', label: 'Organizations' },
    { value: 'PERSON',       label: 'People' },
    { value: 'LOCATION',     label: 'Locations' },
    { value: 'CONCEPT',      label: 'Concepts' },
    { value: 'DATE',         label: 'Dates' }
  ];

  get filteredNodes(): GraphNode[] {
    if (!this.graphData) return [];
    if (this.selectedType === 'all') return this.graphData.nodes;
    return this.graphData.nodes.filter(n => n.type === this.selectedType);
  }

  get statPills(): StatPill[] {
    if (!this.graphData?.stats) return [];
    return Object.entries(this.graphData.stats).map(([type, count]) => ({
      type,
      count,
      label: this.typeLabel(type)
    }));
  }

  get totalNodes(): number {
    return this.graphData?.nodes?.length ?? 0;
  }

  typeLabel(type: string): string {
    const found = this.entityTypes.find(t => t.value === type);
    return found ? found.label : type;
  }

  typeBadgeClass(type: string): string {
    return `type-${type}`;
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

    const type = this.selectedType !== 'all' ? this.selectedType : undefined;
    this.api.getGraph(type)
      .pipe(takeUntil(this.destroy$), finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (data) => (this.graphData = data),
        error: (err) => {
          this.error = err?.error?.detail ?? 'Failed to load graph data.';
        }
      });
  }

  onTypeChange(): void {
    this.load();
  }
}
