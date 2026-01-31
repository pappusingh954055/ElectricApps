import { Routes } from '@angular/router';
import { authGuard } from './core/gaurds/auth.guard';

export const routes: Routes = [

  // 🔐 Public
  {
    path: 'login',
    loadComponent: () =>
      import('./auth/login-component/login-component')
        .then(m => m.LoginComponent)
  },
  {
    path: 'app',
    canActivate: [authGuard],
    data: { breadcrumb: 'Home' },
    loadComponent: () =>
      import('./layout/main-layout-component/main-layout-component')
        .then(m => m.MainLayoutComponent),

    children: [
      {
        path: 'dashboard',
        data: { breadcrumb: 'Dashboard' },
        loadChildren: () =>
          import('./routes/dashboard.routes')
            .then(m => m.DASHBOARD_ROUTES)
      },
      {
        path: 'purchase-orders',
        loadChildren: () =>
          import('./routes/po.routes')
            .then(m => m.PO_ROUTES)
      },
      {
        path: 'sales-orders',
        loadChildren: () =>
          import('./routes/so.routes')
            .then(m => m.SO_ROUTES)
      },
      {
        path: 'master',
        loadChildren: () =>
          import('./routes/master.routes')
            .then(m => m.MASTER_ROUTES)
      },
      {
        path: 'inventory',
        data: { breadcrumb: 'Inventory' },
        loadChildren: () =>
          import('./routes/inventory.routes')
            .then(m => m.INVENTORY_ROUTES)
      }
    ]
  },

  // 🔁 Redirects
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'app/dashboard' }
];
