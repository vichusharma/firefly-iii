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
import { AuthService } from "@core/services/auth.service";

@Component({
    selector: "app-profile-page",
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
        <div class="profile-container">
            <div class="profile-header">
                <h1>User Profile</h1>
                <p>Manage your account information</p>
            </div>

            <div class="profile-content">
                <mat-card class="profile-card">
                    <mat-card-header>
                        <mat-card-title>Profile Information</mat-card-title>
                    </mat-card-header>
                    <mat-card-content>
                        <div class="profile-form">
                            <mat-form-field class="full-width">
                                <mat-label>Email</mat-label>
                                <input
                                    matInput
                                    type="email"
                                    placeholder="Your email"
                                    disabled
                                />
                                <mat-icon matSuffix>email</mat-icon>
                            </mat-form-field>

                            <mat-form-field class="full-width">
                                <mat-label>First Name</mat-label>
                                <input
                                    matInput
                                    type="text"
                                    placeholder="First name"
                                    disabled
                                />
                                <mat-icon matSuffix>person</mat-icon>
                            </mat-form-field>

                            <mat-form-field class="full-width">
                                <mat-label>Last Name</mat-label>
                                <input
                                    matInput
                                    type="text"
                                    placeholder="Last name"
                                    disabled
                                />
                                <mat-icon matSuffix>person</mat-icon>
                            </mat-form-field>

                            <mat-form-field class="full-width">
                                <mat-label>Account Created</mat-label>
                                <input
                                    matInput
                                    type="text"
                                    placeholder="Account creation date"
                                    disabled
                                />
                                <mat-icon matSuffix>calendar_today</mat-icon>
                            </mat-form-field>
                        </div>

                        <mat-divider class="divider"></mat-divider>

                        <div class="form-actions">
                            <button mat-raised-button color="primary" disabled>
                                <mat-icon>edit</mat-icon>
                                Edit Profile
                            </button>
                            <button mat-stroked-button color="accent">
                                <mat-icon>lock</mat-icon>
                                Change Password
                            </button>
                        </div>
                    </mat-card-content>
                </mat-card>

                <mat-card class="profile-card">
                    <mat-card-header>
                        <mat-card-title>Account Settings</mat-card-title>
                    </mat-card-header>
                    <mat-card-content>
                        <p>
                            Two-Factor Authentication:
                            <strong>Not Enabled</strong>
                        </p>
                        <button mat-stroked-button color="primary" disabled>
                            <mat-icon>security</mat-icon>
                            Enable 2FA
                        </button>
                    </mat-card-content>
                </mat-card>
            </div>
        </div>
    `,
    styles: [
        `
            .profile-container {
                max-width: 900px;
                margin: 0 auto;
                padding: 2rem;
            }

            .profile-header {
                margin-bottom: 2rem;
            }

            .profile-header h1 {
                margin: 0;
                font-size: 2rem;
                color: #1e293b;
            }

            .profile-header p {
                color: #64748b;
                margin: 0.5rem 0 0 0;
            }

            .profile-content {
                display: grid;
                gap: 2rem;
            }

            .profile-card {
                border: 1px solid #e2e8f0;
                border-radius: 8px;
            }

            .profile-form {
                display: grid;
                gap: 1.5rem;
            }

            .full-width {
                width: 100%;
            }

            .divider {
                margin: 1.5rem 0;
            }

            .form-actions {
                display: flex;
                gap: 1rem;
                flex-wrap: wrap;
            }

            button mat-icon {
                margin-right: 0.5rem;
            }

            @media (max-width: 768px) {
                .profile-container {
                    padding: 1rem;
                }

                .profile-header h1 {
                    font-size: 1.5rem;
                }
            }
        `,
    ],
})
export class ProfilePageComponent implements OnInit {
    constructor(
        private authService: AuthService,
        private router: Router,
    ) {}

    ngOnInit(): void {}
}
