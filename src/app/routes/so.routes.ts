import { Routes } from '@angular/router';
import { PermissionGuard } from '../core/gaurds/permission.guard';

export const SO_ROUTES: Routes = [
  {
    path: '',
    canActivate: [PermissionGuard],
    data: { breadcrumb: 'List' },
    loadComponent: () =>
      import('./../features/sales-orders/so-list/so-list')
        .then(m => m.SoList)
  },
  {
    path: 'add',
    canActivate: [PermissionGuard],
    data: { breadcrumb: 'Add New' },
    loadComponent: () =>
      import('./../features/sales-orders/so-form/so-form')
        .then(m => m.SoForm)
  },
  {
    path: 'edit/:id',
    canActivate: [PermissionGuard],
    data: { breadcrumb: 'Edit' },
    loadComponent: () =>
      import('./../features/sales-orders/so-form/so-form')
        .then(m => m.SoForm)
  },
  {
    path: 'print/:id',
    canActivate: [PermissionGuard],
    data: { breadcrumb: 'Print' },
    loadComponent: () =>
      import('./../features/sales-orders/so-print/so-print')
        .then(m => m.SoPrint)
  }
];
