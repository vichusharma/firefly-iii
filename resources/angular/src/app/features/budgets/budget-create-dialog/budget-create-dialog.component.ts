import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '@core/services/api.service';

@Component({
  selector: 'app-budget-create-dialog',
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
    MatCheckboxModule,
    MatIconModule,
  ],
  template: `
    <div class="dialog-wrapper">
      <div class="dialog-header">
        <h2>Create New Budget</h2>
        <button mat-icon-button (click)="dialogRef.close()" class="close-btn">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <form [formGroup]="budgetForm" (ngSubmit)="onSubmit()">
        <div class="form-content">
          <!-- Budget Name -->
          <mat-form-field appearance="fill" class="full-width">
            <mat-label>Budget Name</mat-label>
            <input
              matInput
              formControlName="name"
              placeholder="e.g., Groceries, Entertainment"
              required
            />
            <mat-error *ngIf="budgetForm.get('name')?.hasError('required')">
              Budget name is required
            </mat-error>
            <mat-error *ngIf="budgetForm.get('name')?.hasError('maxlength')">
              Name must be less than 255 characters
            </mat-error>
          </mat-form-field>

          <!-- Auto Budget Type -->
          <mat-form-field appearance="fill" class="full-width">
            <mat-label>Budget Type</mat-label>
            <mat-select formControlName="auto_budget_type" (selectionChange)="onBudgetTypeChange()">
              <mat-option value="0">No automatic budget</mat-option>
              <mat-option value="1">Reset budget on period</mat-option>
              <mat-option value="2">Rollover remaining amount</mat-option>
              <mat-option value="3">Adjusted budget amount</mat-option>
            </mat-select>
            <mat-hint>Choose how the budget should behave</mat-hint>
          </mat-form-field>

          <!-- Budget Amount (if auto budget is enabled) -->
          <mat-form-field appearance="fill" class="full-width" *ngIf="showBudgetAmount">
            <mat-label>Budget Amount</mat-label>
            <input
              matInput
              formControlName="auto_budget_amount"
              type="number"
              step="0.01"
              placeholder="0.00"
            />
            <mat-hint>Amount for this budget period</mat-hint>
          </mat-form-field>

          <!-- Budget Period (if auto budget is enabled) -->
          <mat-form-field appearance="fill" class="full-width" *ngIf="showBudgetPeriod">
            <mat-label>Budget Period</mat-label>
            <mat-select formControlName="auto_budget_period">
              <mat-option value="daily">Daily</mat-option>
              <mat-option value="weekly">Weekly</mat-option>
              <mat-option value="monthly" selected>Monthly</mat-option>
              <mat-option value="quarterly">Quarterly</mat-option>
              <mat-option value="half_year">Half Year</mat-option>
              <mat-option value="yearly">Yearly</mat-option>
            </mat-select>
          </mat-form-field>

          <!-- Currency -->
          <mat-form-field appearance="fill" class="full-width">
            <mat-label>Currency</mat-label>
            <mat-select formControlName="auto_budget_currency_id">
              <mat-option value="USD">USD (US Dollar)</mat-option>
              <mat-option value="EUR">EUR (Euro)</mat-option>
              <mat-option value="GBP">GBP (British Pound)</mat-option>
              <mat-option value="JPY">JPY (Japanese Yen)</mat-option>
              <mat-option value="CHF">CHF (Swiss Franc)</mat-option>
              <mat-option value="CAD">CAD (Canadian Dollar)</mat-option>
              <mat-option value="AUD">AUD (Australian Dollar)</mat-option>
            </mat-select>
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
            <mat-hint>Optional notes for this budget</mat-hint>
          </mat-form-field>

          <!-- Active -->
          <div class="checkbox-group">
            <mat-checkbox formControlName="active">
              Active budget
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
            [disabled]="!budgetForm.valid || isSubmitting"
          >
            {{ isSubmitting ? 'Creating...' : 'Create Budget' }}
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
export class BudgetCreateDialogComponent implements OnInit {
  budgetForm: FormGroup;
  isSubmitting = false;
  showBudgetAmount = false;
  showBudgetPeriod = false;

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    public dialogRef: MatDialogRef<BudgetCreateDialogComponent>
  ) {
    this.budgetForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(255)]],
      auto_budget_type: ['0'],
      auto_budget_amount: [null],
      auto_budget_period: ['monthly'],
      auto_budget_currency_id: ['EUR'],
      notes: [''],
      active: [true],
    });
  }

  ngOnInit(): void {
    this.onBudgetTypeChange();
  }

  onBudgetTypeChange(): void {
    const budgetType = this.budgetForm.get('auto_budget_type')?.value;
    const amountControl = this.budgetForm.get('auto_budget_amount');
    
    this.showBudgetAmount = budgetType !== '0';
    this.showBudgetPeriod = budgetType !== '0';
    
    if (budgetType !== '0') {
      amountControl?.setValidators([Validators.required, Validators.min(0.01)]);
    } else {
      amountControl?.clearValidators();
    }
    amountControl?.updateValueAndValidity();
  }

  onSubmit(): void {
    if (!this.budgetForm.valid) {
      return;
    }

    this.isSubmitting = true;
    const formData = this.budgetForm.value;

    const payload = {
      name: formData.name,
      active: formData.active ? 1 : 0,
      auto_budget_type: formData.auto_budget_type ? parseInt(formData.auto_budget_type) : 0,
      auto_budget_amount: formData.auto_budget_amount,
      auto_budget_period: formData.auto_budget_period,
      auto_budget_currency_id: formData.auto_budget_currency_id,
      notes: formData.notes,
    };

    this.apiService.post('budgets', payload).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.dialogRef.close(response);
      },
      error: (err) => {
        this.isSubmitting = false;
        console.error('Error creating budget:', err);
        alert('Error creating budget: ' + (err.error?.message || err.message));
      },
    });
  }
}
