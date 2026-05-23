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
    path: 'register',
    loadComponent: () =>
      import('./features/auth/register/register.component').then(
        (m) => m.RegisterComponent
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
    path: 'bills',
    loadChildren: () =>
      import('./features/bills/bills.routes').then((m) => m.routes),
    canActivate: [AuthGuard],
  },
  {
    path: 'tags',
    loadChildren: () =>
      import('./features/tags/tags.routes').then((m) => m.routes),
    canActivate: [AuthGuard],
  },
  {
    path: 'rules',
    loadChildren: () =>
      import('./features/rules/rules.routes').then((m) => m.routes),
    canActivate: [AuthGuard],
  },
  {
    path: 'importer',
    loadChildren: () =>
      import('./features/importer/importer.routes').then((m) => m.routes),
    canActivate: [AuthGuard],
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
