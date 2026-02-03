import { Routes } from '@angular/router';

export const INVENTORY_ROUTES: Routes = [

  {
    path: 'polist',
    data: { breadcrumb: 'Purchase Orders' },
    children: [
      { path: '', data: { breadcrumb: 'List' }, loadComponent: () => import('./../features/inventory/po-list/po-list').then(m => m.PoList) },
      { path: 'add', data: { breadcrumb: 'Add New' }, loadComponent: () => import('./../features/inventory/po-form/po-form').then(m => m.PoForm) },
      { path: 'edit/:id', data: { breadcrumb: 'Edit' }, loadComponent: () => import('./../features/inventory/po-form/po-form').then(m => m.PoForm) }
    ]
  },

  {
    path: 'grn-list',
    data: { breadcrumb: 'GRN' },
    children: [
      { path: '', data: { breadcrumb: 'List' }, loadComponent: () => import('../features/inventory/grn-list-component/grn-list-component').then(m => m.GrnListComponent) },
      { path: 'add', data: { breadcrumb: 'Add New' }, loadComponent: () => import('../features/inventory/grn-form-component/grn-form-component').then(m => m.GrnFormComponent) },
      { path: 'edit/:id', data: { breadcrumb: 'Edit' }, loadComponent: () => import('../features/inventory/grn-form-component/grn-form-component').then(m => m.GrnFormComponent) },
      { path: 'view/:id', data: { breadcrumb: 'View' }, loadComponent: () => import('../features/inventory/grn-form-component/grn-form-component').then(m => m.GrnFormComponent) }
    ]
  },
  {
    path: 'current-stock',
    data: { breadcrumb: 'Current Stock' },
    children: [
      { path: '', data: { breadcrumb: 'List' }, loadComponent: () => import('../features/inventory/current-stock-component/current-stock-component').then(m => m.CurrentStockComponent) },

    ]
  },

  {
    path: 'solist',
    data: { breadcrumb: 'Sale Orders' },
    children: [
      { path: '', data: { breadcrumb: 'List' }, loadComponent: () => import('./../features/inventory/so-list/so-list').then(m => m.SoList) },
      { path: 'add', data: { breadcrumb: 'Add New' }, loadComponent: () => import('./../features/inventory/so-form/so-form').then(m => m.SoForm) },
      { path: 'edit/:id', data: { breadcrumb: 'Edit' }, loadComponent: () => import('./../features/inventory/so-form/so-form').then(m => m.SoForm) }
    ]
  }
];
