import { Routes } from '@angular/router';

export const PO_ROUTES: Routes = [
    {
        path: '',
        data: { breadcrumb: 'List' },
        loadComponent: () =>
            import('./../features/purchase-orders/po-list/po-list')
                .then(m => m.PoList)
    },
    {
        path: 'add',
        data: { breadcrumb: 'Add New' },
        loadComponent: () =>
            import('./../features/purchase-orders/po-form/po-form')
                .then(m => m.PoForm)
    },
    {
        path: 'edit/:id',
        data: { breadcrumb: 'Edit' },
        loadComponent: () =>
            import('./../features/purchase-orders/po-form/po-form')
                .then(m => m.PoForm)
    },
    {
        path: 'print/:id',
        data: { breadcrumb: 'Print' },
        loadComponent: () =>
            import('./../features/purchase-orders/po-print/po-print')
                .then(m => m.PoPrint)
    }
];
