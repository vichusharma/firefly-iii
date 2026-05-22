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
        <div class="header-content">
          <h1>Financial Dashboard</h1>
          <p class="subtitle">Welcome back! Here's your financial overview</p>
        </div>
      </div>

      <mat-grid-list cols="4" rowHeight="200px" gutterSize="20px" class="dashboard-grid">
        <mat-grid-tile>
          <mat-card class="stat-card primary">
            <mat-card-header>
              <mat-card-title>Total Assets</mat-card-title>
              <mat-icon>trending_up</mat-icon>
            </mat-card-header>
            <mat-card-content>
              <div class="stat-value">$12,345.67</div>
              <p class="stat-change positive">
                <mat-icon>arrow_upward</mat-icon>
                +2.3% from last month
              </p>
            </mat-card-content>
          </mat-card>
        </mat-grid-tile>

        <mat-grid-tile>
          <mat-card class="stat-card warning">
            <mat-card-header>
              <mat-card-title>Total Expenses</mat-card-title>
              <mat-icon>shopping_cart</mat-icon>
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
              <mat-icon>assessment</mat-icon>
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
              <mat-icon>attach_money</mat-icon>
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
          <button mat-raised-button class="action-btn primary" routerLink="/transactions">
            <mat-icon>add_circle</mat-icon>
            New Transaction
          </button>
          <button mat-raised-button class="action-btn secondary" routerLink="/accounts">
            <mat-icon>account_balance</mat-icon>
            View Accounts
          </button>
          <button mat-raised-button class="action-btn tertiary" routerLink="/budgets">
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
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      min-height: 100vh;
    }

    .dashboard-header {
      margin-bottom: 3rem;
      padding: 2rem;
      background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%);
      border-radius: 1.5rem;
      border: 1px solid rgba(59, 130, 246, 0.2);
    }

    .header-content h1 {
      font-size: 2.5rem;
      margin: 0 0 0.5rem 0;
      color: #f1f5f9;
      font-weight: 700;
    }

    .subtitle {
      margin: 0;
      color: #94a3b8;
      font-size: 1.1rem;
    }

    .dashboard-grid {
      margin-bottom: 3rem;
    }

    .stat-card {
      width: 100%;
      padding: 0;
      border-radius: 1.25rem;
      overflow: hidden;
      position: relative;
      border: none;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      background: #1e293b;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .stat-card:hover {
      transform: translateY(-8px);
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
    }

    .stat-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, #3b82f6 0%, #06b6d4 100%);
    }

    .stat-card.warning::before {
      background: linear-gradient(90deg, #f59e0b 0%, #d97706 100%);
    }

    .stat-card.info::before {
      background: linear-gradient(90deg, #06b6d4 0%, #0891b2 100%);
    }

    .stat-card.success::before {
      background: linear-gradient(90deg, #10b981 0%, #059669 100%);
    }

    mat-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem;
      background: rgba(255, 255, 255, 0.02);
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }

    mat-card-title {
      margin: 0;
      color: #cbd5e1;
      font-size: 0.95rem;
      font-weight: 500;
    }

    mat-card-header mat-icon {
      color: #64748b;
      opacity: 0.6;
    }

    mat-card-content {
      padding: 1.5rem;
      flex-grow: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }

    .stat-value {
      font-size: 2rem;
      font-weight: 700;
      color: #f1f5f9;
      margin: 0.5rem 0;
    }

    .stat-change {
      margin: 0;
      font-size: 0.85rem;
      color: #94a3b8;
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .stat-change.positive {
      color: #10b981;
    }

    .stat-change mat-icon {
      font-size: 0.9rem;
      width: 0.9rem;
      height: 0.9rem;
    }

    .quick-actions {
      padding: 2rem;
      background: rgba(255, 255, 255, 0.02);
      border-radius: 1.25rem;
      border: 1px solid rgba(255, 255, 255, 0.05);
    }

    .quick-actions h2 {
      margin: 0 0 1.5rem 0;
      color: #f1f5f9;
      font-size: 1.5rem;
    }

    .button-group {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .action-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      border-radius: 0.75rem;
      font-weight: 500;
      transition: all 0.3s ease;
    }

    .action-btn.primary {
      background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%) !important;
      color: white;
    }

    .action-btn.primary:hover {
      box-shadow: 0 10px 25px rgba(59, 130, 246, 0.3);
      transform: translateY(-2px);
    }

    .action-btn.secondary {
      background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%) !important;
      color: white;
    }

    .action-btn.secondary:hover {
      box-shadow: 0 10px 25px rgba(6, 182, 212, 0.3);
      transform: translateY(-2px);
    }

    .action-btn.tertiary {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
      color: white;
    }

    .action-btn.tertiary:hover {
      box-shadow: 0 10px 25px rgba(16, 185, 129, 0.3);
      transform: translateY(-2px);
    }
  `],
})
export class DashboardComponent implements OnInit {
  ngOnInit(): void {}
}
