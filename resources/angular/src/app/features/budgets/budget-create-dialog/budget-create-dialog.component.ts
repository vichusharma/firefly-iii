import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '@core/services/api.service';

interface CurrencyOption {
  id: string;
  code: string;
  name: string;
}

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
    MatCheckboxModule,
    MatIconModule,
  ],
  template: `
    <div class="dialog-wrapper">
      <div class="dialog-header">
        <h2>Create New Budget</h2>
        <button mat-icon-button (click)="dialogRef.close()" class="close-btn" type="button">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <form [formGroup]="budgetForm" (ngSubmit)="onSubmit()" class="dialog-form">
        <div class="form-content">
          <fieldset class="form-section">
            <legend class="form-section-title">Budget details</legend>

            <div class="form-row">
              <div class="form-label">Budget name</div>
              <div class="form-control-group">
                <mat-form-field appearance="outline" class="dialog-form-field">
                  <mat-label>Budget name</mat-label>
                  <input matInput formControlName="name"  required />
                  <mat-error *ngIf="budgetForm.get('name')?.hasError('required')">
                    Budget name is required.
                  </mat-error>
                  <mat-error *ngIf="budgetForm.get('name')?.hasError('maxlength')">
                    Name must be 255 characters or less.
                  </mat-error>
                </mat-form-field>
              </div>
            </div>

            <div class="form-row">
              <div class="form-label">Budget type</div>
              <div class="form-control-group">
                <mat-form-field appearance="outline" class="dialog-form-field">
                  <mat-label>Budget type</mat-label>
                  <mat-select formControlName="auto_budget_type" (selectionChange)="onBudgetTypeChange()">
                    <mat-option value="none">No automatic budget</mat-option>
                    <mat-option value="reset">Reset budget on period</mat-option>
                    <mat-option value="rollover">Rollover remaining amount</mat-option>
                    <mat-option value="adjusted">Adjusted budget amount</mat-option>
                  </mat-select>
                </mat-form-field>
              </div>
            </div>

            <div class="form-row" *ngIf="showAutoBudgetFields">
              <div class="form-label">Budget amount</div>
              <div class="form-control-group">
                <div class="form-field-grid columns-3">
                  <mat-form-field appearance="outline" class="dialog-form-field">
                    <mat-label>Amount</mat-label>
                    <input matInput formControlName="auto_budget_amount" type="number" step="0.01"  />
                    <mat-error *ngIf="budgetForm.get('auto_budget_amount')?.hasError('required')">
                      Budget amount is required.
                    </mat-error>
                    <mat-error *ngIf="budgetForm.get('auto_budget_amount')?.hasError('min')">
                      Amount must be greater than zero.
                    </mat-error>
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="dialog-form-field">
                    <mat-label>Currency</mat-label>
                    <mat-select formControlName="auto_budget_currency_code">
                      <mat-option *ngFor="let currency of currencies" [value]="currency.code">
                        {{ currency.code }} · {{ currency.name }}
                      </mat-option>
                    </mat-select>
                    <mat-error *ngIf="budgetForm.get('auto_budget_currency_code')?.hasError('required')">
                      Currency is required.
                    </mat-error>
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="dialog-form-field">
                    <mat-label>Period</mat-label>
                    <mat-select formControlName="auto_budget_period">
                      <mat-option value="daily">Daily</mat-option>
                      <mat-option value="weekly">Weekly</mat-option>
                      <mat-option value="monthly">Monthly</mat-option>
                      <mat-option value="quarterly">Quarterly</mat-option>
                      <mat-option value="half_year">Half year</mat-option>
                      <mat-option value="yearly">Yearly</mat-option>
                    </mat-select>
                    <mat-error *ngIf="budgetForm.get('auto_budget_period')?.hasError('required')">
                      Period is required.
                    </mat-error>
                  </mat-form-field>
                </div>
              </div>
            </div>
          </fieldset>

          <fieldset class="form-section">
            <legend class="form-section-title">Optional settings</legend>

            <div class="form-row">
              <div class="form-label">Notes</div>
              <div class="form-control-group">
                <mat-form-field appearance="outline" class="dialog-form-field">
                  <mat-label>Notes</mat-label>
                  <textarea matInput formControlName="notes" rows="4" ></textarea>
                </mat-form-field>
              </div>
            </div>

            <div class="form-row form-row-checkboxes">
              <div class="form-label">Options</div>
              <div class="form-control-group">
                <mat-checkbox formControlName="active">Active budget</mat-checkbox>
              </div>
            </div>
          </fieldset>
        </div>

        <div class="dialog-actions">
          <button mat-button (click)="dialogRef.close()" type="button">Cancel</button>
          <button mat-raised-button color="primary" type="submit" [disabled]="isSubmitting">
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
export class BudgetCreateDialogComponent implements OnInit {
  budgetForm: FormGroup;
  isSubmitting = false;
  showAutoBudgetFields = false;
  currencies: CurrencyOption[] = [];

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    public dialogRef: MatDialogRef<BudgetCreateDialogComponent>
  ) {
    this.budgetForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(255)]],
      auto_budget_type: ['none'],
      auto_budget_amount: [null],
      auto_budget_period: ['monthly'],
      auto_budget_currency_code: ['EUR'],
      notes: [''],
      active: [true],
    });
  }

  ngOnInit(): void {
    this.loadCurrencies();
    this.onBudgetTypeChange();
  }

  loadCurrencies(): void {
    this.apiService.get<any>('currencies', { limit: 100 }).subscribe({
      next: (response: any) => {
        this.currencies = this.normalizeCollection<CurrencyOption>(response);
      },
      error: (err) => {
        console.error('Error loading currencies:', err);
      },
    });
  }

  onBudgetTypeChange(): void {
    const budgetType = this.budgetForm.get('auto_budget_type')?.value;
    const amountControl = this.budgetForm.get('auto_budget_amount');
    const periodControl = this.budgetForm.get('auto_budget_period');
    const currencyControl = this.budgetForm.get('auto_budget_currency_code');

    this.showAutoBudgetFields = budgetType !== 'none';

    if (this.showAutoBudgetFields) {
      amountControl?.setValidators([Validators.required, Validators.min(0.01)]);
      periodControl?.setValidators([Validators.required]);
      currencyControl?.setValidators([Validators.required]);
    } else {
      amountControl?.clearValidators();
      periodControl?.clearValidators();
      currencyControl?.clearValidators();
    }

    amountControl?.updateValueAndValidity({ emitEvent: false });
    periodControl?.updateValueAndValidity({ emitEvent: false });
    currencyControl?.updateValueAndValidity({ emitEvent: false });
  }

  onSubmit(): void {
    if (!this.budgetForm.valid) {
      this.budgetForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const formData = this.budgetForm.getRawValue();
    const payload: Record<string, any> = {
      name: formData.name,
      active: formData.active,
      auto_budget_type: formData.auto_budget_type,
    };

    if (formData.notes) {
      payload['notes'] = formData.notes;
    }

    if (this.showAutoBudgetFields) {
      payload['auto_budget_amount'] = formData.auto_budget_amount;
      payload['auto_budget_period'] = formData.auto_budget_period;
      payload['auto_budget_currency_code'] = formData.auto_budget_currency_code;
    }

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
