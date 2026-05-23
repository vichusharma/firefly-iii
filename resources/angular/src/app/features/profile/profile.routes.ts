// src/app/features/profile/profile.routes.ts
import { Routes } from "@angular/router";

export const routes: Routes = [
    {
        path: "",
        loadComponent: () =>
            import("./profile-page/profile-page.component").then(
                (m) => m.ProfilePageComponent,
            ),
    },
];
