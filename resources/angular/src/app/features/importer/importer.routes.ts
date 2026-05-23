import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./importer-list/importer-list.component').then(
        (m) => m.ImporterListComponent
      ),
  },
];
