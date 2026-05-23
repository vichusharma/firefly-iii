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
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '@core/services/api.service';

interface AccountOption {
  id: string;
  name: string;
  type?: string;
}

interface CategoryOption {
  id: string;
  name: string;
}

interface BudgetOption {
  id: string;
  name: string;
}

@Component({
  selector: 'app-transaction-create-dialog',
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
    MatIconModule,
  ],
  template: `
    <div class="dialog-wrapper">
      <div class="dialog-header">
        <h2>Create New Transaction</h2>
        <button mat-icon-button (click)="dialogRef.close()" class="close-btn" type="button">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <form [formGroup]="transactionForm" (ngSubmit)="onSubmit()" class="dialog-form">
        <div class="form-content">
          <fieldset class="form-section">
            <legend class="form-section-title">Basic transaction information</legend>

            <div class="form-row">
              <div class="form-label">Transaction type</div>
              <div class="form-control-group">
                <mat-form-field appearance="outline" class="dialog-form-field">
                  <mat-label>Transaction type</mat-label>
                  <mat-select formControlName="type" (selectionChange)="onTypeChange()">
                    <mat-option value="transfer">Transfer</mat-option>
                    <mat-option value="withdrawal">Withdrawal</mat-option>
                    <mat-option value="deposit">Deposit</mat-option>
                  </mat-select>
                </mat-form-field>
              </div>
            </div>

            <div class="form-row">
              <div class="form-label">Description</div>
              <div class="form-control-group">
                <mat-form-field appearance="outline" class="dialog-form-field">
                  <mat-label>Description</mat-label>
                  <input matInput formControlName="description" placeholder="What happened?" required />
                  <mat-error *ngIf="transactionForm.get('description')?.hasError('required')">
                    A description is required.
                  </mat-error>
                  <mat-error *ngIf="transactionForm.get('description')?.hasError('maxlength')">
                    Description must be 1000 characters or less.
                  </mat-error>
                </mat-form-field>
              </div>
            </div>

            <div class="form-row">
              <div class="form-label">{{ isTransfer ? 'Accounts' : (showSourceAccount ? 'From account' : 'To account') }}</div>
              <div class="form-control-group">
                <div class="form-field-grid" [class.columns-2]="isTransfer">
                  <mat-form-field appearance="outline" class="dialog-form-field" *ngIf="showSourceAccount">
                    <mat-label>From account</mat-label>
                    <mat-select formControlName="source_account_id">
                      <mat-option *ngFor="let account of accounts" [value]="account.id">
                        {{ account.name }}<span *ngIf="account.type"> ({{ account.type }})</span>
                      </mat-option>
                    </mat-select>
                    <mat-error *ngIf="transactionForm.get('source_account_id')?.hasError('required')">
                      From account is required.
                    </mat-error>
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="dialog-form-field" *ngIf="showDestinationAccount">
                    <mat-label>To account</mat-label>
                    <mat-select formControlName="destination_account_id">
                      <mat-option *ngFor="let account of accounts" [value]="account.id">
                        {{ account.name }}<span *ngIf="account.type"> ({{ account.type }})</span>
                      </mat-option>
                    </mat-select>
                    <mat-error *ngIf="transactionForm.get('destination_account_id')?.hasError('required')">
                      To account is required.
                    </mat-error>
                  </mat-form-field>
                </div>
              </div>
            </div>

            <div class="form-row">
              <div class="form-label">Date and amount</div>
              <div class="form-control-group">
                <div class="form-field-grid">
                  <mat-form-field appearance="outline" class="dialog-form-field">
                    <mat-label>Date</mat-label>
                    <input matInput [matDatepicker]="datePicker" formControlName="date" required />
                    <mat-datepicker-toggle matSuffix [for]="datePicker"></mat-datepicker-toggle>
                    <mat-datepicker #datePicker></mat-datepicker>
                    <mat-error *ngIf="transactionForm.get('date')?.hasError('required')">
                      Date is required.
                    </mat-error>
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="dialog-form-field">
                    <mat-label>Amount</mat-label>
                    <input matInput formControlName="amount" type="number" step="0.01" required />
                    <mat-error *ngIf="transactionForm.get('amount')?.hasError('required')">
                      Amount is required.
                    </mat-error>
                    <mat-error *ngIf="transactionForm.get('amount')?.hasError('min')">
                      Amount must be greater than zero.
                    </mat-error>
                  </mat-form-field>
                </div>
              </div>
            </div>
          </fieldset>

          <fieldset class="form-section">
            <legend class="form-section-title">Categorisation</legend>

            <div class="form-row">
              <div class="form-label">Category, budget and tags</div>
              <div class="form-control-group">
                <div class="form-field-grid columns-3">
                  <mat-form-field appearance="outline" class="dialog-form-field">
                    <mat-label>Category</mat-label>
                    <mat-select formControlName="category_id">
                      <mat-option value="">No category</mat-option>
                      <mat-option *ngFor="let category of categories" [value]="category.id">
                        {{ category.name }}
                      </mat-option>
                    </mat-select>
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="dialog-form-field">
                    <mat-label>Budget</mat-label>
                    <mat-select formControlName="budget_id">
                      <mat-option value="">No budget</mat-option>
                      <mat-option *ngFor="let budget of budgets" [value]="budget.id">
                        {{ budget.name }}
                      </mat-option>
                    </mat-select>
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="dialog-form-field">
                    <mat-label>Tags</mat-label>
                    <input matInput formControlName="tags" placeholder="Comma-separated tags" />
                  </mat-form-field>
                </div>
              </div>
            </div>
          </fieldset>

          <details class="optional-section">
            <summary class="optional-toggle">Optional details</summary>
            <div class="optional-body">
              <div class="form-row">
                <div class="form-label">Notes</div>
                <div class="form-control-group">
                  <mat-form-field appearance="outline" class="dialog-form-field">
                    <mat-label>Notes</mat-label>
                    <textarea matInput formControlName="notes" rows="4" placeholder="Additional notes"></textarea>
                  </mat-form-field>
                </div>
              </div>

              <div class="form-row">
                <div class="form-label">References</div>
                <div class="form-control-group">
                  <div class="form-field-grid">
                    <mat-form-field appearance="outline" class="dialog-form-field">
                      <mat-label>External URL</mat-label>
                      <input matInput formControlName="external_url" type="url" placeholder="https://example.com" />
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="dialog-form-field">
                      <mat-label>Internal reference</mat-label>
                      <input matInput formControlName="internal_reference" placeholder="Optional reference" />
                    </mat-form-field>
                  </div>
                </div>
              </div>
            </div>
          </details>
        </div>

        <div class="dialog-actions">
          <button mat-button (click)="dialogRef.close()" type="button">Cancel</button>
          <button mat-raised-button color="primary" type="submit" [disabled]="isSubmitting">
            {{ isSubmitting ? 'Creating...' : 'Create Transaction' }}
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

    .optional-section {
      border: 1px dashed rgba(148, 163, 184, 0.3);
      border-radius: 12px;
      background: rgba(15, 23, 42, 0.2);
    }

    .optional-toggle {
      list-style: none;
      cursor: pointer;
      padding: 1rem;
      color: #e2e8f0;
      font-weight: 600;
    }

    .optional-toggle::-webkit-details-marker {
      display: none;
    }

    .optional-body {
      padding: 0 1rem 1rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    textarea[matInput] {
      min-height: 96px;
      resize: vertical;
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
export class TransactionCreateDialogComponent implements OnInit {
  transactionForm: FormGroup;
  isSubmitting = false;
  accounts: AccountOption[] = [];
  categories: CategoryOption[] = [];
  budgets: BudgetOption[] = [];

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    public dialogRef: MatDialogRef<TransactionCreateDialogComponent>
  ) {
    this.transactionForm = this.fb.group({
      type: ['transfer', Validators.required],
      description: ['', [Validators.required, Validators.maxLength(1000)]],
      date: [new Date(), Validators.required],
      source_account_id: [''],
      destination_account_id: [''],
      amount: ['', [Validators.required, Validators.min(0.01)]],
      category_id: [''],
      budget_id: [''],
      tags: [''],
      notes: [''],
      internal_reference: [''],
      external_url: [''],
    });
  }

  get isTransfer(): boolean {
    return this.transactionForm.get('type')?.value === 'transfer';
  }

  get showSourceAccount(): boolean {
    return ['transfer', 'withdrawal'].includes(this.transactionForm.get('type')?.value);
  }

  get showDestinationAccount(): boolean {
    return ['transfer', 'deposit'].includes(this.transactionForm.get('type')?.value);
  }

  ngOnInit(): void {
    this.onTypeChange();
    this.loadAccounts();
    this.loadCategories();
    this.loadBudgets();
  }

  loadAccounts(): void {
    this.apiService.get<any>('accounts', { limit: 100 }).subscribe({
      next: (response: any) => {
        this.accounts = this.normalizeCollection<AccountOption>(response);
      },
      error: (err) => {
        console.error('Error loading accounts:', err);
      },
    });
  }

  loadCategories(): void {
    this.apiService.get<any>('categories', { limit: 100 }).subscribe({
      next: (response: any) => {
        this.categories = this.normalizeCollection<CategoryOption>(response);
      },
      error: (err) => {
        console.error('Error loading categories:', err);
      },
    });
  }

  loadBudgets(): void {
    this.apiService.get<any>('budgets', { limit: 100 }).subscribe({
      next: (response: any) => {
        this.budgets = this.normalizeCollection<BudgetOption>(response);
      },
      error: (err) => {
        console.error('Error loading budgets:', err);
      },
    });
  }

  onTypeChange(): void {
    const type = this.transactionForm.get('type')?.value;
    const sourceControl = this.transactionForm.get('source_account_id');
    const destinationControl = this.transactionForm.get('destination_account_id');

    sourceControl?.clearValidators();
    destinationControl?.clearValidators();

    if (type === 'transfer' || type === 'withdrawal') {
      sourceControl?.setValidators([Validators.required]);
    }

    if (type === 'transfer' || type === 'deposit') {
      destinationControl?.setValidators([Validators.required]);
    }

    sourceControl?.updateValueAndValidity({ emitEvent: false });
    destinationControl?.updateValueAndValidity({ emitEvent: false });
  }

  onSubmit(): void {
    if (!this.transactionForm.valid) {
      this.transactionForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const formData = this.transactionForm.getRawValue();
    const transaction: Record<string, any> = {
      type: formData.type,
      date: formData.date,
      amount: formData.amount,
      description: formData.description,
    };

    if (this.showSourceAccount && formData.source_account_id) {
      transaction['source_id'] = formData.source_account_id;
    }
    if (this.showDestinationAccount && formData.destination_account_id) {
      transaction['destination_id'] = formData.destination_account_id;
    }
    if (formData.category_id) {
      transaction['category_id'] = formData.category_id;
    }
    if (formData.budget_id) {
      transaction['budget_id'] = formData.budget_id;
    }
    if (formData.tags) {
      transaction['tags'] = formData.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean);
    }
    if (formData.notes) {
      transaction['notes'] = formData.notes;
    }
    if (formData.internal_reference) {
      transaction['internal_reference'] = formData.internal_reference;
    }
    if (formData.external_url) {
      transaction['external_url'] = formData.external_url;
    }

    const payload = { transactions: [transaction] };

    this.apiService.post('transactions', payload).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.dialogRef.close(response);
      },
      error: (err) => {
        this.isSubmitting = false;
        console.error('Error creating transaction:', err);
        alert('Error creating transaction: ' + (err.error?.message || err.message));
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
}
