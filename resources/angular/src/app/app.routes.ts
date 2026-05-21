// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { AuthGuard } from '@core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then(
        (m) => m.LoginComponent
      ),
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./features/dashboard/dashboard/dashboard.component').then(
        (m) => m.DashboardComponent
      ),
    canActivate: [AuthGuard],
  },
  {
    path: 'accounts',
    loadChildren: () =>
      import('./features/accounts/accounts.routes').then((m) => m.routes),
    canActivate: [AuthGuard],
  },
  {
    path: 'transactions',
    loadChildren: () =>
      import('./features/transactions/transactions.routes').then(
        (m) => m.routes
      ),
    canActivate: [AuthGuard],
  },
  {
    path: 'budgets',
    loadChildren: () =>
      import('./features/budgets/budgets.routes').then((m) => m.routes),
    canActivate: [AuthGuard],
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
