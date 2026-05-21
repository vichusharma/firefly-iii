// src/app/features/reports/reports.routes.ts
import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./reports-list/reports-list.component').then((m) => m.ReportsListComponent),
  },
];
