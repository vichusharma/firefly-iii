// src/app/shared/components/stat-card/stat-card.component.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  template: `
    <mat-card [ngClass]="'stat-' + color">
      <h3>{{ title }}</h3>
      <div class="stat-value">{{ value }}</div>
      <p *ngIf="subtitle">{{ subtitle }}</p>
    </mat-card>
  `,
  styles: [`
    mat-card { padding: 1.5rem; border-radius: 12px; border-left: 4px solid; }
    h3 { margin: 0; font-size: 0.875rem; color: #79747e; }
    .stat-value { font-size: 2rem; font-weight: 600; margin: 0.5rem 0; }
    p { margin: 0; font-size: 0.875rem; color: #79747e; }
    .stat-primary { border-left-color: #6750a4; }
    .stat-success { border-left-color: #43a047; }
    .stat-warning { border-left-color: #f9a825; }
  `],
})
export class StatCardComponent {
  @Input() title = '';
  @Input() value = '';
  @Input() subtitle = '';
  @Input() color = 'primary';
}
