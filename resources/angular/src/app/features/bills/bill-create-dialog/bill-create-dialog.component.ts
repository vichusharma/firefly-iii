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
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { ApiService } from '@core/services/api.service';

interface CurrencyOption {
  id: string;
  code: string;
  name: string;
}

@Component({
  selector: 'app-bill-create-dialog',
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
    MatDatepickerModule,
    MatNativeDateModule,
  ],
  template: `
    <div class="dialog-wrapper">
      <div class="dialog-header">
        <h2>Create New Bill</h2>
        <button mat-icon-button (click)="dialogRef.close()" class="close-btn" type="button">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <form [formGroup]="billForm" (ngSubmit)="onSubmit()" class="dialog-form">
        <div class="form-content">
          <fieldset class="form-section">
            <legend class="form-section-title">Bill details</legend>

            <div class="form-row">
              <div class="form-label">Bill name</div>
              <div class="form-control-group">
                <mat-form-field appearance="outline" class="dialog-form-field">
                  <mat-label>Bill name</mat-label>
                  <input matInput formControlName="name" required />
                  <mat-error *ngIf="billForm.get('name')?.hasError('required')">
                    Bill name is required.
                  </mat-error>
                </mat-form-field>
              </div>
            </div>

            <div class="form-row">
              <div class="form-label">Amount range</div>
              <div class="form-control-group">
                <div class="form-field-grid columns-2">
                  <mat-form-field appearance="outline" class="dialog-form-field">
                    <mat-label>Minimum amount</mat-label>
                    <input matInput formControlName="amount_min" type="number" step="0.01" required />
                    <mat-error *ngIf="billForm.get('amount_min')?.hasError('required')">
                      Minimum amount is required.
                    </mat-error>
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="dialog-form-field">
                    <mat-label>Maximum amount</mat-label>
                    <input matInput formControlName="amount_max" type="number" step="0.01" required />
                    <mat-error *ngIf="billForm.get('amount_max')?.hasError('required')">
                      Maximum amount is required.
                    </mat-error>
                  </mat-form-field>
                </div>
              </div>
            </div>

            <div class="form-row">
              <div class="form-label">Bill frequency</div>
              <div class="form-control-group">
                <mat-form-field appearance="outline" class="dialog-form-field">
                  <mat-label>Repeat frequency</mat-label>
                  <mat-select formControlName="repeat_freq" required>
                    <mat-option value="daily">Daily</mat-option>
                    <mat-option value="weekly">Weekly</mat-option>
                    <mat-option value="monthly">Monthly</mat-option>
                    <mat-option value="quarterly">Quarterly</mat-option>
                    <mat-option value="half-yearly">Half-yearly</mat-option>
                    <mat-option value="yearly">Yearly</mat-option>
                  </mat-select>
                  <mat-error *ngIf="billForm.get('repeat_freq')?.hasError('required')">
                    Frequency is required.
                  </mat-error>
                </mat-form-field>
              </div>
            </div>

            <div class="form-row">
              <div class="form-label">Next date</div>
              <div class="form-control-group">
                <mat-form-field appearance="outline" class="dialog-form-field">
                  <mat-label>Next expected date</mat-label>
                  <input matInput [matDatepicker]="datePicker" formControlName="date" required />
                  <mat-datepicker-toggle matSuffix [for]="datePicker"></mat-datepicker-toggle>
                  <mat-datepicker #datePicker></mat-datepicker>
                  <mat-error *ngIf="billForm.get('date')?.hasError('required')">
                    Date is required.
                  </mat-error>
                </mat-form-field>
              </div>
            </div>

            <div class="form-row">
              <div class="form-label">Currency</div>
              <div class="form-control-group">
                <mat-form-field appearance="outline" class="dialog-form-field">
                  <mat-label>Currency</mat-label>
                  <mat-select formControlName="transaction_currency_id" required>
                    <mat-option *ngFor="let currency of currencies" [value]="currency.id">
                      {{ currency.code }} · {{ currency.name }}
                    </mat-option>
                  </mat-select>
                  <mat-error *ngIf="billForm.get('transaction_currency_id')?.hasError('required')">
                    Currency is required.
                  </mat-error>
                </mat-form-field>
              </div>
            </div>
          </fieldset>

          <fieldset class="form-section">
            <legend class="form-section-title">Optional settings</legend>

            <div class="form-row">
              <div class="form-label">Advanced options</div>
              <div class="form-control-group">
                <mat-form-field appearance="outline" class="dialog-form-field">
                  <mat-label>Match words (optional)</mat-label>
                  <textarea matInput formControlName="match" rows="3" placeholder="Words to match bill transactions"></textarea>
                </mat-form-field>
              </div>
            </div>

            <div class="form-row">
              <div class="form-label">Notes</div>
              <div class="form-control-group">
                <mat-form-field appearance="outline" class="dialog-form-field">
                  <mat-label>Notes</mat-label>
                  <textarea matInput formControlName="notes" rows="3" placeholder="Additional notes"></textarea>
                </mat-form-field>
              </div>
            </div>

            <div class="form-row form-row-checkboxes">
              <div class="form-label">Status</div>
              <div class="form-control-group">
                <mat-checkbox formControlName="active">Active bill</mat-checkbox>
              </div>
            </div>
          </fieldset>
        </div>

        <div class="dialog-actions">
          <button mat-button (click)="dialogRef.close()" type="button">Cancel</button>
          <button mat-raised-button color="primary" type="submit" [disabled]="isSubmitting">
            {{ isSubmitting ? 'Creating...' : 'Create Bill' }}
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
      min-height: 80px;
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
  `],
})
export class BillCreateDialogComponent implements OnInit {
  billForm: FormGroup;
  isSubmitting = false;
  currencies: CurrencyOption[] = [];

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    public dialogRef: MatDialogRef<BillCreateDialogComponent>
  ) {
    this.billForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(255)]],
      amount_min: [null, [Validators.required, Validators.min(0.01)]],
      amount_max: [null, [Validators.required, Validators.min(0.01)]],
      repeat_freq: ['monthly', Validators.required],
      date: [new Date(), Validators.required],
      transaction_currency_id: ['', Validators.required],
      match: [''],
      notes: [''],
      active: [true],
    });
  }

  ngOnInit(): void {
    this.loadCurrencies();
  }

  loadCurrencies(): void {
    this.apiService.get<any>('currencies', { limit: 100 }).subscribe({
      next: (response: any) => {
        this.currencies = this.normalizeCurrencies(response);
        if (this.currencies.length > 0) {
          this.billForm.patchValue({ transaction_currency_id: this.currencies[0].id });
        }
      },
      error: (err) => {
        console.error('Error loading currencies:', err);
      },
    });
  }

  onSubmit(): void {
    if (!this.billForm.valid) {
      this.billForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const formData = this.billForm.getRawValue();
    const payload = {
      name: formData.name,
      amount_min: formData.amount_min,
      amount_max: formData.amount_max,
      repeat_freq: formData.repeat_freq,
      date: formData.date instanceof Date
        ? formData.date.toISOString().split('T')[0]
        : formData.date,
      transaction_currency_id: formData.transaction_currency_id,
      active: formData.active,
      match: formData.match || null,
      notes: formData.notes || null,
    };

    this.apiService.post('bills', payload).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.dialogRef.close(response);
      },
      error: (err) => {
        this.isSubmitting = false;
        console.error('Error creating bill:', err);
        alert('Error creating bill: ' + (err.error?.message || err.message));
      },
    });
  }

  private normalizeCurrencies(response: any): CurrencyOption[] {
    const items = Array.isArray(response?.data)
      ? response.data
      : Array.isArray(response?.data?.data)
        ? response.data.data
        : [];

    return items.map((item: any) => {
      if (item?.attributes) {
        return { id: item.id, ...item.attributes } as CurrencyOption;
      }
      return item as CurrencyOption;
    });
  }
}
