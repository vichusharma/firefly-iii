// src/app/features/transactions/transactions-list/transactions-list.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-transactions-list',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatButtonModule, MatCardModule, MatIconModule],
  template: `
    <div class="transactions-container">
      <div class="transactions-header">
        <h1>Transactions</h1>
        <button mat-raised-button color="primary">
          <mat-icon>add</mat-icon>
          New Transaction
        </button>
      </div>

      <mat-card>
        <mat-card-content>
          <table mat-table [dataSource]="transactions" class="transactions-table">
            <ng-container matColumnDef="date">
              <th mat-header-cell *matHeaderCellDef>Date</th>
              <td mat-cell *matCellDef="let element">{{ element.date | date }}</td>
            </ng-container>

            <ng-container matColumnDef="description">
              <th mat-header-cell *matHeaderCellDef>Description</th>
              <td mat-cell *matCellDef="let element">{{ element.description }}</td>
            </ng-container>

            <ng-container matColumnDef="type">
              <th mat-header-cell *matHeaderCellDef>Type</th>
              <td mat-cell *matCellDef="let element">{{ element.type }}</td>
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
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .transactions-container {
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    .transactions-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }

    .transactions-table {
      width: 100%;
    }

    .negative {
      color: #c62828;
    }

    .positive {
      color: #2e7d32;
    }
  `],
})
export class TransactionsListComponent implements OnInit {
  displayedColumns: string[] = ['date', 'description', 'type', 'amount'];
  transactions: any[] = [
    {
      id: '1',
      date: '2024-01-15',
      description: 'Salary',
      type: 'deposit',
      amount: 5000,
    },
    {
      id: '2',
      date: '2024-01-10',
      description: 'Groceries',
      type: 'withdrawal',
      amount: 150,
    },
  ];

  ngOnInit(): void {}
}
