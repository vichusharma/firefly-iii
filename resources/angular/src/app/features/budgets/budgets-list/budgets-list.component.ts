// src/app/features/budgets/budgets-list/budgets-list.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
  selector: 'app-budgets-list',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatProgressBarModule],
  template: `
    <div class="budgets-container">
      <div class="budgets-header">
        <h1>Budgets</h1>
        <button mat-raised-button color="primary">
          <mat-icon>add</mat-icon>
          New Budget
        </button>
      </div>

      <div class="budgets-grid">
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
              [value]="(budget.spent / budget.amount) * 100"
            ></mat-progress-bar>
            <p class="budget-percentage">{{ ((budget.spent / budget.amount) * 100) | number: '1.0-0' }}% used</p>
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
    }

    .budgets-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }

    .budgets-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.5rem;
    }

    .budget-card {
      padding: 1.5rem !important;
    }

    .budget-amount {
      margin-bottom: 1rem;
      font-size: 1.1rem;
    }

    .budget-percentage {
      margin-top: 0.5rem;
      color: #79747e;
      font-size: 0.875rem;
    }
  `],
})
export class BudgetsListComponent implements OnInit {
  budgets: any[] = [
    {
      id: '1',
      name: 'Groceries',
      amount: 500,
      spent: 250,
    },
    {
      id: '2',
      name: 'Dining Out',
      amount: 300,
      spent: 180,
    },
  ];

  ngOnInit(): void {}
}
