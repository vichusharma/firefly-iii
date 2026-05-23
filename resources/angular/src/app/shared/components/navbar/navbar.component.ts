import { Component, OnInit, ViewChild, ElementRef } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatToolbarModule } from "@angular/material/toolbar";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatDividerModule } from "@angular/material/divider";
import { RouterModule } from "@angular/router";
import { AuthService } from "@core/services/auth.service";
import { Router } from "@angular/router";

@Component({
    selector: "app-navbar",
    standalone: true,
    imports: [
        CommonModule,
        MatToolbarModule,
        MatButtonModule,
        MatIconModule,
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
                    <a
                        routerLink="/dashboard"
                        routerLinkActive="active"
                        class="nav-link"
                    >
                        <mat-icon>dashboard</mat-icon>
                        Dashboard
                    </a>
                    <a
                        routerLink="/accounts"
                        routerLinkActive="active"
                        class="nav-link"
                    >
                        <mat-icon>account_balance</mat-icon>
                        Accounts
                    </a>
                    <a
                        routerLink="/transactions"
                        routerLinkActive="active"
                        class="nav-link"
                    >
                        <mat-icon>receipt</mat-icon>
                        Transactions
                    </a>
                    <a
                        routerLink="/budgets"
                        routerLinkActive="active"
                        class="nav-link"
                    >
                        <mat-icon>monetization_on</mat-icon>
                        Budgets
                    </a>
                </nav>
                <div class="navbar-right">
                    <button
                        mat-icon-button
                        (click)="toggleUserMenu()"
                        class="user-menu-btn"
                        aria-label="User menu"
                        #userBtn
                    >
                        <mat-icon>account_circle</mat-icon>
                    </button>
                    <!-- Custom dropdown menu -->
                    <div
                        class="user-dropdown"
                        *ngIf="isUserMenuOpen"
                        [@fadeInOut]
                    >
                        <button
                            class="dropdown-item"
                            (click)="navigateToProfile()"
                        >
                            <mat-icon>person</mat-icon>
                            <span>Profile</span>
                        </button>
                        <button
                            class="dropdown-item"
                            (click)="navigateToSettings()"
                        >
                            <mat-icon>settings</mat-icon>
                            <span>Settings</span>
                        </button>
                        <div class="dropdown-divider"></div>
                        <button class="dropdown-item" (click)="logout()">
                            <mat-icon>logout</mat-icon>
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
            </div>
        </mat-toolbar>
    `,
    styles: [
        `
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

            /* Custom dropdown menu styling */
            .navbar-right {
                position: relative;
            }

            .user-dropdown {
                position: absolute;
                top: calc(100% + 0.5rem);
                right: 0;
                background: white;
                border: 1px solid #e2e8f0;
                border-radius: 0.5rem;
                box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
                z-index: 10000;
                min-width: 200px;
                overflow: hidden;
            }

            .dropdown-item {
                display: flex;
                align-items: center;
                gap: 1rem;
                width: 100%;
                padding: 0.75rem 1rem;
                border: none;
                background: transparent;
                color: #1f2937;
                font-size: 0.95rem;
                cursor: pointer;
                transition: all 0.2s ease;
                text-align: left;
            }

            .dropdown-item:hover {
                background: #f3f4f6;
                color: #3b82f6;
            }

            .dropdown-item mat-icon {
                width: 1.25rem;
                height: 1.25rem;
                font-size: 1.25rem;
                line-height: 1.25rem;
            }

            .dropdown-divider {
                height: 1px;
                background: #e5e7eb;
                margin: 0.5rem 0;
            }

            @media (max-width: 768px) {
                .user-dropdown {
                    right: -0.5rem;
                }
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
        `,
    ],
})
export class NavbarComponent implements OnInit {
    isUserMenuOpen = false;
    @ViewChild("userBtn") userBtn!: ElementRef;

    constructor(
        private authService: AuthService,
        private router: Router,
    ) {}

    ngOnInit(): void {
        // Close menu on route navigation
        this.router.events.subscribe(() => {
            this.isUserMenuOpen = false;
        });
    }

    toggleUserMenu(): void {
        this.isUserMenuOpen = !this.isUserMenuOpen;
    }

    navigateToProfile(): void {
        this.isUserMenuOpen = false;
        this.router.navigate(["/profile"]);
    }

    navigateToSettings(): void {
        this.isUserMenuOpen = false;
        this.router.navigate(["/settings"]);
    }

    logout(): void {
        this.isUserMenuOpen = false;
        this.authService.logout().subscribe(
            () => {
                this.router.navigate(["/login"]);
            },
            (error) => {
                // Even on error, navigate to login as local data is cleared
                this.router.navigate(["/login"]);
            },
        );
    }
}
