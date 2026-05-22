import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '@core/services/api.service';

@Component({
  selector: 'app-account-create-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatCardModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCheckboxModule,
    MatIconModule,
  ],
  template: `
    <div class="dialog-wrapper">
      <div class="dialog-header">
        <h2>Create New Account</h2>
        <button mat-icon-button (click)="dialogRef.close()" class="close-btn">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <form [formGroup]="accountForm" (ngSubmit)="onSubmit()">
        <div class="form-content">
          <!-- Account Type -->
          <mat-form-field appearance="fill" class="full-width">
            <mat-label>Account Type</mat-label>
            <mat-select formControlName="type" (selectionChange)="onTypeChange()">
              <mat-option value="asset">Asset</mat-option>
              <mat-option value="liability">Liability</mat-option>
              <mat-option value="expense">Expense</mat-option>
              <mat-option value="revenue">Revenue</mat-option>
            </mat-select>
          </mat-form-field>

          <!-- Account Name -->
          <mat-form-field appearance="fill" class="full-width">
            <mat-label>Account Name</mat-label>
            <input
              matInput
              formControlName="name"
              placeholder="e.g., Checking Account, Credit Card"
              required
            />
            <mat-error *ngIf="accountForm.get('name')?.hasError('required')">
              Account name is required
            </mat-error>
            <mat-error *ngIf="accountForm.get('name')?.hasError('maxlength')">
              Name must be less than 1024 characters
            </mat-error>
          </mat-form-field>

          <!-- Currency (for asset/liability) -->
          <mat-form-field appearance="fill" class="full-width" *ngIf="showCurrency">
            <mat-label>Currency</mat-label>
            <mat-select formControlName="currency_code">
              <mat-option value="USD">USD (US Dollar)</mat-option>
              <mat-option value="EUR">EUR (Euro)</mat-option>
              <mat-option value="GBP">GBP (British Pound)</mat-option>
              <mat-option value="JPY">JPY (Japanese Yen)</mat-option>
              <mat-option value="CHF">CHF (Swiss Franc)</mat-option>
              <mat-option value="CAD">CAD (Canadian Dollar)</mat-option>
              <mat-option value="AUD">AUD (Australian Dollar)</mat-option>
            </mat-select>
          </mat-form-field>

          <!-- Opening Balance (for asset/liability) -->
          <mat-form-field appearance="fill" class="full-width" *ngIf="showOpeningBalance">
            <mat-label>Opening Balance</mat-label>
            <input matInput formControlName="opening_balance" type="number" step="0.01" />
            <mat-hint>Starting balance for this account</mat-hint>
          </mat-form-field>

          <!-- Opening Balance Date (for asset/liability) -->
          <mat-form-field appearance="fill" class="full-width" *ngIf="showOpeningBalance">
            <mat-label>Opening Balance Date</mat-label>
            <input matInput [matDatepicker]="picker" formControlName="opening_balance_date" />
            <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
            <mat-datepicker #picker></mat-datepicker>
          </mat-form-field>

          <!-- IBAN -->
          <mat-form-field appearance="fill" class="full-width" *ngIf="showIban">
            <mat-label>IBAN</mat-label>
            <input matInput formControlName="iban" placeholder="Optional IBAN number" />
            <mat-hint>International Bank Account Number</mat-hint>
          </mat-form-field>

          <!-- BIC -->
          <mat-form-field appearance="fill" class="full-width" *ngIf="showBic">
            <mat-label>BIC</mat-label>
            <input matInput formControlName="bic" placeholder="Optional BIC code" maxlength="11" />
            <mat-hint>Bank Identifier Code (max 11 characters)</mat-hint>
          </mat-form-field>

          <!-- Account Number -->
          <mat-form-field appearance="fill" class="full-width" *ngIf="showAccountNumber">
            <mat-label>Account Number</mat-label>
            <input matInput formControlName="account_number" placeholder="Optional account number" />
          </mat-form-field>

          <!-- Virtual Balance (for asset) -->
          <mat-form-field appearance="fill" class="full-width" *ngIf="showVirtualBalance">
            <mat-label>Virtual Balance</mat-label>
            <input matInput formControlName="virtual_balance" type="number" step="0.01" />
            <mat-hint>Optional virtual balance</mat-hint>
          </mat-form-field>

          <!-- Include in Net Worth -->
          <div class="checkbox-group" *ngIf="showNetWorth">
            <mat-checkbox formControlName="include_net_worth">
              Include in net worth calculations
            </mat-checkbox>
          </div>

          <!-- Active -->
          <div class="checkbox-group">
            <mat-checkbox formControlName="active">
              Active account
            </mat-checkbox>
          </div>
        </div>

        <div class="dialog-actions">
          <button mat-button (click)="dialogRef.close()" type="button">
            Cancel
          </button>
          <button
            mat-raised-button
            color="primary"
            type="submit"
            [disabled]="!accountForm.valid || isSubmitting"
          >
            {{ isSubmitting ? 'Creating...' : 'Create Account' }}
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    :host {
      display: contents;
    }

    .dialog-wrapper {
      background: #1e293b;
      border-radius: 12px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      width: 100%;
    }

    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      flex-shrink: 0;
    }

    .dialog-header h2 {
      margin: 0;
      color: #f1f5f9;
      font-size: 1.25rem;
      font-weight: 600;
    }

    .close-btn {
      color: #94a3b8;
      margin-left: 1rem;
    }

    form {
      display: flex;
      flex-direction: column;
      height: fit-content;
      max-height: none;
      overflow: hidden;
    }

    .form-content {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      padding: 1.5rem;
      overflow-y: auto;
      height: fit-content;
      max-height: none;
      width: 100%;
      min-width: 0;
    }

    .form-content::-webkit-scrollbar {
      width: 8px;
    }

    .form-content::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.05);
    }

    .form-content::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.2);
      border-radius: 4px;
    }

    mat-form-field {
      width: 100%;
      color: #cbd5e1;
      display: block;
      box-sizing: border-box;
    }

    .full-width {
      width: 100%;
      display: block;
      box-sizing: border-box;
    }

    input[matInput],
    textarea[matInput],
    select {
      width: 100% !important;
      box-sizing: border-box !important;
    }

    .checkbox-group {
      display: flex;
      align-items: center;
      margin: 0.5rem 0;
      padding: 0.5rem 0;
    }

    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      padding: 1.5rem;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      background: rgba(0, 0, 0, 0.2);
      flex-shrink: 0;
    }

    button[mat-button] {
      color: #94a3b8;
      text-transform: uppercase;
      font-weight: 500;
    }

    button[mat-raised-button] {
      text-transform: uppercase;
      font-weight: 500;
    }

    button[mat-raised-button]:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `],
})
export class AccountCreateDialogComponent implements OnInit {
  accountForm: FormGroup;
  isSubmitting = false;

