import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '@core/services/api.service';

interface CurrencyOption {
  id: string;
  code: string;
  name: string;
  symbol?: string;
}

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
    MatDatepickerModule,
    MatNativeDateModule,
    MatCheckboxModule,
    MatIconModule,
  ],
  template: `
    <div class="dialog-wrapper">
      <div class="dialog-header">
        <h2>Create New Account</h2>
        <button mat-icon-button (click)="dialogRef.close()" class="close-btn" type="button">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <form [formGroup]="accountForm" (ngSubmit)="onSubmit()" class="dialog-form">
        <div class="form-content">
          <fieldset class="form-section">
            <legend class="form-section-title">Account details</legend>

            <div class="form-row">
              <div class="form-label">Account type</div>
              <div class="form-control-group">
                <mat-form-field appearance="outline" class="dialog-form-field">
                  <mat-label>Account type</mat-label>
                  <mat-select formControlName="type" (selectionChange)="onTypeChange()">
                    <mat-option value="asset">Asset</mat-option>
                    <mat-option value="liability">Liability</mat-option>
                    <mat-option value="expense">Expense</mat-option>
                    <mat-option value="revenue">Revenue</mat-option>
                  </mat-select>
                </mat-form-field>
              </div>
            </div>

            <div class="form-row">
              <div class="form-label">Account name</div>
              <div class="form-control-group">
                <mat-form-field appearance="outline" class="dialog-form-field">
                  <mat-label>Account name</mat-label>
                  <input
                    matInput
                    formControlName="name"
                    placeholder="e.g. Checking Account, Credit Card"
                    required
                  />
                  <mat-error *ngIf="accountForm.get('name')?.hasError('required')">
                    Account name is required.
                  </mat-error>
                  <mat-error *ngIf="accountForm.get('name')?.hasError('maxlength')">
                    Name must be less than 1024 characters.
                  </mat-error>
                </mat-form-field>
              </div>
            </div>

            <div class="form-row" *ngIf="showAccountRole">
              <div class="form-label">Account role</div>
              <div class="form-control-group">
                <mat-form-field appearance="outline" class="dialog-form-field">
                  <mat-label>Account role</mat-label>
                  <mat-select formControlName="account_role">
                    <mat-option *ngFor="let role of accountRoles; trackBy: trackByAccountRoleValue" [value]="role.value">
                      {{ role.label }}
                    </mat-option>
                  </mat-select>
                  <mat-error *ngIf="accountForm.get('account_role')?.hasError('required')">
                    Account role is required for asset accounts.
                  </mat-error>
                </mat-form-field>
              </div>
            </div>

            <div class="form-row" *ngIf="showCurrency">
              <div class="form-label">Currency</div>
              <div class="form-control-group">
                <mat-form-field appearance="outline" class="dialog-form-field">
                  <mat-label>Currency</mat-label>
                  <mat-select formControlName="currency_code">
                    <mat-option *ngIf="currenciesLoading" disabled>Loading currencies...</mat-option>
                    <mat-option *ngFor="let currency of currencies; trackBy: trackByCurrencyCode" [value]="currency.code">
                      {{ currency.code }} · {{ currency.name }}
                    </mat-option>
                  </mat-select>
                </mat-form-field>
              </div>
            </div>

            <div class="form-row" *ngIf="showOpeningBalance">
              <div class="form-label">Opening balance</div>
              <div class="form-control-group">
                <div class="form-field-grid">
                  <mat-form-field appearance="outline" class="dialog-form-field">
                    <mat-label>Amount</mat-label>
                    <input matInput formControlName="opening_balance" type="number" step="0.01" />
                    <mat-hint>Starting balance for this account</mat-hint>
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="dialog-form-field">
                    <mat-label>Balance date</mat-label>
                    <input matInput [matDatepicker]="openingBalancePicker" formControlName="opening_balance_date" />
                    <mat-datepicker-toggle matSuffix [for]="openingBalancePicker"></mat-datepicker-toggle>
                    <mat-datepicker #openingBalancePicker></mat-datepicker>
                    <mat-error *ngIf="accountForm.get('opening_balance_date')?.hasError('required')">
                      An opening balance date is required when an opening balance is entered.
                    </mat-error>
                  </mat-form-field>
                </div>
              </div>
            </div>

            <div class="form-row" *ngIf="showVirtualBalance">
              <div class="form-label">Virtual balance</div>
              <div class="form-control-group">
                <mat-form-field appearance="outline" class="dialog-form-field">
                  <mat-label>Virtual balance</mat-label>
                  <input matInput formControlName="virtual_balance" type="number" step="0.01" />
                  <mat-hint>Optional virtual balance shown alongside the real balance</mat-hint>
                </mat-form-field>
              </div>
            </div>
          </fieldset>

          <fieldset class="form-section" *ngIf="showIban || showBic || showAccountNumber">
            <legend class="form-section-title">Bank details</legend>

            <div class="form-row" *ngIf="showIban">
              <div class="form-label">IBAN</div>
              <div class="form-control-group">
                <mat-form-field appearance="outline" class="dialog-form-field">
                  <mat-label>IBAN</mat-label>
                  <input matInput formControlName="iban" placeholder="Optional IBAN number" />
                  <mat-hint>International Bank Account Number</mat-hint>
                </mat-form-field>
              </div>
            </div>

            <div class="form-row" *ngIf="showBic">
              <div class="form-label">BIC</div>
              <div class="form-control-group">
                <mat-form-field appearance="outline" class="dialog-form-field">
                  <mat-label>BIC</mat-label>
                  <input matInput formControlName="bic" maxlength="11" placeholder="Optional BIC code" />
                  <mat-hint>Bank Identifier Code</mat-hint>
                  <mat-error *ngIf="accountForm.get('bic')?.hasError('maxlength')">
                    BIC must be 11 characters or less.
                  </mat-error>
                </mat-form-field>
              </div>
            </div>

            <div class="form-row" *ngIf="showAccountNumber">
              <div class="form-label">Account number</div>
              <div class="form-control-group">
                <mat-form-field appearance="outline" class="dialog-form-field">
                  <mat-label>Account number</mat-label>
                  <input matInput formControlName="account_number" placeholder="Optional account number" />
                </mat-form-field>
              </div>
            </div>
          </fieldset>

          <fieldset class="form-section">
            <legend class="form-section-title">Preferences</legend>

            <div class="form-row form-row-checkboxes">
              <div class="form-label">Options</div>
              <div class="form-control-group">
                <div class="checkbox-stack">
                  <mat-checkbox formControlName="include_net_worth" *ngIf="showNetWorth">
                    Include in net worth calculations
                  </mat-checkbox>
                  <mat-checkbox formControlName="active">Active account</mat-checkbox>
                </div>
              </div>
            </div>
          </fieldset>
        </div>

        <div class="dialog-actions">
          <button mat-button (click)="dialogRef.close()" type="button">Cancel</button>
          <button mat-raised-button color="primary" type="submit" [disabled]="isSubmitting">
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

    .dialog-form {
      display: flex;
      flex-direction: column;
      min-height: 0;
    }

    .form-content {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      padding: 1rem;
      overflow-y: auto;
      min-height: 0;
    }

    legend.form-section-title {
      padding: 0 0.5rem;
    }

    .checkbox-stack {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
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

    @media (max-width: 768px) {
      .dialog-actions {
        flex-wrap: wrap;
      }

      .dialog-actions button {
        flex: 1 1 auto;
      }
    }
  `],
})
export class AccountCreateDialogComponent implements OnInit {
  accountForm: FormGroup;
  isSubmitting = false;
  currencies: CurrencyOption[] = [];
  currenciesLoading = false;

