import { Routes } from '@angular/router';

export const INVENTORY_ROUTES: Routes = [

  {
    path: 'polist',
    children: [
      { path: '', loadComponent: () => import('./../features/inventory/po-list/po-list').then(m => m.PoList) },
      { path: 'add', loadComponent: () => import('./../features/inventory/po-form/po-form').then(m => m.PoForm) },
      { path: 'edit/:id', loadComponent: () => import('./../features/inventory/po-form/po-form').then(m => m.PoForm) }
    ]
  },

  {
    path: 'solist',
    children: [
      { path: 'add', loadComponent: () => import('./../features/inventory/so-form/so-form').then(m => m.SoForm) }
    ]
  }
];
