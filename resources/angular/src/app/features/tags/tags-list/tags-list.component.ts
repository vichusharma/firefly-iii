import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '@core/services/api.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TagCreateDialogComponent } from '../tag-create-dialog/tag-create-dialog.component';

interface Tag {
  id: string;
  name: string;
  description?: string | null;
  color: string;
}

@Component({
  selector: 'app-tags-list',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    TagCreateDialogComponent,
  ],
  template: `
    <div class="tags-container">
      <div class="tags-header">
        <div>
          <h1>Tags</h1>
          <p>Organize your transactions with labels and color-coded markers.</p>
        </div>
        <button mat-raised-button color="primary" (click)="createNewTag()">
          <mat-icon>add</mat-icon>
          New Tag
        </button>
      </div>

      <div *ngIf="loading" class="loading-container">
        <mat-spinner diameter="50"></mat-spinner>
        <p>Loading tags...</p>
      </div>

      <div *ngIf="!loading && tags.length === 0" class="no-data">
        <mat-icon class="no-data-icon">sell</mat-icon>
        <p>No tags found</p>
        <p class="hint">Create your first tag to categorize transactions faster.</p>
      </div>

      <div *ngIf="!loading && tags.length > 0" class="tags-grid">
        <mat-card *ngFor="let tag of tags; trackBy: trackByTagId" class="tag-card">
          <div class="tag-card-header">
            <div class="tag-title-group">
              <span class="tag-color-indicator" [style.background]="tag.color" aria-hidden="true"></span>
              <div>
                <h2>{{ tag.name }}</h2>
                <p class="tag-color-value">{{ tag.color }}</p>
              </div>
            </div>
            <button
              mat-icon-button
              color="warn"
              type="button"
              aria-label="Delete tag"
              (click)="deleteTag(tag)"
            >
              <mat-icon>delete</mat-icon>
            </button>
          </div>

          <p class="tag-description" [class.tag-description-empty]="!tag.description">
            {{ tag.description || 'No description provided for this tag.' }}
          </p>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .tags-container {
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      min-height: 100vh;
    }

    .tags-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      margin-bottom: 2rem;
      color: #f1f5f9;
    }

    .tags-header h1 {
      margin: 0;
      font-size: 2rem;
    }

    .tags-header p {
      margin: 0.5rem 0 0;
      color: #94a3b8;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 300px;
      gap: 1rem;
      color: #cbd5e1;
      font-size: 1.1rem;
    }

    .no-data {
      text-align: center;
      padding: 4rem 2rem;
      color: #94a3b8;
    }

    .no-data-icon {
      font-size: 3rem;
      width: 3rem;
      height: 3rem;
      color: #64748b;
      margin-bottom: 1rem;
    }

    .no-data p {
      margin: 0.5rem 0;
    }

    .no-data p.hint {
      font-size: 0.9rem;
      color: #64748b;
      font-style: italic;
    }

    .tags-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.5rem;
    }

    .tag-card {
      padding: 1.5rem !important;
      background: #1e293b;
      border-radius: 1.25rem;
      border: none;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
      color: #cbd5e1;
    }

    .tag-card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1rem;
      margin-bottom: 1rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }

    .tag-title-group {
      display: flex;
      align-items: center;
      gap: 0.875rem;
      min-width: 0;
    }

    .tag-title-group h2 {
      margin: 0;
      color: #f8fafc;
      font-size: 1.125rem;
      line-height: 1.3;
      word-break: break-word;
    }

    .tag-color-value {
      margin: 0.35rem 0 0;
      color: #94a3b8;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    .tag-color-indicator {
      width: 2.5rem;
      height: 2.5rem;
      border-radius: 999px;
      border: 2px solid rgba(255, 255, 255, 0.18);
      box-shadow: 0 0 0 4px rgba(15, 23, 42, 0.45);
      flex-shrink: 0;
    }

    .tag-description {
      margin: 0;
      line-height: 1.6;
      color: #cbd5e1;
      min-height: 3rem;
    }

    .tag-description-empty {
      color: #64748b;
      font-style: italic;
    }

    button[mat-icon-button][color='warn'] {
      color: #fca5a5;
      flex-shrink: 0;
    }

    @media (max-width: 768px) {
      .tags-container {
        padding: 1.25rem;
      }

      .tags-header {
        flex-direction: column;
        align-items: stretch;
      }

      .tags-header button {
        width: 100%;
      }
    }
  `],
})
export class TagsListComponent implements OnInit, OnDestroy {
  tags: Tag[] = [];
  loading = true;

  private readonly destroy$ = new Subject<void>();
  private readonly colorStorageKey = 'firefly.angular.tagColors';

