// src/app/features/settings/settings.routes.ts
import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./settings-page/settings-page.component').then((m) => m.SettingsPageComponent),
  },
];
