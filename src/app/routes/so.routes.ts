import { Routes } from '@angular/router';

export const SO_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./../features/sales-orders/so-list/so-list')
        .then(m => m.SoList)
  },
  {
    path: 'add',
    loadComponent: () =>
      import('./../features/sales-orders/so-form/so-form')
        .then(m => m.SoForm)
  },
  {
    path: 'edit/:id',
    loadComponent: () =>
      import('./../features/sales-orders/so-form/so-form')
        .then(m => m.SoForm)
  },
  {
    path: 'print/:id',
    loadComponent: () =>
      import('./../features/sales-orders/so-print/so-print')
        .then(m => m.SoPrint)
  }
];