  showCurrency = true;
  showOpeningBalance = true;
  showIban = true;
  showBic = true;
  showAccountNumber = true;
  showVirtualBalance = true;
  showNetWorth = true;

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    public dialogRef: MatDialogRef<AccountCreateDialogComponent>
  ) {
    this.accountForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(1024)]],
      type: ['asset', Validators.required],
      account_role: ['defaultAsset'],
      currency_code: ['EUR'],
      opening_balance: [null],
      opening_balance_date: [null],
      iban: [''],
      bic: [''],
      account_number: [''],
      virtual_balance: [null],
      include_net_worth: [true],
      active: [true],
    });
  }

  ngOnInit(): void {
    this.onTypeChange();
  }

  onTypeChange(): void {
    const type = this.accountForm.get('type')?.value;

    this.showCurrency = ['asset', 'liability'].includes(type);
    this.showOpeningBalance = ['asset', 'liability'].includes(type);
    this.showVirtualBalance = type === 'asset';
    this.showNetWorth = ['asset', 'liability'].includes(type);
    this.showIban = ['asset', 'liability'].includes(type);
    this.showBic = ['asset', 'liability'].includes(type);
    this.showAccountNumber = ['asset', 'liability'].includes(type);
  }

  onSubmit(): void {
    if (!this.accountForm.valid) {
      return;
    }

    this.isSubmitting = true;
    const formData = this.accountForm.value;

    Object.keys(formData).forEach((key) => {
      if (formData[key] === null || formData[key] === '') {
        delete formData[key];
      }
    });

    this.apiService.post('accounts', formData).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.dialogRef.close(response);
      },
      error: (err) => {
        this.isSubmitting = false;
        console.error('Error creating account:', err);
        alert('Error creating account: ' + (err.error?.message || err.message));
      },
    });
  }
}

