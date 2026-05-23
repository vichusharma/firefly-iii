// src/app/features/budgets/budgets-list/budgets-list.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { ApiService } from '@core/services/api.service';
import { Budget } from '@shared/models';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { BudgetCreateDialogComponent } from '../budget-create-dialog/budget-create-dialog.component';

@Component({
  selector: 'app-budgets-list',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    BudgetCreateDialogComponent,
  ],
  template: `
    <div class="budgets-container">
      <div class="budgets-header">
        <h1>Budgets</h1>
        <button mat-raised-button color="primary" (click)="createNewBudget()">
          <mat-icon>add</mat-icon>
          New Budget
        </button>
      </div>

      <div *ngIf="loading" class="loading-container">
        <mat-spinner diameter="50"></mat-spinner>
        <p>Loading budgets...</p>
      </div>

      <div *ngIf="!loading && budgets.length === 0" class="no-data">
        <mat-icon class="no-data-icon">assignment</mat-icon>
        <p>No budgets found</p>
        <p class="hint">Create your first budget to track spending</p>
      </div>

      <div *ngIf="!loading && budgets.length > 0" class="budgets-grid">
        <mat-card *ngFor="let budget of budgets" class="budget-card">
          <mat-card-header>
            <mat-card-title>{{ budget.name }}</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="budget-amount">
              <strong>{{ budget.spent | currency }}</strong>
              <span> / {{ budget.amount | currency }}</span>
            </div>
            <mat-progress-bar
              mode="determinate"
              [value]="getBudgetPercentage(budget)"
            ></mat-progress-bar>
            <p class="budget-percentage">{{ getBudgetPercentage(budget) | number: '1.0-0' }}% used</p>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .budgets-container {
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      min-height: 100vh;
    }

    .budgets-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      color: #f1f5f9;
    }

    .budgets-header h1 {
      margin: 0;
      font-size: 2rem;
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

    .budgets-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.5rem;
    }

    .budget-card {
      padding: 1.5rem !important;
      background: #1e293b;
      border-radius: 1.25rem;
      border: none;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
      color: #cbd5e1;
    }

    .budget-card mat-card-header {
      padding-bottom: 1rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }

    .budget-card mat-card-title {
      margin: 0;
      color: #f1f5f9;
    }

    .budget-amount {
      margin-bottom: 1rem;
      font-size: 1.1rem;
      color: #cbd5e1;
    }

    .budget-percentage {
      margin-top: 0.5rem;
      color: #94a3b8;
      font-size: 0.875rem;
    }
  `],
})
export class BudgetsListComponent implements OnInit, OnDestroy {
  budgets: Budget[] = [];
  loading = true;

  private destroy$ = new Subject<void>();

  constructor(
    private apiService: ApiService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadBudgets();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadBudgets(): void {
    this.loading = true;
    this.apiService
      .get<any>('budgets')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.budgets = Array.isArray(response.data) ? response.data : response.data?.data || [];
          this.loading = false;
        },
        error: (err) => {
          console.error('Error loading budgets:', err);
          this.budgets = [];
          this.loading = false;
        },
      });
  }

  getBudgetPercentage(budget: Budget): number {
    if (!budget.amount || budget.amount === 0) return 0;
    return Math.min((budget.spent || 0) / budget.amount * 100, 100);
  }

  createNewBudget(): void {
    const dialogRef = this.dialog.open(BudgetCreateDialogComponent, {
      width: '95%',
      maxWidth: '700px',
      panelClass: 'firefly-dialog-container',
      autoFocus: false,
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadBudgets();
      }
    });
  }
}
