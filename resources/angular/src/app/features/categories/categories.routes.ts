// src/app/features/categories/categories.routes.ts
import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./categories-list/categories-list.component').then((m) => m.CategoriesListComponent),
  },
];
