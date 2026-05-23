import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatCardModule } from "@angular/material/card";
import { MatButtonModule } from "@angular/material/button";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatIconModule } from "@angular/material/icon";
import { MatSlideToggleModule } from "@angular/material/slide-toggle";
import { MatSelectModule } from "@angular/material/select";
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
        MatSlideToggleModule,
        MatSelectModule,
        MatDividerModule,
        FormsModule,
    ],
    template: `
        <div class="settings-container">
            <div class="settings-header">
                <h1>Settings</h1>
                <p>Customize your application preferences</p>
            </div>

            <div class="settings-content">
                <mat-card class="settings-card">
                    <mat-card-header>
                        <mat-card-title>Display Settings</mat-card-title>
                    </mat-card-header>
                    <mat-card-content>
                        <div class="settings-item">
                            <div class="setting-label">
                                <h3>Dark Mode</h3>
                                <p>Enable dark theme for better visibility</p>
                            </div>
                            <mat-slide-toggle disabled></mat-slide-toggle>
                        </div>

                        <mat-divider></mat-divider>

                        <div class="settings-item">
                            <div class="setting-label">
                                <h3>Default Currency</h3>
                                <p>Select your preferred currency</p>
                            </div>
                            <mat-form-field>
                                <mat-label>Currency</mat-label>
                                <mat-select [value]="'USD'" disabled>
                                    <mat-option value="USD">USD ($)</mat-option>
                                    <mat-option value="EUR">EUR (€)</mat-option>
                                    <mat-option value="GBP">GBP (£)</mat-option>
                                </mat-select>
                            </mat-form-field>
                        </div>

                        <mat-divider></mat-divider>

                        <div class="settings-item">
                            <div class="setting-label">
                                <h3>Language</h3>
                                <p>Choose your preferred language</p>
                            </div>
                            <mat-form-field>
                                <mat-label>Language</mat-label>
                                <mat-select [value]="'en'" disabled>
                                    <mat-option value="en">English</mat-option>
                                    <mat-option value="es">Español</mat-option>
                                    <mat-option value="fr">Français</mat-option>
                                </mat-select>
                            </mat-form-field>
                        </div>
                    </mat-card-content>
                </mat-card>

                <mat-card class="settings-card">
                    <mat-card-header>
                        <mat-card-title>Notifications</mat-card-title>
                    </mat-card-header>
                    <mat-card-content>
                        <div class="settings-item">
                            <div class="setting-label">
                                <h3>Email Notifications</h3>
                                <p>Receive email updates about your account</p>
                            </div>
                            <mat-slide-toggle disabled></mat-slide-toggle>
                        </div>

                        <mat-divider></mat-divider>

                        <div class="settings-item">
                            <div class="setting-label">
                                <h3>Budget Alerts</h3>
                                <p>
                                    Get notified when budgets are nearly
                                    exceeded
                                </p>
                            </div>
                            <mat-slide-toggle disabled></mat-slide-toggle>
                        </div>

                        <mat-divider></mat-divider>

                        <div class="settings-item">
                            <div class="setting-label">
                                <h3>Transaction Alerts</h3>
                                <p>Get notified about large transactions</p>
                            </div>
                            <mat-slide-toggle disabled></mat-slide-toggle>
                        </div>
                    </mat-card-content>
                </mat-card>

                <mat-card class="settings-card">
                    <mat-card-header>
                        <mat-card-title>Data Management</mat-card-title>
                    </mat-card-header>
                    <mat-card-content>
                        <button mat-stroked-button color="primary" disabled>
                            <mat-icon>download</mat-icon>
                            Export Data
                        </button>
                        <button
                            mat-stroked-button
                            color="warn"
                            disabled
                            style="margin-left: 1rem;"
                        >
                            <mat-icon>delete</mat-icon>
                            Delete Account
                        </button>
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

            .settings-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 1rem 0;
            }

            .setting-label {
                flex: 1;
            }

            .setting-label h3 {
                margin: 0;
                font-size: 1rem;
                color: #1e293b;
            }

            .setting-label p {
                margin: 0.25rem 0 0 0;
                font-size: 0.875rem;
                color: #64748b;
            }

            mat-slide-toggle,
            mat-form-field {
                margin-left: 1rem;
            }

            button mat-icon {
                margin-right: 0.5rem;
            }

            @media (max-width: 768px) {
                .settings-container {
                    padding: 1rem;
                }

                .settings-header h1 {
                    font-size: 1.5rem;
                }

                .settings-item {
                    flex-direction: column;
                    align-items: flex-start;
                }

                mat-slide-toggle,
                mat-form-field {
                    margin-left: 0;
                    margin-top: 1rem;
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
