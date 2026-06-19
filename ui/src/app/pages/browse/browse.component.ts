import { Component, inject, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { ApiService } from '../../core/services/api.service';
import { Document } from '../../core/models/api.models';

@Component({
  selector: 'app-browse',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './browse.component.html',
  styleUrls: ['./browse.component.scss']
})
export class BrowseComponent implements OnInit, OnDestroy {
  private readonly api = inject(ApiService);
  private readonly destroy$ = new Subject<void>();

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  documents: Document[] = [];
  isLoading = false;
  isUploading = false;
  uploadMessage: string | null = null;
  uploadError: string | null = null;
  loadError: string | null = null;
  deleteConfirmId: string | null = null;
  isDeleting = false;

  ngOnInit(): void {
    this.loadDocuments();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDocuments(): void {
    this.isLoading = true;
    this.loadError = null;

    this.api.getDocuments()
      .pipe(takeUntil(this.destroy$), finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (res) => (this.documents = res.documents),
        error: (err) => {
          this.loadError = err?.error?.detail ?? 'Failed to load documents.';
        }
      });
  }

  triggerUpload(): void {
    this.fileInput?.nativeElement.click();
  }

  readonly ACCEPTED = '.pdf,.txt,.md,.docx,.csv,.json,.html,.htm';
  readonly SUPPORTED_EXT = new Set(['.pdf','.txt','.md','.docx','.csv','.json','.html','.htm']);

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    if (!this.SUPPORTED_EXT.has(ext)) {
      this.uploadError = `Unsupported file type "${ext}". Supported: PDF, TXT, MD, DOCX, CSV, JSON, HTML`;
      return;
    }

    this.uploadFile(file);
    input.value = '';
  }

  private uploadFile(file: File): void {
    this.isUploading = true;
    this.uploadMessage = null;
    this.uploadError = null;

    this.api.uploadDocument(file)
      .pipe(takeUntil(this.destroy$), finalize(() => (this.isUploading = false)))
      .subscribe({
        next: (res) => {
          this.uploadMessage = res.message ?? `"${file.name}" uploaded successfully.`;
          this.loadDocuments();
        },
        error: (err) => {
          this.uploadError = err?.error?.detail ?? 'Upload failed. Please try again.';
        }
      });
  }

  confirmDelete(id: string): void {
    this.deleteConfirmId = id;
  }

  cancelDelete(): void {
    this.deleteConfirmId = null;
  }

  deleteDocument(id: string): void {
    this.isDeleting = true;

    this.api.deleteDocument(id)
      .pipe(takeUntil(this.destroy$), finalize(() => (this.isDeleting = false)))
      .subscribe({
        next: () => {
          this.deleteConfirmId = null;
          this.documents = this.documents.filter(d => d.id !== id);
        },
        error: (err) => {
          this.loadError = err?.error?.detail ?? 'Delete failed.';
          this.deleteConfirmId = null;
        }
      });
  }

  formatDate(iso: string): string {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleDateString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric'
      });
    } catch {
      return iso;
    }
  }

  dismissUploadMessage(): void {
    this.uploadMessage = null;
  }

  dismissUploadError(): void {
    this.uploadError = null;
  }
}
