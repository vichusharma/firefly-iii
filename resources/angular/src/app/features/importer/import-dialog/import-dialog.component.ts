import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { Subject, takeUntil } from 'rxjs';
import { ImporterService, ImportJob } from '@core/services/importer.service';

@Component({
  selector: 'app-import-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
    MatSelectModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatIconModule,
  ],
  template: `
    <h2 mat-dialog-title>Import Transactions</h2>

    <mat-dialog-content *ngIf="!uploadProgress && !importJob">
      <div class="import-form">
        <p class="instructions">
          Upload a file (CSV, OFX, MT940, or YNAB) to import transactions into Firefly III.
        </p>

        <div class="file-upload-area" (click)="fileInput.click()" [class.dragging]="isDragOver">
          <mat-icon>cloud_upload</mat-icon>
          <p>Click to browse or drag and drop a file</p>
          <input
            #fileInput
            type="file"
            hidden
            (change)="onFileSelected($event)"
            accept=".csv,.ofx,.mt940,.ynab"
          />
        </div>

        <div *ngIf="selectedFile" class="selected-file">
          <mat-icon>check_circle</mat-icon>
          <span>{{ selectedFile.name }} ({{ formatFileSize(selectedFile.size) }})</span>
          <button mat-icon-button (click)="clearFile()">
            <mat-icon>close</mat-icon>
          </button>
        </div>

        <mat-form-field class="full-width">
          <mat-label>Import Configuration</mat-label>
          <mat-select formControlName="configuration" required>
            <mat-option value="auto">Auto-detect (Recommended)</mat-option>
            <mat-option value="csv">CSV File</mat-option>
            <mat-option value="ofx">OFX Format</mat-option>
            <mat-option value="mt940">MT940 Format</mat-option>
            <mat-option value="ynab">YNAB Format</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field class="full-width">
          <mat-label>Delimiter (for CSV)</mat-label>
          <mat-select formControlName="delimiter">
            <mat-option value=",">Comma (,)</mat-option>
            <mat-option value=";">Semicolon (;)</mat-option>
            <mat-option value="	">Tab</mat-option>
            <mat-option value="|">Pipe (|)</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field class="full-width">
          <mat-label>Date Format (for CSV)</mat-label>
          <mat-select formControlName="dateFormat">
            <mat-option value="MM/DD/YYYY">MM/DD/YYYY (US)</mat-option>
            <mat-option value="DD/MM/YYYY">DD/MM/YYYY (EU)</mat-option>
            <mat-option value="YYYY-MM-DD">YYYY-MM-DD (ISO)</mat-option>
          </mat-select>
        </mat-form-field>

        <div class="checkbox-options">
          <label class="checkbox">
            <input type="checkbox" formControlName="skipForm" />
            Skip configuration form after upload
          </label>
          <label class="checkbox">
            <input type="checkbox" formControlName="doMapping" />
            Show column mapping
          </label>
        </div>

        <div class="dialog-actions">
          <button mat-button (click)="dialogRef.close()">Cancel</button>
          <button
            mat-raised-button
            color="primary"
            (click)="startImport()"
            [disabled]="!selectedFile || isUploading"
          >
            <span *ngIf="!isUploading">Upload & Import</span>
            <mat-spinner *ngIf="isUploading" diameter="20"></mat-spinner>
          </button>
        </div>
      </div>
    </mat-dialog-content>

    <mat-dialog-content *ngIf="uploadProgress && uploadProgress > 0 && uploadProgress < 100">
      <div class="upload-progress">
        <p>Uploading file...</p>
        <mat-progress-bar mode="determinate" [value]="uploadProgress"></mat-progress-bar>
        <p class="progress-text">{{ uploadProgress }}%</p>
      </div>
    </mat-dialog-content>

    <mat-dialog-content *ngIf="importJob">
      <div class="import-status">
        <h3>Import Status</h3>
        <mat-card>
          <mat-card-content>
            <div class="status-item">
              <span class="label">Job ID:</span>
              <span class="value">{{ importJob.id }}</span>
            </div>
            <div class="status-item">
              <span class="label">Status:</span>
              <span [class]="'status ' + importJob.status">{{ importJob.status }}</span>
            </div>
            <div class="status-item">
              <span class="label">Created:</span>
              <span class="value">{{ importJob.createdAt | date: 'medium' }}</span>
            </div>

            <mat-progress-bar
              *ngIf="importJob.status === 'running'"
              mode="indeterminate"
            ></mat-progress-bar>

            <div *ngIf="importJob.status === 'error'" class="error-message">
              <mat-icon>error</mat-icon>
              <span>Import failed. Please check the file format and try again.</span>
            </div>

            <div *ngIf="importJob.status === 'success'" class="success-message">
              <mat-icon>check_circle</mat-icon>
              <span>Import completed successfully!</span>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end" *ngIf="importJob">
      <button mat-button (click)="dialogRef.close(importJob)">Close</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .import-form {
      padding: 20px;
      min-width: 400px;
    }

    .instructions {
      color: #666;
      margin-bottom: 20px;
      font-size: 14px;
    }

    .file-upload-area {
      border: 2px dashed #ccc;
      border-radius: 8px;
      padding: 40px;
      text-align: center;
      cursor: pointer;
      transition: all 0.3s;
      margin-bottom: 20px;

      &:hover {
        border-color: #1976d2;
        background-color: #f5f5f5;
      }

      &.dragging {
        border-color: #1976d2;
        background-color: #e3f2fd;
      }

      mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        color: #1976d2;
        margin-bottom: 10px;
      }

      p {
        margin: 0;
        color: #666;
      }
    }

    .selected-file {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px;
      background-color: #f5f5f5;
      border-radius: 4px;
      margin-bottom: 20px;

      mat-icon {
        color: #4caf50;
      }

      button {
        margin-left: auto;
      }
    }

    .full-width {
      width: 100%;
      margin-bottom: 15px;
    }

    .checkbox-options {
      margin-bottom: 20px;
    }

    .checkbox {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 10px;
      cursor: pointer;
      font-size: 14px;

      input {
        cursor: pointer;
      }
    }

    .dialog-actions {
      display: flex;
      gap: 10px;
      justify-content: flex-end;
      margin-top: 20px;
    }

    .upload-progress {
      padding: 30px;
      text-align: center;

      mat-progress-bar {
        margin: 20px 0;
      }

      .progress-text {
        color: #666;
        font-size: 14px;
      }
    }

    .import-status {
      padding: 20px;

      h3 {
        margin-top: 0;
      }

      mat-card {
        margin-bottom: 20px;
      }

      .status-item {
        display: flex;
        justify-content: space-between;
        padding: 10px 0;
        border-bottom: 1px solid #eee;

        .label {
          font-weight: 500;
          color: #666;
        }

        .value {
          font-family: monospace;
        }

        .status {
          padding: 4px 8px;
          border-radius: 4px;
          font-weight: 500;
          text-transform: uppercase;
          font-size: 12px;

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
      }
    }

    .error-message,
    .success-message {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 15px;
      border-radius: 4px;
      margin-top: 15px;

      mat-icon {
        font-size: 24px;
        width: 24px;
        height: 24px;
      }
    }

    .error-message {
      background-color: #ffebee;
      color: #c62828;
    }

    .success-message {
      background-color: #e8f5e9;
      color: #2e7d32;
    }
  `],
})
export class ImportDialogComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private importerService = inject(ImporterService);
  private destroy$ = new Subject<void>();

  dialogRef = inject(MatDialogRef<ImportDialogComponent>);

  form!: FormGroup;
  selectedFile: File | null = null;
  isUploading = false;
  uploadProgress = 0;
  isDragOver = false;
  importJob: ImportJob | null = null;

  ngOnInit() {
    this.form = this.fb.group({
      configuration: ['auto', Validators.required],
      delimiter: [','],
      dateFormat: ['MM/DD/YYYY'],
      skipForm: [false],
      doMapping: [false],
    });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedFile = input.files[0];
    }
  }

  clearFile() {
    this.selectedFile = null;
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  startImport() {
    if (!this.selectedFile) return;

    this.isUploading = true;

    this.importerService
      .uploadFile(this.selectedFile)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (job) => {
          this.importJob = job;
          this.isUploading = false;
          // Poll for status updates
          this.pollJobStatus(job.id);
        },
        error: (error) => {
          console.error('Upload failed:', error);
          this.isUploading = false;
          alert('Upload failed. Please try again.');
        },
      });
  }

  private pollJobStatus(jobId: string) {
    const pollInterval = setInterval(() => {
      this.importerService
        .getJobStatus(jobId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (job) => {
            this.importJob = job;
            if (job.status === 'success' || job.status === 'error') {
              clearInterval(pollInterval);
            }
          },
          error: () => clearInterval(pollInterval),
        });
    }, 2000);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
