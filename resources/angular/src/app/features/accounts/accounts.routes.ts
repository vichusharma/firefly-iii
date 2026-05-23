// src/app/features/accounts/accounts.routes.ts
import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./accounts-list/accounts-list.component').then(
        (m) => m.AccountsListComponent
      ),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./account-detail/account-detail.component').then(
        (m) => m.AccountDetailComponent
      ),
  },
];
