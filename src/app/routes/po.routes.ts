import { Routes } from '@angular/router';

export const PO_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () =>
            import('./../features/purchase-orders/po-list/po-list')
                .then(m => m.PoList)
    },
    {
        path: 'add',
        loadComponent: () =>
            import('./../features/purchase-orders/po-form/po-form')
                .then(m => m.PoForm)
    },
    {
        path: 'edit/:id',
        loadComponent: () =>
            import('./../features/purchase-orders/po-form/po-form')
                .then(m => m.PoForm)
    },
    {
        path: 'print/:id',
        loadComponent: () =>
            import('./../features/purchase-orders/po-print/po-print')
                .then(m => m.PoPrint)
    }
];
