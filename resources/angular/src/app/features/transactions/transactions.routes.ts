// src/app/features/transactions/transactions.routes.ts
import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./transactions-list/transactions-list.component').then(
        (m) => m.TransactionsListComponent
      ),
  },
];
