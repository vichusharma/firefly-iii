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
  ],
  template: `
    <div class="login-container">
      <mat-card class="login-card">
        <mat-card-header>
          <h1>Firefly III</h1>
          <p>Personal Finance Manager</p>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email</mat-label>
              <input matInput formControlName="email" type="email" />
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Password</mat-label>
              <input matInput formControlName="password" type="password" />
            </mat-form-field>

            <mat-checkbox formControlName="rememberMe">
              Remember me
            </mat-checkbox>

            <div *ngIf="error" class="error-message">
              {{ error }}
            </div>

            <button
              mat-raised-button
              color="primary"
              type="submit"
              class="full-width"
              [disabled]="loginForm.invalid || isLoading"
            >
              {{ isLoading ? 'Logging in...' : 'Login' }}
            </button>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    .login-card {
      width: 100%;
      max-width: 400px;
      padding: 2rem;
    }

    mat-card-header {
      text-align: center;
      margin-bottom: 2rem;
    }

    mat-card-header h1 {
      margin: 0;
      font-size: 2rem;
      color: #6750a4;
    }

    .full-width {
      width: 100%;
      margin-bottom: 1rem;
    }

    mat-checkbox {
      display: block;
      margin-bottom: 1.5rem;
    }

    .error-message {
      color: #b3261e;
      margin: 1rem 0;
      padding: 0.75rem;
      background: #f9dedc;
      border-radius: 0.5rem;
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
