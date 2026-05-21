// src/app/features/dashboard/dashboard/dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatGridListModule,
    MatButtonModule,
    RouterModule,
    MatIconModule,
  ],
  template: `
    <div class="dashboard-container">
      <div class="dashboard-header">
        <h1>Dashboard</h1>
        <p class="subtitle">Welcome to Firefly III</p>
      </div>

      <mat-grid-list cols="4" rowHeight="200px" gutterSize="20px" class="dashboard-grid">
        <mat-grid-tile>
          <mat-card class="stat-card">
            <mat-card-header>
              <mat-card-title>Total Assets</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="stat-value">$12,345.67</div>
              <p class="stat-change">+2.3% from last month</p>
            </mat-card-content>
          </mat-card>
        </mat-grid-tile>

        <mat-grid-tile>
          <mat-card class="stat-card warning">
            <mat-card-header>
              <mat-card-title>Total Expenses</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="stat-value">$2,345.67</div>
              <p class="stat-change">This month</p>
            </mat-card-content>
          </mat-card>
        </mat-grid-tile>

        <mat-grid-tile>
          <mat-card class="stat-card info">
            <mat-card-header>
              <mat-card-title>Budget Status</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="stat-value">67%</div>
              <p class="stat-change">Used of budget</p>
            </mat-card-content>
          </mat-card>
        </mat-grid-tile>

        <mat-grid-tile>
          <mat-card class="stat-card success">
            <mat-card-header>
              <mat-card-title>Income</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="stat-value">$5,000.00</div>
              <p class="stat-change">This month</p>
            </mat-card-content>
          </mat-card>
        </mat-grid-tile>
      </mat-grid-list>

      <div class="quick-actions">
        <h2>Quick Actions</h2>
        <div class="button-group">
          <button mat-raised-button color="primary" routerLink="/transactions">
            <mat-icon>add</mat-icon>
            New Transaction
          </button>
          <button mat-raised-button color="accent" routerLink="/accounts">
            <mat-icon>account_balance</mat-icon>
            View Accounts
          </button>
          <button mat-raised-button routerLink="/budgets">
            <mat-icon>monetization_on</mat-icon>
            View Budgets
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      padding: 2rem;
      max-width: 1400px;
      margin: 0 auto;
    }

    .dashboard-header h1 {
      font-size: 2rem;
      margin: 0;
    }

    .stat-card {
      width: 100%;
      padding: 1.5rem !important;
    }

    .stat-value {
      font-size: 1.8rem;
      font-weight: 600;
      margin: 1rem 0;
    }

    .stat-card.warning {
      border-left: 4px solid #f9a825;
    }

    .stat-card.info {
      border-left: 4px solid #1976d2;
    }

    .stat-card.success {
      border-left: 4px solid #43a047;
    }

    .button-group {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }
  `],
})
export class DashboardComponent implements OnInit {
  ngOnInit(): void {}
}
