import { Component, inject, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ConfigService } from '../../core/services/config.service';
import { ApiService } from '../../core/services/api.service';
import { BrandConfig } from '../../core/models/api.models';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit, OnDestroy {
  private readonly configService = inject(ConfigService);
  private readonly apiService = inject(ApiService);
  private readonly destroy$ = new Subject<void>();

  brand: BrandConfig | null = null;
  isOnline = false;
  mobileOpen = false;

  readonly navLinks = [
    { path: '/ask',       label: 'Ask' },
    { path: '/browse',    label: 'Knowledge Base' },
    { path: '/bridge',    label: 'Bridge' },
    { path: '/graph',     label: 'Graph' },
    { path: '/analytics', label: 'Analytics' },
    { path: '/history',   label: 'History' },
    { path: '/copilot',   label: 'Copilot' }
  ];

  ngOnInit(): void {
    this.configService.brand$
      .pipe(takeUntil(this.destroy$))
      .subscribe(b => (this.brand = b));

    this.checkHealth();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private checkHealth(): void {
    this.apiService.checkHealth().subscribe({
      next: () => (this.isOnline = true),
      error: () => (this.isOnline = false)
    });
  }

  toggleMobile(): void {
    this.mobileOpen = !this.mobileOpen;
  }

  closeMobile(): void {
    this.mobileOpen = false;
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.mobileOpen = false;
  }
}
