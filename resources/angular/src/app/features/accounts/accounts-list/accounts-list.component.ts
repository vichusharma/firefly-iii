// src/app/features/accounts/accounts-list/accounts-list.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-accounts-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    RouterModule,
  ],
  template: `
    <div class="accounts-container">
      <div class="accounts-header">
        <h1>Accounts</h1>
        <button mat-raised-button color="primary">
          <mat-icon>add</mat-icon>
          New Account
        </button>
      </div>

      <mat-card class="accounts-card">
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
                  {{ element.type }}
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
                <strong>{{ element.current_balance | currency }}</strong>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .accounts-container {
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    .accounts-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }

    .accounts-table {
      width: 100%;
    }

    .type-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.875rem;
    }

    .type-badge.asset {
      background: #c8e6c9;
      color: #2e7d32;
    }

    .type-badge.expense {
      background: #ffcdd2;
      color: #c62828;
    }
  `],
})
export class AccountsListComponent implements OnInit {
  displayedColumns: string[] = ['name', 'type', 'currency', 'balance'];
  accounts: any[] = [
    {
      id: '1',
      name: 'Checking Account',
      type: 'asset',
      currency_code: 'USD',
      current_balance: 5000,
    },
    {
      id: '2',
      name: 'Savings Account',
      type: 'asset',
      currency_code: 'USD',
      current_balance: 15000,
    },
  ];

  ngOnInit(): void {}
}
