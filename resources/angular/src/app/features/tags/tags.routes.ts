// src/app/features/tags/tags.routes.ts
import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./tags-list/tags-list.component').then((m) => m.TagsListComponent),
  },
];
