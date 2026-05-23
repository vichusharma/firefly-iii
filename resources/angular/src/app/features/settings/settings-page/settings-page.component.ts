import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatCardModule } from "@angular/material/card";
import { MatButtonModule } from "@angular/material/button";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatIconModule } from "@angular/material/icon";
import { MatDividerModule } from "@angular/material/divider";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { SettingsService } from "@core/services/settings.service";

@Component({
    selector: "app-settings-page",
    standalone: true,
    imports: [
        CommonModule,
        MatCardModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        MatIconModule,
        MatDividerModule,
        FormsModule,
    ],
    template: `
        <div class="settings-container">
            <div class="settings-header">
                <h1>Settings</h1>
                <p>Manage your account settings</p>
            </div>

            <div class="settings-content">
                <mat-card class="settings-card">
                    <mat-card-header>
                        <mat-card-title>Security Settings</mat-card-title>
                    </mat-card-header>
                    <mat-card-content>
                        <div class="settings-section">
                            <h3>Change Password</h3>
                            <p>
                                Update your account password to keep your
                                account secure
                            </p>
                            <button mat-raised-button color="primary">
                                <mat-icon>lock</mat-icon>
                                Reset Password
                            </button>
                        </div>

                        <mat-divider class="section-divider"></mat-divider>

                        <div class="settings-section">
                            <h3>Two-Factor Authentication</h3>
                            <p>
                                Add an extra layer of security to your account
                            </p>
                            <button mat-stroked-button color="accent">
                                <mat-icon>security</mat-icon>
                                Configure 2FA
                            </button>
                        </div>
                    </mat-card-content>
                </mat-card>

                <mat-card class="settings-card">
                    <mat-card-header>
                        <mat-card-title>Future Features</mat-card-title>
                    </mat-card-header>
                    <mat-card-content>
                        <p class="placeholder-text">
                            <mat-icon>info</mat-icon>
                            Additional settings will be available here in future
                            updates.
                        </p>
                        <div class="feature-list">
                            <div class="feature-item">
                                <mat-icon>check_circle_outline</mat-icon>
                                <span>Theme Customization</span>
                            </div>
                            <div class="feature-item">
                                <mat-icon>check_circle_outline</mat-icon>
                                <span>Language Preferences</span>
                            </div>
                            <div class="feature-item">
                                <mat-icon>check_circle_outline</mat-icon>
                                <span>Notification Management</span>
                            </div>
                            <div class="feature-item">
                                <mat-icon>check_circle_outline</mat-icon>
                                <span>Data Export & Import</span>
                            </div>
                        </div>
                    </mat-card-content>
                </mat-card>
            </div>
        </div>
    `,
    styles: [
        `
            .settings-container {
                max-width: 900px;
                margin: 0 auto;
                padding: 2rem;
            }

            .settings-header {
                margin-bottom: 2rem;
            }

            .settings-header h1 {
                margin: 0;
                font-size: 2rem;
                color: #1e293b;
            }

            .settings-header p {
                color: #64748b;
                margin: 0.5rem 0 0 0;
            }

            .settings-content {
                display: grid;
                gap: 2rem;
            }

            .settings-card {
                border: 1px solid #e2e8f0;
                border-radius: 8px;
            }

            .settings-section {
                padding: 1rem 0;
            }

            .settings-section h3 {
                margin: 0 0 0.5rem 0;
                font-size: 1.1rem;
                color: #1e293b;
            }

            .settings-section p {
                margin: 0 0 1rem 0;
                color: #64748b;
                font-size: 0.95rem;
            }

            .section-divider {
                margin: 1.5rem 0;
            }

            button mat-icon {
                margin-right: 0.5rem;
            }

            .placeholder-text {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                color: #64748b;
                margin: 0 0 1.5rem 0;
                padding: 1rem;
                background: #f1f5f9;
                border-radius: 4px;
            }

            .placeholder-text mat-icon {
                color: #3b82f6;
                flex-shrink: 0;
            }

            .feature-list {
                display: grid;
                gap: 0.75rem;
            }

            .feature-item {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                padding: 0.75rem;
                color: #475569;
            }

            .feature-item mat-icon {
                color: #22c55e;
                flex-shrink: 0;
            }

            @media (max-width: 768px) {
                .settings-container {
                    padding: 1rem;
                }

                .settings-header h1 {
                    font-size: 1.5rem;
                }
            }
        `,
    ],
})
export class SettingsPageComponent implements OnInit {
    constructor(
        private settingsService: SettingsService,
        private router: Router,
    ) {}

    ngOnInit(): void {}
}
