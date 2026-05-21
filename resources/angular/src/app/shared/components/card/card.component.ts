// src/app/shared/components/card/card.component.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  template: `
    <mat-card [class.elevated]="elevated">
      <mat-card-header *ngIf="title">
        <mat-card-title>{{ title }}</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <ng-content></ng-content>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`mat-card { border-radius: 12px; } mat-card.elevated { box-shadow: 0 3px 6px rgba(0,0,0,0.15); }`],
})
export class CardComponent {
  @Input() title?: string;
  @Input() elevated = false;
}
