import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { ApiService } from '@core/services/api.service';

interface RuleGroup {
  id: string;
  title: string;
}

@Component({
  selector: 'app-rule-create-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
  ],
  template: `
    <div class="dialog-wrapper">
      <div class="dialog-header">
        <h2>Create New Rule</h2>
        <button mat-icon-button (click)="dialogRef.close()" class="close-btn" type="button">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <form [formGroup]="ruleForm" (ngSubmit)="onSubmit()" class="dialog-form">
        <div class="form-content">
          <fieldset class="form-section">
            <legend class="form-section-title">Rule details</legend>

            <div class="form-row">
              <div class="form-label">Rule title</div>
              <div class="form-control-group">
                <mat-form-field appearance="outline" class="dialog-form-field">
                  <mat-label>Rule title</mat-label>
                  <input matInput formControlName="title" required />
                  <mat-error *ngIf="ruleForm.get('title')?.hasError('required')">
                    Rule title is required.
                  </mat-error>
                  <mat-error *ngIf="ruleForm.get('title')?.hasError('maxlength')">
                    Title must be 100 characters or less.
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

            <div class="form-row form-row-checkboxes">
              <div class="form-label">Status</div>
              <div class="form-control-group">
                <mat-checkbox formControlName="active">Active rule</mat-checkbox>
              </div>
            </div>
          </fieldset>

          <div class="rule-note">
            Rules created here use a safe manual trigger and a starter tag action. You can refine the full rule logic later.
          </div>

          <div *ngIf="preparationError" class="preparation-error">
            {{ preparationError }}
          </div>
        </div>

        <div class="dialog-actions">
          <button mat-button (click)="dialogRef.close()" type="button">Cancel</button>
          <button mat-raised-button color="primary" type="submit" [disabled]="isSubmitDisabled">
            {{ submitLabel }}
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

    .rule-note {
      padding: 0.9rem 1rem;
      border-radius: 0.95rem;
      background: rgba(59, 130, 246, 0.12);
      border: 1px solid rgba(96, 165, 250, 0.2);
      color: #bfdbfe;
      line-height: 1.5;
      font-size: 0.9rem;
    }

    .preparation-error {
      padding: 0.9rem 1rem;
      border-radius: 0.95rem;
      background: rgba(239, 68, 68, 0.12);
      border: 1px solid rgba(248, 113, 113, 0.2);
      color: #fecaca;
      line-height: 1.5;
      font-size: 0.9rem;
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
export class RuleCreateDialogComponent implements OnInit {
  ruleForm: FormGroup;
  isSubmitting = false;
  isPreparing = true;
  preparationError: string | null = null;
  private ruleGroupId: string | null = null;

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    public dialogRef: MatDialogRef<RuleCreateDialogComponent>
  ) {
    this.ruleForm = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(100)]],
      description: [''],
      active: [true],
    });
  }

  get isSubmitDisabled(): boolean {
    return this.isPreparing || this.isSubmitting;
  }

  get submitLabel(): string {
    if (this.isPreparing) {
      return 'Preparing...';
    }

    return this.isSubmitting ? 'Creating...' : 'Create Rule';
  }

  ngOnInit(): void {
    this.prepareRuleGroup();
  }

  onSubmit(): void {
    if (this.isPreparing) {
      return;
    }

    if (!this.ruleForm.valid || !this.ruleGroupId) {
      this.ruleForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const formData = this.ruleForm.getRawValue();
    const payload = {
      title: formData.title,
      description: formData.description || null,
      active: formData.active,
      rule_group_id: this.ruleGroupId,
      trigger: 'manual-activation',
      strict: true,
      stop_processing: false,
      triggers: [
        {
          type: 'exists',
          value: null,
          active: true,
          prohibited: false,
          stop_processing: false,
        },
      ],
      actions: [
        {
          type: 'add_tag',
          value: formData.title,
          active: true,
          stop_processing: false,
        },
      ],
    };

    this.apiService.post('rules', payload).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.dialogRef.close(response);
      },
      error: (err) => {
        this.isSubmitting = false;
        console.error('Error creating rule:', err);
        alert('Error creating rule: ' + (err.error?.message || err.message));
      },
    });
  }

  private prepareRuleGroup(): void {
    this.apiService.get<any>('rule-groups', { limit: 100 }).subscribe({
      next: (response: any) => {
        const groups = this.normalizeRuleGroups(response);
        if (groups.length > 0) {
          this.ruleGroupId = groups[0].id;
          this.isPreparing = false;
          return;
        }

        this.createDefaultRuleGroup();
      },
      error: (err) => {
        console.error('Error loading rule groups:', err);
        this.preparationError = 'Unable to load rule groups required to create a rule.';
        this.isPreparing = false;
      },
    });
  }

  private createDefaultRuleGroup(): void {
    const payload = {
      title: 'General Rules',
      description: 'Created automatically for the Angular rules experience.',
      active: true,
    };

    this.apiService.post<any>('rule-groups', payload).subscribe({
      next: (response: any) => {
        const group = this.normalizeRuleGroup(response?.data?.attributes ? { data: [response.data] } : response)?.[0];
        this.ruleGroupId = group?.id ?? null;
        this.isPreparing = false;
      },
      error: (err) => {
        console.error('Error creating default rule group:', err);
        this.preparationError = 'Unable to prepare a default rule group for the new rule.';
        this.isPreparing = false;
      },
    });
  }

  private normalizeRuleGroups(response: any): RuleGroup[] {
    const items = Array.isArray(response?.data)
      ? response.data
      : Array.isArray(response?.data?.data)
        ? response.data.data
        : [];

    return items.map((item: any) => {
      const attributes = item?.attributes ?? item ?? {};
      return {
        id: String(item?.id ?? attributes.id ?? ''),
        title: String(attributes.title ?? '').trim(),
      } as RuleGroup;
    }).filter((group: RuleGroup) => !!group.id);
  }

  private normalizeRuleGroup(response: any): RuleGroup[] {
    return this.normalizeRuleGroups(response);
  }
}
