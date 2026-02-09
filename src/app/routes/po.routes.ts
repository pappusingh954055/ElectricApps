import { Routes } from '@angular/router';
import { PermissionGuard } from '../core/gaurds/permission.guard';

export const PO_ROUTES: Routes = [
    {
        path: '',
        canActivate: [PermissionGuard],
        data: { breadcrumb: 'List' },
        loadComponent: () =>
            import('./../features/purchase-orders/po-list/po-list')
                .then(m => m.PoList)
    },
    {
        path: 'add',
        canActivate: [PermissionGuard],
        data: { breadcrumb: 'Add New' },
        loadComponent: () =>
            import('./../features/purchase-orders/po-form/po-form')
                .then(m => m.PoForm)
    },
    {
        path: 'edit/:id',
        canActivate: [PermissionGuard],
        data: { breadcrumb: 'Edit' },
        loadComponent: () =>
            import('./../features/purchase-orders/po-form/po-form')
                .then(m => m.PoForm)
    },
    {
        path: 'print/:id',
        canActivate: [PermissionGuard],
        data: { breadcrumb: 'Print' },
        loadComponent: () =>
            import('./../features/purchase-orders/po-print/po-print')
                .then(m => m.PoPrint)
    }
];
