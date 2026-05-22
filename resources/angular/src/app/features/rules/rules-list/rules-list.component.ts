import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '@core/services/api.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { RuleCreateDialogComponent } from '../rule-create-dialog/rule-create-dialog.component';

interface Rule {
  id: string;
  title: string;
  description?: string | null;
  active: boolean;
}

@Component({
  selector: 'app-rules-list',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatIconModule,
    MatProgressSpinnerModule,
    RuleCreateDialogComponent,
  ],
  template: `
    <div class="rules-container">
      <div class="rules-header">
        <div>
          <h1>Rules</h1>
          <p>Create automation rules and keep an eye on their active status.</p>
        </div>
        <button mat-raised-button color="primary" (click)="createNewRule()">
          <mat-icon>add</mat-icon>
          New Rule
        </button>
      </div>

      <div *ngIf="loading" class="loading-container">
        <mat-spinner diameter="50"></mat-spinner>
        <p>Loading rules...</p>
      </div>

      <div *ngIf="!loading && rules.length === 0" class="no-data">
        <mat-icon class="no-data-icon">rule</mat-icon>
        <p>No rules found</p>
        <p class="hint">Create your first rule to start automating your workflow.</p>
      </div>

      <div *ngIf="!loading && rules.length > 0" class="rules-list">
        <mat-card *ngFor="let rule of rules; trackBy: trackByRuleId" class="rule-card">
          <div class="rule-card-header">
            <div>
              <h2>{{ rule.title }}</h2>
              <p class="rule-description" [class.rule-description-empty]="!rule.description">
                {{ rule.description || 'No description provided for this rule.' }}
              </p>
            </div>
            <mat-chip [class.active]="rule.active" [class.inactive]="!rule.active">
              {{ rule.active ? 'Active' : 'Inactive' }}
            </mat-chip>
          </div>

          <div class="rule-card-actions">
            <button mat-button color="warn" type="button" (click)="deleteRule(rule)">
              <mat-icon>delete</mat-icon>
              Delete
            </button>
          </div>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .rules-container {
      padding: 2rem;
      max-width: 1100px;
      margin: 0 auto;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      min-height: 100vh;
    }

    .rules-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      margin-bottom: 2rem;
      color: #f1f5f9;
    }

    .rules-header h1 {
      margin: 0;
      font-size: 2rem;
    }

    .rules-header p {
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

    .rules-list {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .rule-card {
      padding: 1.5rem !important;
      background: #1e293b;
      border-radius: 1.25rem;
      border: none;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
      color: #cbd5e1;
    }

    .rule-card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1rem;
    }

    .rule-card h2 {
      margin: 0;
      color: #f8fafc;
      font-size: 1.125rem;
      line-height: 1.3;
    }

    .rule-description {
      margin: 0.85rem 0 0;
      color: #cbd5e1;
      line-height: 1.6;
    }

    .rule-description-empty {
      color: #64748b;
      font-style: italic;
    }

    mat-chip {
      font-size: 0.75rem;
      height: 24px;
      padding: 0 8px !important;
      flex-shrink: 0;
    }

    mat-chip.active {
      background-color: rgba(34, 197, 94, 0.2) !important;
      color: #86efac !important;
    }

    mat-chip.inactive {
      background-color: rgba(239, 68, 68, 0.2) !important;
      color: #fca5a5 !important;
    }

    .rule-card-actions {
      display: flex;
      justify-content: flex-end;
      padding-top: 1rem;
      margin-top: 1rem;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
    }

    button[mat-button] {
      text-transform: uppercase;
      font-size: 0.75rem;
      color: #fca5a5;
    }

    button[mat-button]:hover {
      background-color: rgba(255, 255, 255, 0.05);
    }

    @media (max-width: 768px) {
      .rules-container {
        padding: 1.25rem;
      }

      .rules-header {
        flex-direction: column;
        align-items: stretch;
      }

      .rules-header button {
        width: 100%;
      }

      .rule-card-header {
        flex-direction: column;
      }
    }
  `],
})
export class RulesListComponent implements OnInit, OnDestroy {
  rules: Rule[] = [];
  loading = true;

  private readonly destroy$ = new Subject<void>();

  constructor(
    private apiService: ApiService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadRules();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadRules(): void {
    this.loading = true;
    this.apiService.get<any>('rules', { limit: 100 })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.rules = this.normalizeRules(response);
          this.loading = false;
        },
        error: (err) => {
          console.error('Error loading rules:', err);
          this.rules = [];
          this.loading = false;
        },
      });
  }

  createNewRule(): void {
    this.dialog.open(RuleCreateDialogComponent, {
      width: '95%',
      maxWidth: '720px',
      panelClass: 'firefly-dialog-container',
      autoFocus: false,
    }).afterClosed().subscribe((result) => {
      if (result) {
        this.loadRules();
      }
    });
  }

  deleteRule(rule: Rule): void {
    if (!confirm(`Are you sure you want to delete the rule "${rule.title}"?`)) {
      return;
    }

    this.apiService.delete(`rules/${rule.id}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loadRules();
        },
        error: (err) => {
          console.error('Error deleting rule:', err);
          alert('Error deleting rule');
        },
      });
  }

  trackByRuleId(_: number, rule: Rule): string {
    return rule.id;
  }

  private normalizeRules(response: any): Rule[] {
    const items = Array.isArray(response?.data)
      ? response.data
      : Array.isArray(response?.data?.data)
        ? response.data.data
        : [];

    return items.map((item: any) => {
      const attributes = item?.attributes ?? item ?? {};
      return {
        id: String(item?.id ?? attributes.id ?? ''),
        title: String(attributes.title ?? '').trim() || 'Untitled rule',
        description: attributes.description ?? null,
        active: Boolean(attributes.active),
      } as Rule;
    });
  }
}
