// src/app/features/accounts/accounts-list/accounts-list.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { RouterModule } from '@angular/router';
import { ApiService } from '@core/services/api.service';
import { Account } from '@shared/models';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AccountCreateDialogComponent } from '../account-create-dialog/account-create-dialog.component';

@Component({
  selector: 'app-accounts-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    RouterModule,
    AccountCreateDialogComponent,
  ],
  template: `
    <div class="accounts-container">
      <div class="accounts-header">
        <h1>Accounts</h1>
        <button mat-raised-button color="primary" (click)="createNewAccount()">
          <mat-icon>add</mat-icon>
          New Account
        </button>
      </div>

      <div *ngIf="loading" class="loading-container">
        <mat-spinner diameter="50"></mat-spinner>
        <p>Loading accounts...</p>
      </div>

      <mat-card *ngIf="!loading" class="accounts-card">
        <mat-card-content>
          <table mat-table [dataSource]="accounts" class="accounts-table">
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>Account Name</th>
              <td mat-cell *matCellDef="let element">{{ element.name }}</td>
            </ng-container>

            <ng-container matColumnDef="type">
              <th mat-header-cell *matHeaderCellDef>Type</th>
              <td mat-cell *matCellDef="let element">
                <span class="type-badge" [class]="element.type">
                  {{ element.type | titlecase }}
                </span>
              </td>
            </ng-container>

            <ng-container matColumnDef="currency">
              <th mat-header-cell *matHeaderCellDef>Currency</th>
              <td mat-cell *matCellDef="let element">{{ element.currency_code }}</td>
            </ng-container>

            <ng-container matColumnDef="balance">
              <th mat-header-cell *matHeaderCellDef>Balance</th>
              <td mat-cell *matCellDef="let element">
                <strong [class]="element.current_balance >= 0 ? 'positive' : 'negative'">
                  {{ element.current_balance | currency }}
                </strong>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>

          <div *ngIf="accounts.length === 0" class="no-data">
            <p>No accounts found. Create your first account to get started!</p>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .accounts-container {
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      min-height: 100vh;
    }

    .accounts-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      color: #f1f5f9;
    }

    .accounts-header h1 {
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

    .accounts-card {
      background: #1e293b;
      border-radius: 1.25rem;
      border: none;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    }

    .accounts-table {
      width: 100%;
      color: #cbd5e1;
    }

    .accounts-table th {
      color: #94a3b8;
      font-weight: 600;
      background: rgba(255, 255, 255, 0.02);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .accounts-table td {
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      padding: 1rem;
    }

    .type-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .type-badge.asset {
      background: rgba(16, 185, 129, 0.2);
      color: #86efac;
    }

    .type-badge.expense {
      background: rgba(239, 68, 68, 0.2);
      color: #fca5a5;
    }

    .type-badge.revenue {
      background: rgba(34, 197, 94, 0.2);
      color: #86efac;
    }

    .type-badge.liability {
      background: rgba(245, 158, 11, 0.2);
      color: #fcd34d;
    }

    .positive {
      color: #86efac;
    }

    .negative {
      color: #fca5a5;
    }

    .no-data {
      text-align: center;
      padding: 2rem;
      color: #94a3b8;
      font-style: italic;
    }
  `],
})
export class AccountsListComponent implements OnInit, OnDestroy {
  displayedColumns: string[] = ['name', 'type', 'currency', 'balance'];
  accounts: Account[] = [];
  loading = true;

  private destroy$ = new Subject<void>();

  constructor(
    private apiService: ApiService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadAccounts();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadAccounts(): void {
    this.loading = true;
    this.apiService
      .get<any>('accounts')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.accounts = Array.isArray(response.data) ? response.data : response.data?.data || [];
          this.loading = false;
        },
        error: (err) => {
          console.error('Error loading accounts:', err);
          this.loading = false;
        },
      });
  }

  createNewAccount(): void {
    const dialogRef = this.dialog.open(AccountCreateDialogComponent, {
      width: '95%',
      maxWidth: '700px',
      panelClass: 'firefly-dialog-container',
      autoFocus: false,
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadAccounts();
      }
    });
  }
}

