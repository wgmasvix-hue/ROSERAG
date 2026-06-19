import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { ApiService } from './api.service';
import { BrandConfig } from '../models/api.models';

const DEFAULT_CONFIG: BrandConfig = {
  institution_name: 'ROSERAG',
  institution_tagline: 'Institutional Research Intelligence',
  brand_prefix: 'ROSE',
  brand_suffix: 'RAG',
  brand_color_primary: '#9b2248',
  brand_color_accent: '#d44e72'
};

@Injectable({ providedIn: 'root' })
export class ConfigService {
  private readonly api = inject(ApiService);

  private readonly _brand$ = new BehaviorSubject<BrandConfig>(DEFAULT_CONFIG);
  readonly brand$: Observable<BrandConfig> = this._brand$.asObservable();

  get brand(): BrandConfig {
    return this._brand$.value;
  }

  load(): Observable<BrandConfig> {
    return this.api.getConfig().pipe(
      tap(config => {
        this._brand$.next(config);
        this.applyBrandColors(config);
        this.updateTitle(config);
      }),
      catchError(() => {
        this.applyBrandColors(DEFAULT_CONFIG);
        this.updateTitle(DEFAULT_CONFIG);
        return of(DEFAULT_CONFIG);
      })
    );
  }

  private applyBrandColors(config: BrandConfig): void {
    const root = document.documentElement;
    if (config.brand_color_primary) {
      root.style.setProperty('--brand-primary', config.brand_color_primary);
    }
    if (config.brand_color_accent) {
      root.style.setProperty('--brand-accent', config.brand_color_accent);
    }
  }

  private updateTitle(config: BrandConfig): void {
    document.title = `${config.brand_prefix}${config.brand_suffix} — ${config.institution_name}`;
  }
}
