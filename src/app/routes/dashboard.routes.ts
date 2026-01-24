import { Routes } from '@angular/router';

export const DASHBOARD_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () =>
            import('./../features/dashboard/dashboard-component/dashboard-component')
                .then(m => m.DashboardComponent)
    }
];
