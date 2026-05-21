// src/app/features/rules/rules.routes.ts
import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./rules-list/rules-list.component').then((m) => m.RulesListComponent),
  },
];
