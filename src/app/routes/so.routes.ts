import { Routes } from '@angular/router';

export const SO_ROUTES: Routes = [
  {
    path: '',
    data: { breadcrumb: 'List' },
    loadComponent: () =>
      import('./../features/sales-orders/so-list/so-list')
        .then(m => m.SoList)
  },
  {
    path: 'add',
    data: { breadcrumb: 'Add New' },
    loadComponent: () =>
      import('./../features/sales-orders/so-form/so-form')
        .then(m => m.SoForm)
  },
  {
    path: 'edit/:id',
    data: { breadcrumb: 'Edit' },
    loadComponent: () =>
      import('./../features/sales-orders/so-form/so-form')
        .then(m => m.SoForm)
  },
  {
    path: 'print/:id',
    data: { breadcrumb: 'Print' },
    loadComponent: () =>
      import('./../features/sales-orders/so-print/so-print')
        .then(m => m.SoPrint)
  }
];
