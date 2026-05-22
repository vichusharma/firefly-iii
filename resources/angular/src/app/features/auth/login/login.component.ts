// src/app/features/auth/login/login.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatCheckboxModule,
    MatIconModule,
  ],
  template: `
    <div class="login-container">
      <div class="gradient-blur"></div>
      <div class="stars"></div>
      
      <mat-card class="login-card">
        <div class="card-header-gradient"></div>
        
        <mat-card-header>
          <div class="logo">
            <mat-icon class="logo-icon">trending_up</mat-icon>
          </div>
          <h1>Firefly III</h1>
          <p>Personal Finance Manager</p>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
            <mat-form-field appearance="outline" class="full-width input-field">
              <mat-label>Email Address</mat-label>
              <input matInput formControlName="email" type="email" placeholder=" " />
              <mat-error *ngIf="loginForm.get('email')?.hasError('required')">
                Email is required
              </mat-error>
              <mat-error *ngIf="loginForm.get('email')?.hasError('email')">
                Please enter a valid email
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width input-field">
              <mat-label>Password</mat-label>
              <input matInput formControlName="password" type="password" placeholder=" " />
              <mat-error *ngIf="loginForm.get('password')?.hasError('required')">
                Password is required
              </mat-error>
            </mat-form-field>

            <mat-checkbox formControlName="rememberMe" class="remember-checkbox">
              Remember me
            </mat-checkbox>

            <div *ngIf="error" class="error-message">
              <mat-icon>error</mat-icon>
              {{ error }}
            </div>

            <button
              mat-raised-button
              color="primary"
              type="submit"
              class="full-width login-button"
              [disabled]="loginForm.invalid || isLoading"
            >
              <mat-icon *ngIf="!isLoading">login</mat-icon>
              {{ isLoading ? 'Logging in...' : 'Sign In' }}
            </button>
          </form>

          <div class="signin-footer">
            <p>Enter your credentials to access your financial dashboard</p>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    :host {
      --primary-gradient: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
      --accent-gradient: linear-gradient(45deg, #3b82f6 0%, #06b6d4 100%);
      --success-gradient: linear-gradient(135deg, #10b981 0%, #059669 100%);
    }

    .login-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 25%, #1e3a5f 50%, #1e293b 75%, #0f172a 100%);
      position: relative;
      overflow: hidden;
    }

    .gradient-blur {
      position: absolute;
      top: -50%;
      right: -10%;
      width: 500px;
      height: 500px;
      background: radial-gradient(circle, rgba(59, 130, 246, 0.15), transparent 70%);
      border-radius: 50%;
      filter: blur(40px);
      animation: float 6s ease-in-out infinite;
    }

    .stars {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-image: 
        radial-gradient(2px 2px at 20px 30px, #eee, rgba(0,0,0,0)),
        radial-gradient(2px 2px at 60px 70px, #fff, rgba(0,0,0,0)),
        radial-gradient(1px 1px at 50px 50px, #fff, rgba(0,0,0,0));
      background-size: 200px 200px;
      opacity: 0.3;
    }

    @keyframes float {
      0%, 100% { transform: translateY(0px) translateX(0px); }
      50% { transform: translateY(-20px) translateX(10px); }
    }

    .login-card {
      width: 100%;
      max-width: 420px;
      padding: 0;
      border-radius: 20px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 60px rgba(59, 130, 246, 0.1);
      position: relative;
      z-index: 10;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .card-header-gradient {
      height: 6px;
      background: linear-gradient(90deg, #3b82f6 0%, #06b6d4 50%, #10b981 100%);
    }

    mat-card-header {
      text-align: center;
      padding: 2rem 2rem 1rem 2rem;
      background: rgba(255, 255, 255, 0.03);
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }

    .logo {
      display: flex;
      justify-content: center;
      margin-bottom: 1rem;
    }

    .logo-icon {
      font-size: 2.5rem;
      width: 2.5rem;
      height: 2.5rem;
      color: #3b82f6;
      background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    mat-card-header h1 {
      margin: 0.5rem 0 0.25rem 0;
      font-size: 1.8rem;
      font-weight: 700;
      background: linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    mat-card-header p {
      margin: 0;
      font-size: 0.9rem;
      color: #94a3b8;
    }

    mat-card-content {
      padding: 2rem;
    }

    mat-form-field {
      display: block;
      margin-bottom: 1.5rem;
      width: 100%;
    }

    .input-field {
      margin-bottom: 1.5rem !important;
    }

    ::ng-deep .mat-mdc-form-field {
      width: 100%;
    }

    ::ng-deep .mat-mdc-form-field-label {
      color: #94a3b8 !important;
      font-size: 0.95rem;
      top: 20px !important;
    }

    ::ng-deep .mat-mdc-form-field.mat-focused .mat-mdc-form-field-label,
    ::ng-deep .mat-mdc-form-field.mat-form-field-invalid .mat-mdc-form-field-label {
      top: -6px !important;
    }

    ::ng-deep .mat-mdc-text-field-wrapper {
      padding-bottom: 0;
    }

    ::ng-deep .mdc-notched-outline__leading,
    ::ng-deep .mdc-notched-outline__notch,
    ::ng-deep .mdc-notched-outline__trailing {
      border-color: rgba(255, 255, 255, 0.2) !important;
    }

    ::ng-deep .mat-mdc-form-field-focused .mdc-notched-outline__leading,
    ::ng-deep .mat-mdc-form-field-focused .mdc-notched-outline__notch,
    ::ng-deep .mat-mdc-form-field-focused .mdc-notched-outline__trailing {
      border-color: #3b82f6 !important;
    }

    ::ng-deep .mat-mdc-form-field-form-control {
      color: #e2e8f0 !important;
    }

    ::ng-deep .mat-mdc-form-field-form-control::placeholder {
      color: #64748b !important;
    }

    ::ng-deep .mat-mdc-form-field input {
      background: transparent;
      color: #e2e8f0;
      padding: 12px 16px !important;
    }

    ::ng-deep .mat-mdc-form-field input::placeholder {
      color: #64748b;
      opacity: 0.7;
    }

    ::ng-deep .mat-mdc-form-field-error {
      font-size: 0.75rem;
      color: #fca5a5;
    }

    .remember-checkbox {
      display: block;
      margin-bottom: 1.5rem;
      color: #cbd5e1;
    }

    .error-message {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      color: #fca5a5;
      margin: 1.5rem 0;
      padding: 0.75rem 1rem;
      background: rgba(220, 38, 38, 0.1);
      border-radius: 0.75rem;
      border-left: 3px solid #dc2626;
      font-size: 0.875rem;
    }

    .error-message mat-icon {
      font-size: 1.25rem;
      width: 1.25rem;
      height: 1.25rem;
    }

    .login-button {
      width: 100%;
      height: 3rem;
      font-size: 1rem;
      font-weight: 600;
      border-radius: 0.75rem;
      background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%) !important;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      margin-top: 0.5rem;
    }

    .login-button:hover:not([disabled]) {
      box-shadow: 0 15px 30px rgba(59, 130, 246, 0.3);
      transform: translateY(-2px);
      transition: all 0.3s ease;
    }

    .signin-footer {
      text-align: center;
      margin-top: 2rem;
      padding-top: 1.5rem;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
    }

    .signin-footer p {
      font-size: 0.8rem;
      color: #64748b;
      margin: 0;
    }
  `],
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  isLoading = false;
  error: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      rememberMe: [false],
    });
  }

  ngOnInit(): void {
    if (this.authService.isAuthenticated) {
      this.router.navigate(['/dashboard']);
    }
  }

  onSubmit(): void {
    if (this.loginForm.invalid) return;
    this.isLoading = true;
    this.error = null;

    const { email, password } = this.loginForm.value;
    this.authService.login(email, password).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (error) => {
        this.isLoading = false;
        this.error = error.message || 'Login failed. Please try again.';
      },
    });
  }
}
