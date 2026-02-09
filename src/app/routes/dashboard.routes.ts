import { Routes } from '@angular/router';
import { PermissionGuard } from '../core/gaurds/permission.guard';

export const DASHBOARD_ROUTES: Routes = [
    {
        path: '',
        canActivate: [PermissionGuard],
        data: { breadcrumb: 'Dashboard' },
        loadComponent: () =>
            import('./../features/dashboard/dashboard-component/dashboard-component')
                .then(m => m.DashboardComponent)
    }
];