  constructor(
    private apiService: ApiService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadTags();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadTags(): void {
    this.loading = true;
    this.apiService.get<any>('tags', { limit: 100 })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.tags = this.normalizeTags(response);
          this.loading = false;
        },
        error: (err) => {
          console.error('Error loading tags:', err);
          this.tags = [];
          this.loading = false;
        },
      });
  }

  createNewTag(): void {
    this.dialog.open(TagCreateDialogComponent, {
      width: '95%',
      maxWidth: '720px',
      panelClass: 'firefly-dialog-container',
      autoFocus: false,
    }).afterClosed().subscribe((result?: { color?: string; tag?: Partial<Tag> }) => {
      if (result?.color && result.tag?.name) {
        this.saveColorPreference(result.tag, result.color);
      }

      if (result) {
        this.loadTags();
      }
    });
  }

  deleteTag(tag: Tag): void {
    if (!confirm(`Are you sure you want to delete the tag "${tag.name}"?`)) {
      return;
    }

    this.apiService.delete(`tags/${tag.id}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.removeColorPreference(tag);
          this.loadTags();
        },
        error: (err) => {
          console.error('Error deleting tag:', err);
          alert('Error deleting tag');
        },
      });
  }

  trackByTagId(_: number, tag: Tag): string {
    return tag.id;
  }

  private normalizeTags(response: any): Tag[] {
    const items = Array.isArray(response?.data)
      ? response.data
      : Array.isArray(response?.data?.data)
        ? response.data.data
        : [];

    return items.map((item: any) => {
      const attributes = item?.attributes ?? item ?? {};
      const normalized: Tag = {
        id: String(item?.id ?? attributes.id ?? ''),
        name: String(attributes.tag ?? attributes.name ?? '').trim(),
        description: attributes.description ?? null,
        color: this.resolveTagColor(String(item?.id ?? attributes.id ?? ''), String(attributes.tag ?? attributes.name ?? '').trim()),
      };

      if (!normalized.name) {
        normalized.name = 'Untitled tag';
      }

      return normalized;
    });
  }

  private resolveTagColor(tagId: string, tagName: string): string {
    const savedColor = this.getColorPreference(tagId, tagName);
    return savedColor || this.deriveColor(tagName);
  }

  private getColorPreference(tagId: string, tagName: string): string | null {
    if (typeof localStorage === 'undefined') {
      return null;
    }

    try {
      const raw = localStorage.getItem(this.colorStorageKey);
      const colorMap = raw ? JSON.parse(raw) as Record<string, string> : {};
      return colorMap[this.getIdStorageKey(tagId)] || colorMap[this.getNameStorageKey(tagName)] || null;
    } catch {
      return null;
    }
  }

  private saveColorPreference(tag: Partial<Tag>, color: string): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    try {
      const raw = localStorage.getItem(this.colorStorageKey);
      const colorMap = raw ? JSON.parse(raw) as Record<string, string> : {};

      if (tag.id) {
        colorMap[this.getIdStorageKey(tag.id)] = color;
      }

      if (tag.name) {
        colorMap[this.getNameStorageKey(tag.name)] = color;
      }

      localStorage.setItem(this.colorStorageKey, JSON.stringify(colorMap));
    } catch {
      // Ignore storage errors.
    }
  }

  private removeColorPreference(tag: Tag): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    try {
      const raw = localStorage.getItem(this.colorStorageKey);
      const colorMap = raw ? JSON.parse(raw) as Record<string, string> : {};
      delete colorMap[this.getIdStorageKey(tag.id)];
      delete colorMap[this.getNameStorageKey(tag.name)];
      localStorage.setItem(this.colorStorageKey, JSON.stringify(colorMap));
    } catch {
      // Ignore storage errors.
    }
  }

  private getIdStorageKey(tagId: string): string {
    return `id:${tagId}`;
  }

  private getNameStorageKey(tagName: string): string {
    return `name:${tagName.trim().toLowerCase()}`;
  }

  private deriveColor(tagName: string): string {
    let hash = 0;
    const seed = tagName || 'tag';

    for (let i = 0; i < seed.length; i++) {
      hash = seed.charCodeAt(i) + ((hash << 5) - hash);
      hash |= 0;
    }

    const hue = Math.abs(hash) % 360;
    return this.hslToHex(hue, 68, 56);
  }

  private hslToHex(hue: number, saturation: number, lightness: number): string {
    const s = saturation / 100;
    const l = lightness / 100;
    const a = s * Math.min(l, 1 - l);
    const color = (n: number): string => {
      const k = (n + hue / 30) % 12;
      const channel = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * channel).toString(16).padStart(2, '0');
    };

    return `#${color(0)}${color(8)}${color(4)}`;
  }
}
