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
        path: 'master',
        loadChildren: () =>
          import('./routes/master.routes')
            .then(m => m.MASTER_ROUTES)
      },
      {
        path: 'company',
        loadChildren: () =>
          import('./routes/company.routes')
            .then(m => m.COMPANY_ROUTES)
      },


      {
        path: 'inventory',
        data: { breadcrumb: 'Inventory' },
        loadChildren: () =>
          import('./routes/inventory.routes')
            .then(m => m.INVENTORY_ROUTES)
      },
      {
        path: 'admin',
        data: { breadcrumb: 'Admin' },
        loadChildren: () => import('./routes/admin.routes').then(m => m.ADMIN_ROUTES)
      },
      {
        path: 'finance',
        data: { breadcrumb: 'Finance' },
        loadChildren: () => import('./routes/finance.routes').then(m => m.FINANCE_ROUTES)
      }
    ]
  },

  // 🔁 Redirects
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'app/dashboard' }
];
