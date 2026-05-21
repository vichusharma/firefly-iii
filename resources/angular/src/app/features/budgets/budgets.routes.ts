// src/app/features/budgets/budgets.routes.ts
import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./budgets-list/budgets-list.component').then(
        (m) => m.BudgetsListComponent
      ),
  },
];
