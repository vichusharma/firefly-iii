import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { ApiService } from '@core/services/api.service';

interface TagDialogResult {
  tag: {
    id?: string;
    name: string;
    description?: string | null;
  };
  color: string;
}

@Component({
  selector: 'app-tag-create-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
  ],
  template: `
    <div class="dialog-wrapper">
      <div class="dialog-header">
        <h2>Create New Tag</h2>
        <button mat-icon-button (click)="dialogRef.close()" class="close-btn" type="button">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <form [formGroup]="tagForm" (ngSubmit)="onSubmit()" class="dialog-form">
        <div class="form-content">
          <fieldset class="form-section">
            <legend class="form-section-title">Tag details</legend>

            <div class="form-row">
              <div class="form-label">Tag name</div>
              <div class="form-control-group">
                <mat-form-field appearance="outline" class="dialog-form-field">
                  <mat-label>Tag name</mat-label>
                  <input matInput formControlName="name" required />
                  <mat-error *ngIf="tagForm.get('name')?.hasError('required')">
                    Tag name is required.
                  </mat-error>
                  <mat-error *ngIf="tagForm.get('name')?.hasError('maxlength')">
                    Name must be 255 characters or less.
                  </mat-error>
                </mat-form-field>
              </div>
            </div>

            <div class="form-row">
              <div class="form-label">Description</div>
              <div class="form-control-group">
                <mat-form-field appearance="outline" class="dialog-form-field">
                  <mat-label>Description</mat-label>
                  <textarea matInput formControlName="description" rows="4" placeholder="Optional description"></textarea>
                </mat-form-field>
              </div>
            </div>

            <div class="form-row">
              <div class="form-label">Accent color</div>
              <div class="form-control-group">
                <div class="form-field-grid columns-2 color-grid">
                  <label class="color-picker-panel" for="tag-color-picker">
                    <span class="color-preview" [style.background]="previewColor"></span>
                    <span>
                      <strong>Color preview</strong>
                      <small>Pick any highlight color for the tag card.</small>
                    </span>
                    <input
                      id="tag-color-picker"
                      class="native-color-input"
                      type="color"
                      [value]="previewColor"
                      (input)="onColorPicked($event)"
                    />
                  </label>

                  <mat-form-field appearance="outline" class="dialog-form-field">
                    <mat-label>Color hex</mat-label>
                    <input matInput formControlName="color" placeholder="#8b5cf6" />
                    <mat-error *ngIf="tagForm.get('color')?.hasError('pattern')">
                      Enter a valid 6-digit hex color.
                    </mat-error>
                  </mat-form-field>
                </div>
              </div>
            </div>
          </fieldset>
        </div>

        <div class="dialog-actions">
          <button mat-button (click)="dialogRef.close()" type="button">Cancel</button>
          <button mat-raised-button color="primary" type="submit" [disabled]="isSubmitting">
            {{ isSubmitting ? 'Creating...' : 'Create Tag' }}
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

    .color-grid {
      align-items: stretch;
    }

    .color-picker-panel {
      display: flex;
      align-items: center;
      gap: 0.875rem;
      padding: 1rem;
      border-radius: 0.95rem;
      border: 1px solid rgba(148, 163, 184, 0.22);
      background: rgba(15, 23, 42, 0.45);
      color: #e2e8f0;
      min-height: 56px;
      box-sizing: border-box;
      cursor: pointer;
    }

    .color-picker-panel strong,
    .color-picker-panel small {
      display: block;
    }

    .color-picker-panel small {
      margin-top: 0.3rem;
      color: #94a3b8;
      line-height: 1.4;
    }

    .color-preview {
      width: 2.25rem;
      height: 2.25rem;
      border-radius: 999px;
      border: 2px solid rgba(255, 255, 255, 0.18);
      box-shadow: 0 0 0 4px rgba(15, 23, 42, 0.45);
      flex-shrink: 0;
    }

    .native-color-input {
      margin-left: auto;
      width: 3rem;
      height: 3rem;
      border: none;
      border-radius: 0.75rem;
      background: transparent;
      cursor: pointer;
      padding: 0;
      flex-shrink: 0;
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

      .color-picker-panel {
        flex-wrap: wrap;
      }

      .native-color-input {
        margin-left: 0;
      }
    }
  `],
})
export class TagCreateDialogComponent {
  readonly defaultColor = '#8b5cf6';

  tagForm: FormGroup;
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    public dialogRef: MatDialogRef<TagCreateDialogComponent>
  ) {
    this.tagForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(255)]],
      description: [''],
      color: [this.defaultColor, [Validators.pattern(/^#([0-9A-Fa-f]{6})$/)]],
    });
  }

  get previewColor(): string {
    const color = this.tagForm.get('color')?.value;
    return /^#([0-9A-Fa-f]{6})$/.test(color ?? '') ? color : this.defaultColor;
  }

  onColorPicked(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    if (!input?.value) {
      return;
    }

    this.tagForm.patchValue({ color: input.value });
    this.tagForm.get('color')?.markAsDirty();
  }

  onSubmit(): void {
    if (!this.tagForm.valid) {
      this.tagForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const formData = this.tagForm.getRawValue();
    const payload = {
      tag: formData.name,
      description: formData.description || null,
    };

    this.apiService.post('tags', payload).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.dialogRef.close(this.normalizeResult(response, formData));
      },
      error: (err) => {
        this.isSubmitting = false;
        console.error('Error creating tag:', err);
        alert('Error creating tag: ' + (err.error?.message || err.message));
      },
    });
  }

  private normalizeResult(response: any, formData: any): TagDialogResult {
    const item = response?.data?.attributes
      ? { id: response.data.id, ...response.data.attributes }
      : response?.data ?? response ?? {};

    return {
      tag: {
        id: item?.id ? String(item.id) : undefined,
        name: String(item?.tag ?? formData.name ?? '').trim(),
        description: item?.description ?? formData.description ?? null,
      },
      color: this.previewColor,
    };
  }
}
