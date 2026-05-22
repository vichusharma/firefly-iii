// src/app/features/transactions/transactions-list/transactions-list.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { ApiService } from '@core/services/api.service';
import { Transaction } from '@shared/models';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TransactionCreateDialogComponent } from '../transaction-create-dialog/transaction-create-dialog.component';

@Component({
  selector: 'app-transactions-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    TransactionCreateDialogComponent,
  ],
  template: `
    <div class="transactions-container">
      <div class="transactions-header">
        <h1>Transactions</h1>
        <button mat-raised-button color="primary" (click)="createNewTransaction()">
          <mat-icon>add</mat-icon>
          New Transaction
        </button>
      </div>

      <div *ngIf="loading" class="loading-container">
        <mat-spinner diameter="50"></mat-spinner>
        <p>Loading transactions...</p>
      </div>

      <mat-card *ngIf="!loading" class="transactions-card">
        <mat-card-content>
          <table mat-table [dataSource]="transactions" class="transactions-table">
            <ng-container matColumnDef="date">
              <th mat-header-cell *matHeaderCellDef>Date</th>
              <td mat-cell *matCellDef="let element">{{ element.date | date: 'medium' }}</td>
            </ng-container>

            <ng-container matColumnDef="description">
              <th mat-header-cell *matHeaderCellDef>Description</th>
              <td mat-cell *matCellDef="let element">{{ element.description }}</td>
            </ng-container>

            <ng-container matColumnDef="type">
              <th mat-header-cell *matHeaderCellDef>Type</th>
              <td mat-cell *matCellDef="let element">
                <span class="type-badge" [class]="element.type">
                  {{ element.type | titlecase }}
                </span>
              </td>
            </ng-container>

            <ng-container matColumnDef="amount">
              <th mat-header-cell *matHeaderCellDef>Amount</th>
              <td mat-cell *matCellDef="let element">
                <strong [class]="element.type === 'withdrawal' ? 'negative' : 'positive'">
                  {{ (element.type === 'withdrawal' ? '-' : '+') }}{{ element.amount | currency }}
                </strong>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>

          <div *ngIf="transactions.length === 0" class="no-data">
            <p>No transactions found. Create your first transaction to get started!</p>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .transactions-container {
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      min-height: 100vh;
    }

    .transactions-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      color: #f1f5f9;
    }

    .transactions-header h1 {
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

    .transactions-card {
      background: #1e293b;
      border-radius: 1.25rem;
      border: none;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    }

    .transactions-table {
      width: 100%;
      color: #cbd5e1;
    }

    .transactions-table th {
      color: #94a3b8;
      font-weight: 600;
      background: rgba(255, 255, 255, 0.02);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .transactions-table td {
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      padding: 1rem;
    }

    .type-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .type-badge.withdrawal {
      background: rgba(239, 68, 68, 0.2);
      color: #fca5a5;
    }

    .type-badge.deposit {
      background: rgba(34, 197, 94, 0.2);
      color: #86efac;
    }

    .type-badge.transfer {
      background: rgba(59, 130, 246, 0.2);
      color: #93c5fd;
    }

    .type-badge.opening_balance {
      background: rgba(245, 158, 11, 0.2);
      color: #fcd34d;
    }

    .negative {
      color: #fca5a5;
    }

    .positive {
      color: #86efac;
    }

    .no-data {
      text-align: center;
      padding: 2rem;
      color: #94a3b8;
      font-style: italic;
    }
  `],
})
export class TransactionsListComponent implements OnInit, OnDestroy {
  displayedColumns: string[] = ['date', 'description', 'type', 'amount'];
  transactions: Transaction[] = [];
  loading = true;

  private destroy$ = new Subject<void>();

  constructor(
    private apiService: ApiService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadTransactions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadTransactions(): void {
    this.loading = true;
    this.apiService
      .get<any>('transactions')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.transactions = Array.isArray(response.data) ? response.data : response.data?.data || [];
          this.loading = false;
        },
        error: (err) => {
          console.error('Error loading transactions:', err);
          this.loading = false;
        },
      });
  }

  createNewTransaction(): void {
    const dialogRef = this.dialog.open(TransactionCreateDialogComponent, {
      width: '95%',
      maxWidth: '700px',
      panelClass: 'firefly-dialog-container',
      autoFocus: false,
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadTransactions();
      }
    });
  }
}
