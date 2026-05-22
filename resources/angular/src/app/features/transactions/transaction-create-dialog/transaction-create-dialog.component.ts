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
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '@core/services/api.service';

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
    MatCardModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
  ],
  template: `
    <div class="dialog-wrapper">
      <div class="dialog-header">
        <h2>Create New Transaction</h2>
        <button mat-icon-button (click)="dialogRef.close()" class="close-btn">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <form [formGroup]="transactionForm" (ngSubmit)="onSubmit()">
        <div class="form-content">
          <!-- Transaction Type (auto-derived from accounts) -->
          <mat-form-field appearance="fill" class="full-width">
            <mat-label>Transaction Type</mat-label>
            <mat-select formControlName="type">
              <mat-option value="transfer">Transfer</mat-option>
              <mat-option value="withdrawal">Withdrawal (Expense)</mat-option>
              <mat-option value="deposit">Deposit (Income)</mat-option>
            </mat-select>
            <mat-hint>Select the type of transaction</mat-hint>
          </mat-form-field>

          <!-- Date -->
          <mat-form-field appearance="fill" class="full-width">
            <mat-label>Transaction Date</mat-label>
            <input matInput [matDatepicker]="datePicker" formControlName="date" required />
            <mat-datepicker-toggle matSuffix [for]="datePicker"></mat-datepicker-toggle>
            <mat-datepicker #datePicker></mat-datepicker>
          </mat-form-field>

          <!-- Source Account -->
          <mat-form-field appearance="fill" class="full-width">
            <mat-label>From Account</mat-label>
            <mat-select formControlName="source_account_id" required>
              <mat-option *ngFor="let account of accounts" [value]="account.id">
                {{ account.name }} ({{ account.type }})
              </mat-option>
            </mat-select>
            <mat-error *ngIf="transactionForm.get('source_account_id')?.hasError('required')">
              Source account is required
            </mat-error>
          </mat-form-field>

          <!-- Destination Account -->
          <mat-form-field appearance="fill" class="full-width">
            <mat-label>To Account</mat-label>
            <mat-select formControlName="destination_account_id" required>
              <mat-option *ngFor="let account of accounts" [value]="account.id">
                {{ account.name }} ({{ account.type }})
              </mat-option>
            </mat-select>
            <mat-error *ngIf="transactionForm.get('destination_account_id')?.hasError('required')">
              Destination account is required
            </mat-error>
          </mat-form-field>

          <!-- Amount -->
          <mat-form-field appearance="fill" class="full-width">
            <mat-label>Amount</mat-label>
            <input
              matInput
              formControlName="amount"
              type="number"
              step="0.01"
              required
              placeholder="0.00"
            />
            <mat-error *ngIf="transactionForm.get('amount')?.hasError('required')">
              Amount is required
            </mat-error>
          </mat-form-field>

          <!-- Description -->
          <mat-form-field appearance="fill" class="full-width">
            <mat-label>Description</mat-label>
            <input
              matInput
              formControlName="description"
              placeholder="Transaction details (optional)"
            />
            <mat-hint>Optional description for this transaction</mat-hint>
          </mat-form-field>

          <!-- Category -->
          <mat-form-field appearance="fill" class="full-width">
            <mat-label>Category</mat-label>
            <mat-select formControlName="category_id">
              <mat-option value="">No category</mat-option>
              <mat-option *ngFor="let cat of categories" [value]="cat.id">
                {{ cat.name }}
              </mat-option>
            </mat-select>
            <mat-hint>Optional category</mat-hint>
          </mat-form-field>

          <!-- Budget -->
          <mat-form-field appearance="fill" class="full-width">
            <mat-label>Budget</mat-label>
            <mat-select formControlName="budget_id">
              <mat-option value="">No budget</mat-option>
              <mat-option *ngFor="let budget of budgets" [value]="budget.id">
                {{ budget.name }}
              </mat-option>
            </mat-select>
            <mat-hint>Optional budget</mat-hint>
          </mat-form-field>

          <!-- Tags -->
          <mat-form-field appearance="fill" class="full-width">
            <mat-label>Tags</mat-label>
            <input matInput formControlName="tags" placeholder="Comma-separated tags" />
            <mat-hint>Optional tags for organization</mat-hint>
          </mat-form-field>

          <!-- Notes -->
          <mat-form-field appearance="fill" class="full-width">
            <mat-label>Notes</mat-label>
            <textarea
              matInput
              formControlName="notes"
              placeholder="Additional notes (optional)"
              rows="3"
            ></textarea>
          </mat-form-field>
        </div>

        <div class="dialog-actions">
          <button mat-button (click)="dialogRef.close()" type="button">
            Cancel
          </button>
          <button
            mat-raised-button
            color="primary"
            type="submit"
            [disabled]="!transactionForm.valid || isSubmitting"
          >
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

    form {
      display: flex;
      flex-direction: column;
      height: fit-content;
      overflow: hidden;
    }

    .form-content {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      padding: 1.5rem;
      overflow-y: auto;
      height: fit-content;
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

    textarea {
      color: #cbd5e1;
      background: rgba(255, 255, 255, 0.05);
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
export class TransactionCreateDialogComponent implements OnInit {
  transactionForm: FormGroup;
  isSubmitting = false;
  accounts: any[] = [];
  categories: any[] = [];
  budgets: any[] = [];

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    public dialogRef: MatDialogRef<TransactionCreateDialogComponent>
  ) {
    this.transactionForm = this.fb.group({
      type: ['transfer', Validators.required],
      date: [new Date().toISOString().split('T')[0], Validators.required],
      source_account_id: ['', Validators.required],
      destination_account_id: ['', Validators.required],
      amount: ['', [Validators.required, Validators.min(0.01)]],
      description: [''],
      category_id: [''],
      budget_id: [''],
      tags: [''],
      notes: [''],
    });
  }

  ngOnInit(): void {
    this.loadAccounts();
    this.loadCategories();
    this.loadBudgets();
  }

  loadAccounts(): void {
    this.apiService.get<any>('accounts').subscribe({
      next: (response: any) => {
        this.accounts = Array.isArray(response.data) ? response.data : response.data?.data || [];
      },
      error: (err) => {
        console.error('Error loading accounts:', err);
      },
    });
  }

  loadCategories(): void {
    this.apiService.get<any>('categories').subscribe({
      next: (response: any) => {
        this.categories = Array.isArray(response.data) ? response.data : response.data?.data || [];
      },
      error: (err) => {
        console.error('Error loading categories:', err);
      },
    });
  }

  loadBudgets(): void {
    this.apiService.get<any>('budgets').subscribe({
      next: (response: any) => {
        this.budgets = Array.isArray(response.data) ? response.data : response.data?.data || [];
      },
      error: (err) => {
        console.error('Error loading budgets:', err);
      },
    });
  }

  onSubmit(): void {
    if (!this.transactionForm.valid) {
      return;
    }

    this.isSubmitting = true;
    const formData = this.transactionForm.value;

    // Format data for API
    const payload = {
      transactions: [
        {
          type: formData.type,
          date: formData.date,
          amount: formData.amount,
          description: formData.description,
          source_id: formData.source_account_id,
          destination_id: formData.destination_account_id,
          category_id: formData.category_id || null,
          budget_id: formData.budget_id || null,
          tags: formData.tags ? formData.tags.split(',').map((t: string) => t.trim()) : [],
          notes: formData.notes,
        },
      ],
    };

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
}