  accountRoles = [
    { value: 'defaultAsset', label: 'Default asset' },
    { value: 'sharedAsset', label: 'Shared asset' },
    { value: 'savingAsset', label: 'Savings account' },
    { value: 'ccAsset', label: 'Credit card' },
    { value: 'cashWalletAsset', label: 'Cash wallet' },
  ];

  showCurrency = true;
  showOpeningBalance = true;
  showIban = true;
  showBic = true;
  showAccountNumber = true;
  showVirtualBalance = true;
  showNetWorth = true;
  showAccountRole = true;

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
      bic: ['', Validators.maxLength(11)],
      account_number: [''],
      virtual_balance: [null],
      include_net_worth: [true],
      active: [true],
    });
  }

  ngOnInit(): void {
    // Show immediate fallback data while loading from API
    this.currencies = [
      { id: 'eur', code: 'EUR', name: 'Euro' },
      { id: 'usd', code: 'USD', name: 'US Dollar' },
      { id: 'gbp', code: 'GBP', name: 'British Pound' },
      { id: 'jpy', code: 'JPY', name: 'Japanese Yen' },
      { id: 'chf', code: 'CHF', name: 'Swiss Franc' },
    ];
    this.loadCurrencies();
    this.onTypeChange();
    // Set balance date to today by default
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    this.accountForm.get('opening_balance_date')?.setValue(today);
    this.accountForm.get('opening_balance')?.valueChanges.subscribe(() => {
      this.updateOpeningBalanceDateValidator();
    });
  }

  loadCurrencies(): void {
    this.currenciesLoading = true;
    this.apiService.get<any>('currencies', { limit: 100 }).subscribe({
      next: (response: any) => {
        const apiCurrencies = this.normalizeCollection<CurrencyOption>(response);
        // Only replace fallback if API returned data
        if (apiCurrencies && apiCurrencies.length > 0) {
          this.currencies = apiCurrencies;
        }
        // Sort currencies with EUR first
        this.currencies.sort((a, b) => {
          if (a.code === 'EUR') return -1;
          if (b.code === 'EUR') return 1;
          return a.code.localeCompare(b.code);
        });
        // Ensure EUR is set as default if not already set
        if (!this.accountForm.get('currency_code')?.value || this.accountForm.get('currency_code')?.value !== 'EUR') {
          this.accountForm.get('currency_code')?.setValue('EUR', { emitEvent: false });
        }
        this.currenciesLoading = false;
      },
      error: (err) => {
        console.error('Error loading currencies from API:', err);
        // Keep fallback currencies, just stop loading indicator
        this.currenciesLoading = false;
      },
    });
  }

  onTypeChange(): void {
    const type = this.accountForm.get('type')?.value;
    const accountRoleControl = this.accountForm.get('account_role');

    this.showCurrency = ['asset', 'liability'].includes(type);
    this.showOpeningBalance = ['asset', 'liability'].includes(type);
    this.showVirtualBalance = type === 'asset';
    this.showNetWorth = ['asset', 'liability'].includes(type);
    this.showIban = ['asset', 'liability'].includes(type);
    this.showBic = ['asset', 'liability'].includes(type);
    this.showAccountNumber = ['asset', 'liability'].includes(type);
    this.showAccountRole = type === 'asset';

    if (this.showAccountRole) {
      accountRoleControl?.setValidators([Validators.required]);
      if (!accountRoleControl?.value) {
        accountRoleControl?.setValue('defaultAsset');
      }
    } else {
      accountRoleControl?.clearValidators();
    }

    accountRoleControl?.updateValueAndValidity();
    this.updateOpeningBalanceDateValidator();
  }

  onSubmit(): void {
    if (!this.accountForm.valid) {
      this.accountForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const formData = { ...this.accountForm.getRawValue() };

    if (!this.showAccountRole) {
      delete formData.account_role;
    }
    if (!this.showCurrency) {
      delete formData.currency_code;
    }
    if (!this.showOpeningBalance) {
      delete formData.opening_balance;
      delete formData.opening_balance_date;
    }
    if (!this.showVirtualBalance) {
      delete formData.virtual_balance;
    }
    if (!this.showNetWorth) {
      delete formData.include_net_worth;
    }
    if (!this.showIban) {
      delete formData.iban;
    }
    if (!this.showBic) {
      delete formData.bic;
    }
    if (!this.showAccountNumber) {
      delete formData.account_number;
    }

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

  private normalizeCollection<T extends Record<string, any>>(response: any): T[] {
    const items = Array.isArray(response?.data)
      ? response.data
      : Array.isArray(response?.data?.data)
        ? response.data.data
        : [];

    return items.map((item: any) => {
      if (item?.attributes) {
        return { id: item.id, ...item.attributes } as T;
      }

      return item as T;
    });
  }

  private updateOpeningBalanceDateValidator(): void {
    const balanceControl = this.accountForm.get('opening_balance');
    const dateControl = this.accountForm.get('opening_balance_date');
    const hasOpeningBalance = balanceControl?.value !== null && balanceControl?.value !== '';

    if (this.showOpeningBalance && hasOpeningBalance) {
      dateControl?.setValidators([Validators.required]);
    } else {
      dateControl?.clearValidators();
    }

    dateControl?.updateValueAndValidity({ emitEvent: false });
  }

  trackByCurrencyCode(index: number, currency: CurrencyOption): string {
    return currency.code;
  }

  trackByAccountRoleValue(index: number, role: any): string {
    return role.value;
  }
}
