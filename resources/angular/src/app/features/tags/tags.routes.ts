// src/app/features/tags/tags.routes.ts
import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'Tags',
    loadComponent: () =>
      import('./tags-list/tags-list.component').then((m) => m.TagsListComponent),
  },
];
