// src/app/shared/components/button/button.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export type ButtonVariant = 'filled' | 'outlined' | 'text' | 'elevated';
export type ButtonSize = 'small' | 'medium' | 'large';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  template: `
    <button
      [mat-button]="isText"
      [mat-raised-button]="!isText && variant === 'filled'"
      [mat-stroked-button]="variant === 'outlined'"
      [color]="color"
      [disabled]="disabled"
      (click)="onClick.emit()"
      [ngClass]="'btn-' + size"
    >
      <mat-icon *ngIf="icon" class="icon-left">{{ icon }}</mat-icon>
      <ng-content></ng-content>
    </button>
  `,
  styles: [`button { font-weight: 500; } .btn-small { font-size: 0.75rem; } .btn-large { font-size: 1rem; }`],
})
export class ButtonComponent {
  @Input() variant: ButtonVariant = 'filled';
  @Input() size: ButtonSize = 'medium';
  @Input() color: 'primary' | 'accent' | 'warn' = 'primary';
  @Input() disabled = false;
  @Input() icon?: string;
  @Output() onClick = new EventEmitter<void>();

  get isText(): boolean {
    return this.variant === 'text';
  }
}
