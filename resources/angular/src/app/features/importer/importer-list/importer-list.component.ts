import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatBadgeModule } from '@angular/material/badge';
import { Subject, takeUntil } from 'rxjs';
import { ImporterService, ImportJob } from '@core/services/importer.service';
import { ImportDialogComponent } from '../import-dialog/import-dialog.component';

@Component({
  selector: 'app-importer-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatBadgeModule,
  ],
  template: `
    <div class="importer-container">
      <div class="header">
        <h2>Importer</h2>
        <button mat-raised-button color="primary" (click)="openImportDialog()">
          <mat-icon>upload</mat-icon>
          Import Transactions
        </button>
      </div>

      <div class="info-cards">
        <mat-card class="info-card">
          <mat-card-title>Supported Formats</mat-card-title>
          <mat-card-content>
            <ul>
              <li>CSV Files</li>
              <li>OFX/QFX (Open Financial Exchange)</li>
              <li>MT940 (SWIFT)</li>
              <li>YNAB (You Need A Budget)</li>
            </ul>
          </mat-card-content>
        </mat-card>

        <mat-card class="info-card">
          <mat-card-title>Steps</mat-card-title>
          <mat-card-content>
            <ol>
              <li>Click "Import Transactions" button</li>
              <li>Select your file</li>
              <li>Configure import settings</li>
              <li>Review and confirm</li>
              <li>Transactions imported!</li>
            </ol>
          </mat-card-content>
        </mat-card>
      </div>

      <div class="history-section">
        <h3>Import History</h3>

        <div *ngIf="isLoading" class="loading">
          <mat-spinner diameter="40"></mat-spinner>
        </div>

        <div *ngIf="!isLoading && imports.length === 0" class="empty-state">
          <mat-icon>inbox</mat-icon>
          <p>No imports yet. Click "Import Transactions" to get started.</p>
        </div>

        <div *ngIf="!isLoading && imports.length > 0" class="history-table">
          <table mat-table [dataSource]="imports" class="imports-table">
            <!-- ID Column -->
            <ng-container matColumnDef="id">
              <th mat-header-cell *matHeaderCellDef>Job ID</th>
              <td mat-cell *matCellDef="let element">
                <code class="monospace">{{ element.id | slice: 0: 8 }}...</code>
              </td>
            </ng-container>

            <!-- Status Column -->
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let element">
                <span [class]="'status-badge ' + element.status">
                  {{ element.status }}
                </span>
              </td>
            </ng-container>

            <!-- Created Column -->
            <ng-container matColumnDef="createdAt">
              <th mat-header-cell *matHeaderCellDef>Created</th>
              <td mat-cell *matCellDef="let element">
                {{ element.createdAt | date: 'medium' }}
              </td>
            </ng-container>

            <!-- Updated Column -->
            <ng-container matColumnDef="updatedAt">
              <th mat-header-cell *matHeaderCellDef>Updated</th>
              <td mat-cell *matCellDef="let element">
                {{ element.updatedAt | date: 'medium' }}
              </td>
            </ng-container>

            <!-- Actions Column -->
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Actions</th>
              <td mat-cell *matCellDef="let element">
                <button
                  mat-icon-button
                  matTooltip="View Details"
                  (click)="viewDetails(element)"
                >
                  <mat-icon>info</mat-icon>
                </button>
                <button
                  mat-icon-button
                  matTooltip="Retry"
                  (click)="retryImport(element)"
                  [disabled]="element.status !== 'error'"
                >
                  <mat-icon>refresh</mat-icon>
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .importer-container {
      padding: 24px;
      max-width: 1200px;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;

      h2 {
        margin: 0;
      }

      button {
        display: flex;
        gap: 8px;
        align-items: center;
      }
    }

    .info-cards {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 30px;

      @media (max-width: 768px) {
        grid-template-columns: 1fr;
      }
    }

    .info-card {
      mat-card-title {
        margin-bottom: 16px;
        font-size: 16px;
      }

      ul, ol {
        margin: 0;
        padding-left: 20px;

        li {
          margin-bottom: 8px;
          color: #666;
        }
      }
    }

    .history-section {
      h3 {
        margin-bottom: 16px;
      }
    }

    .loading {
      display: flex;
      justify-content: center;
      padding: 40px;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
      text-align: center;
      color: #999;

      mat-icon {
        font-size: 64px;
        width: 64px;
        height: 64px;
        margin-bottom: 16px;
        opacity: 0.3;
      }

      p {
        margin: 0;
        font-size: 16px;
      }
    }

    .history-table {
      overflow-x: auto;

      .imports-table {
        width: 100%;

        th {
          background-color: #f5f5f5;
          font-weight: 600;
          padding: 12px;

          &:first-child {
            border-radius: 4px 0 0 4px;
          }

          &:last-child {
            border-radius: 0 4px 4px 0;
          }
        }

        td {
          padding: 12px;
          border-bottom: 1px solid #eee;
        }

        tr:hover {
          background-color: #fafafa;
        }

        .monospace {
          font-family: monospace;
          font-size: 12px;
          background-color: #f5f5f5;
          padding: 4px 8px;
          border-radius: 2px;
        }

        .status-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
          text-transform: uppercase;

          &.new {
            background-color: #e0e0e0;
            color: #333;
          }

          &.configured {
            background-color: #fff3e0;
            color: #e65100;
          }

          &.running {
            background-color: #e3f2fd;
            color: #1565c0;
          }

          &.success {
            background-color: #e8f5e9;
            color: #2e7d32;
          }

          &.error {
            background-color: #ffebee;
            color: #c62828;
          }
        }

        button[disabled] {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }
    }

    code {
      background-color: #f5f5f5;
      padding: 4px 8px;
      border-radius: 3px;
      font-size: 12px;
      font-family: monospace;
    }
  `],
})
export class ImporterListComponent implements OnInit, OnDestroy {
  private importerService = inject(ImporterService);
  private dialog = inject(MatDialog);
  private destroy$ = new Subject<void>();

  imports: ImportJob[] = [];
  isLoading = false;
  displayedColumns: string[] = ['id', 'status', 'createdAt', 'updatedAt', 'actions'];

  ngOnInit() {
    this.loadImportHistory();
  }

  loadImportHistory() {
    this.isLoading = true;
    this.importerService
      .getImportHistory(10)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (jobs) => {
          this.imports = jobs;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Failed to load import history:', error);
          this.isLoading = false;
        },
      });
  }

  openImportDialog() {
    const dialogRef = this.dialog.open(ImportDialogComponent, {
      width: '500px',
      disableClose: false,
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadImportHistory();
      });
  }

  viewDetails(importJob: ImportJob) {
    this.importerService
      .getImportDetails(importJob.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (details) => {
          console.log('Import details:', details);
          alert(
            `Import Details:\n\n${JSON.stringify(details, null, 2)}`
          );
        },
        error: (error) => {
          console.error('Failed to load import details:', error);
          alert('Failed to load import details');
        },
      });
  }

  retryImport(importJob: ImportJob) {
    if (confirm('Are you sure you want to retry this import?')) {
      this.importerService
        .startImport(importJob.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            alert('Import retry started');
            this.loadImportHistory();
          },
          error: (error) => {
            console.error('Failed to retry import:', error);
            alert('Failed to retry import');
          },
        });
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
