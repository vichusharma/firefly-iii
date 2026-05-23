import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { ApiService } from '@core/services/api.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { BillCreateDialogComponent } from '../bill-create-dialog/bill-create-dialog.component';

interface Bill {
  id: string;
  name: string;
  amount_min: number;
  amount_max: number;
  repeat_freq: string;
  active: boolean;
  date: string;
  next_expected_match?: string;
}

@Component({
  selector: 'app-bills-list',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    BillCreateDialogComponent,
  ],
  template: `
    <div class="bills-container">
      <div class="bills-header">
        <h1>Bills</h1>
        <button mat-raised-button color="primary" (click)="createNewBill()">
          <mat-icon>add</mat-icon>
          New Bill
        </button>
      </div>

      <div *ngIf="loading" class="loading-container">
        <mat-spinner diameter="50"></mat-spinner>
        <p>Loading bills...</p>
      </div>

      <div *ngIf="!loading && bills.length === 0" class="no-data">
        <mat-icon class="no-data-icon">receipt</mat-icon>
        <p>No bills found</p>
        <p class="hint">Create your first bill to track recurring payments</p>
      </div>

      <div *ngIf="!loading && bills.length > 0" class="bills-grid">
        <mat-card *ngFor="let bill of bills" class="bill-card">
          <mat-card-header>
            <div class="card-title-row">
              <mat-card-title>{{ bill.name }}</mat-card-title>
              <mat-chip [class.active]="bill.active" [class.inactive]="!bill.active">
                {{ bill.active ? 'Active' : 'Inactive' }}
              </mat-chip>
            </div>
          </mat-card-header>
          <mat-card-content>
            <div class="bill-details">
              <div class="detail-row">
                <span class="label">Amount:</span>
                <span class="value">{{ bill.amount_min | currency }} - {{ bill.amount_max | currency }}</span>
              </div>
              <div class="detail-row">
                <span class="label">Frequency:</span>
                <span class="value">{{ formatFrequency(bill.repeat_freq) }}</span>
              </div>
              <div class="detail-row" *ngIf="bill.next_expected_match">
                <span class="label">Next Expected:</span>
                <span class="value">{{ bill.next_expected_match | date: 'short' }}</span>
              </div>
            </div>
          </mat-card-content>
          <mat-card-actions>
            <button mat-button (click)="editBill(bill)">
              <mat-icon>edit</mat-icon>
              Edit
            </button>
            <button mat-button color="warn" (click)="deleteBill(bill.id)">
              <mat-icon>delete</mat-icon>
              Delete
            </button>
          </mat-card-actions>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .bills-container {
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      min-height: 100vh;
    }

    .bills-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      color: #f1f5f9;
    }

    .bills-header h1 {
      margin: 0;
      font-size: 2rem;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 300px;
      gap: 1rem;
      color: #cbd5e1;
      font-size: 1.1rem;
    }

    .no-data {
      text-align: center;
      padding: 4rem 2rem;
      color: #94a3b8;
    }

    .no-data-icon {
      font-size: 3rem;
      width: 3rem;
      height: 3rem;
      color: #64748b;
      margin-bottom: 1rem;
    }

    .no-data p {
      margin: 0.5rem 0;
    }

    .no-data p.hint {
      font-size: 0.9rem;
      color: #64748b;
      font-style: italic;
    }

    .bills-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1.5rem;
    }

    .bill-card {
      padding: 1.5rem !important;
      background: #1e293b;
      border-radius: 1.25rem;
      border: none;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
      color: #cbd5e1;
    }

    .bill-card mat-card-header {
      padding-bottom: 1rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }

    .card-title-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
    }

    .bill-card mat-card-title {
      margin: 0;
      color: #f1f5f9;
    }

    mat-chip {
      font-size: 0.75rem;
      height: 24px;
      padding: 0 8px !important;
    }

    mat-chip.active {
      background-color: rgba(34, 197, 94, 0.2) !important;
      color: #86efac !important;
    }

    mat-chip.inactive {
      background-color: rgba(239, 68, 68, 0.2) !important;
      color: #fca5a5 !important;
    }

    .bill-details {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin: 1rem 0;
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }

    .label {
      color: #94a3b8;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .value {
      color: #f1f5f9;
      font-weight: 600;
    }

    mat-card-actions {
      display: flex;
      gap: 0.5rem;
      padding-top: 1rem;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
      margin: 0 !important;
      padding-top: 1rem !important;
    }

    button[mat-button] {
      flex: 1;
      text-transform: uppercase;
      font-size: 0.75rem;
      color: #94a3b8;
    }

    button[mat-button]:hover {
      background-color: rgba(255, 255, 255, 0.05);
    }

    button[mat-button][color="warn"] {
      color: #fca5a5;
    }
  `],
})
export class BillsListComponent implements OnInit, OnDestroy {
  bills: Bill[] = [];
  loading = true;
  private destroy$ = new Subject<void>();

  constructor(
    private apiService: ApiService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadBills();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadBills(): void {
    this.loading = true;
    this.apiService.get<any>('bills', { limit: 100 })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.bills = this.normalizeBills(response);
          this.loading = false;
        },
        error: (err) => {
          console.error('Error loading bills:', err);
          this.loading = false;
        },
      });
  }

  createNewBill(): void {
    this.dialog.open(BillCreateDialogComponent, {
      width: '90%',
      maxWidth: '800px',
      panelClass: 'firefly-dialog-container',
    }).afterClosed().subscribe((result) => {
      if (result) {
        this.loadBills();
      }
    });
  }

  editBill(bill: Bill): void {
    console.log('Edit bill:', bill);
    // TODO: Implement edit functionality
  }

  deleteBill(billId: string): void {
    if (confirm('Are you sure you want to delete this bill?')) {
      this.apiService.delete(`bills/${billId}`)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.loadBills();
          },
          error: (err) => {
            console.error('Error deleting bill:', err);
            alert('Error deleting bill');
          },
        });
    }
  }

  formatFrequency(freq: string): string {
    const frequencies: Record<string, string> = {
      'daily': 'Daily',
      'weekly': 'Weekly',
      'monthly': 'Monthly',
      'quarterly': 'Quarterly',
      'half-yearly': 'Half-yearly',
      'yearly': 'Yearly',
    };
    return frequencies[freq] || freq;
  }

  private normalizeBills(response: any): Bill[] {
    const items = Array.isArray(response?.data)
      ? response.data
      : Array.isArray(response?.data?.data)
        ? response.data.data
        : [];

    return items.map((item: any) => {
      if (item?.attributes) {
        return { id: item.id, ...item.attributes } as Bill;
      }
      return item as Bill;
    });
  }
}
