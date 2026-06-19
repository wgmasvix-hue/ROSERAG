import {
  Component, inject, OnInit, OnDestroy,
  ViewChild, ElementRef, AfterViewChecked
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ApiService } from '../../core/services/api.service';
import { ConfigService } from '../../core/services/config.service';
import { AskResponse, Source, Trust, BrandConfig } from '../../core/models/api.models';

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  trust?: Trust;
  sources?: Source[];
}

interface QuickLink {
  label: string;
  query: string;
}

@Component({
  selector: 'app-ask',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './ask.component.html',
  styleUrls: ['./ask.component.scss']
})
export class AskComponent implements OnInit, OnDestroy, AfterViewChecked {
  private readonly api = inject(ApiService);
  private readonly configService = inject(ConfigService);
  private readonly destroy$ = new Subject<void>();

  @ViewChild('messagesEnd') private messagesEnd!: ElementRef;
  @ViewChild('queryTextarea') private queryTextarea!: ElementRef<HTMLTextAreaElement>;

  brand: BrandConfig | null = null;
  question = '';
  messages: ChatMessage[] = [];
  isLoading = false;
  error: string | null = null;
  showChat = false;
  private shouldScrollToBottom = false;

  readonly quickLinks: QuickLink[] = [
    { label: 'Key findings',      query: 'What are the key findings in the knowledge base?' },
    { label: 'Research policies', query: 'What research policies are documented?' },
    { label: 'Main themes',       query: 'What are the main themes across the documents?' },
    { label: 'Evidence review',   query: 'Summarise the strongest evidence available.' }
  ];

  get latestTrust(): Trust | undefined {
    const last = [...this.messages].reverse().find(m => m.role === 'assistant');
    return last?.trust;
  }

  get latestSources(): Source[] {
    const last = [...this.messages].reverse().find(m => m.role === 'assistant');
    return last?.sources ?? [];
  }

  trustBarWidth(score: number): string {
    return `${Math.round(score * 100)}%`;
  }

  trustClass(trust: Trust): string {
    return trust.trust_level.toLowerCase();
  }

  scorePercent(score: number): string {
    return `${Math.round(score * 100)}%`;
  }

  componentKeys(components: Record<string, number>): string[] {
    return Object.keys(components);
  }

  ngOnInit(): void {
    this.configService.brand$
      .pipe(takeUntil(this.destroy$))
      .subscribe(b => (this.brand = b));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  send(): void {
    const q = this.question.trim();
    if (!q || this.isLoading) return;

    this.showChat = true;
    this.error = null;
    this.messages.push({ role: 'user', text: q });
    this.question = '';
    this.isLoading = true;
    this.shouldScrollToBottom = true;

    this.api.ask(q).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: AskResponse) => {
        this.messages.push({
          role: 'assistant',
          text: res.answer,
          trust: res.trust,
          sources: res.sources
        });
        this.isLoading = false;
        this.shouldScrollToBottom = true;
        this.resetTextarea();
      },
      error: (err) => {
        this.error = err?.error?.detail ?? 'Failed to get a response. Please try again.';
        this.isLoading = false;
        this.shouldScrollToBottom = true;
      }
    });
  }

  useQuickLink(ql: QuickLink): void {
    this.question = ql.query;
    this.send();
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.send();
    }
  }

  autoResize(event: Event): void {
    const el = event.target as HTMLTextAreaElement;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 200) + 'px';
  }

  private resetTextarea(): void {
    if (this.queryTextarea?.nativeElement) {
      this.queryTextarea.nativeElement.style.height = 'auto';
    }
  }

  private scrollToBottom(): void {
    try {
      this.messagesEnd?.nativeElement?.scrollIntoView({ behavior: 'smooth' });
    } catch {}
  }

  clearChat(): void {
    this.messages = [];
    this.showChat = false;
    this.error = null;
  }
}
