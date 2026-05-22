import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { RouterModule } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule,
    RouterModule,
  ],
  template: `
    <mat-toolbar class="navbar">
      <div class="navbar-content">
        <div class="navbar-left">
          <h1 class="app-title">💰 Firefly III</h1>
        </div>
        <nav class="navbar-nav">
          <a routerLink="/dashboard" routerLinkActive="active" class="nav-link">
            <mat-icon>dashboard</mat-icon>
            Dashboard
          </a>
          <a routerLink="/accounts" routerLinkActive="active" class="nav-link">
            <mat-icon>account_balance</mat-icon>
            Accounts
          </a>
          <a routerLink="/transactions" routerLinkActive="active" class="nav-link">
            <mat-icon>receipt</mat-icon>
            Transactions
          </a>
          <a routerLink="/budgets" routerLinkActive="active" class="nav-link">
            <mat-icon>monetization_on</mat-icon>
            Budgets
          </a>
        </nav>
        <div class="navbar-right">
          <button mat-icon-button [matMenuTriggerFor]="userMenu" class="user-menu-btn">
            <mat-icon>account_circle</mat-icon>
          </button>
          <mat-menu #userMenu="matMenu">
            <button mat-menu-item disabled>
              <mat-icon>person</mat-icon>
              <span>Profile</span>
            </button>
            <button mat-menu-item disabled>
              <mat-icon>settings</mat-icon>
              <span>Settings</span>
            </button>
            <mat-divider></mat-divider>
            <button mat-menu-item (click)="logout()">
              <mat-icon>logout</mat-icon>
              <span>Logout</span>
            </button>
          </mat-menu>
        </div>
      </div>
    </mat-toolbar>
  `,
  styles: [`
    .navbar {
      background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
      color: #f1f5f9;
      padding: 0;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      position: sticky;
      top: 0;
      z-index: 1000;
    }

    .navbar-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      padding: 0 2rem;
    }

    .navbar-left {
      display: flex;
      align-items: center;
    }

    .app-title {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 700;
      color: #f1f5f9;
      white-space: nowrap;
    }

    .navbar-nav {
      display: flex;
      gap: 0;
      align-items: center;
      flex: 1;
      justify-content: center;
    }

    .nav-link {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 1rem 1.5rem;
      color: #cbd5e1;
      text-decoration: none;
      transition: all 0.3s ease;
      border-bottom: 3px solid transparent;
      font-weight: 500;
    }

    .nav-link:hover {
      color: #f1f5f9;
      background: rgba(59, 130, 246, 0.1);
    }

    .nav-link.active {
      color: #3b82f6;
      border-bottom-color: #3b82f6;
      background: rgba(59, 130, 246, 0.05);
    }

    .nav-link mat-icon {
      font-size: 1.25rem;
      width: 1.25rem;
      height: 1.25rem;
    }

    .navbar-right {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .user-menu-btn {
      color: #cbd5e1;
      font-size: 1.5rem;
      width: 2.5rem;
      height: 2.5rem;
    }

    .user-menu-btn:hover {
      color: #3b82f6;
    }

    mat-divider {
      margin: 0.5rem 0;
    }

    @media (max-width: 768px) {
      .navbar-content {
        padding: 0 1rem;
      }

      .app-title {
        font-size: 1.2rem;
      }

      .navbar-nav {
        display: none;
      }

      .nav-link {
        padding: 0.75rem 1rem;
      }
    }
  `],
})
export class NavbarComponent implements OnInit {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {}

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
