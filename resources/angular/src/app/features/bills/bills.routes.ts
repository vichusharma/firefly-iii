// src/app/features/bills/bills.routes.ts
import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./bills-list/bills-list.component').then((m) => m.BillsListComponent),
  },
];
