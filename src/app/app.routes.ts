import { Routes } from '@angular/router';
import { authGuard } from './core/gaurds/auth.guard';

export const routes: Routes = [
  // 🔐 1. Login Page (No Guard)
  {
    path: 'login',
    loadComponent: () =>
      import('./auth/login-component/login-component')
        .then(m => m.LoginComponent)
  },

  // 🧱 2. Main Layout (Secure with AuthGuard)
  {
    path: 'app',
    //canActivate: [authGuard],
    loadComponent: () =>
      import('./layout/main-layout-component/main-layout-component')
        .then(m => m.MainLayoutComponent),
    children: [
      // 📊 Dashboard
      {
        path: 'dashboard',
        data: { breadcrumb: 'Dashboard' },
        loadComponent: () =>
          import('./features/dashboard/dashboard-component/dashboard-component')
            .then(m => m.DashboardComponent)
      },

      // 🧾 Purchase Orders
      {
        path: 'purchase-orders',
        data: { breadcrumb: 'Purchase Orders' },
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/purchase-orders/po-list/po-list').then(m => m.PoList)
          },
          {
            path: 'add',
            data: { breadcrumb: 'New PO' },
            loadComponent: () =>
              import('./features/purchase-orders/po-form/po-form').then(m => m.PoForm)
          },
          {
            path: 'edit/:id',
            data: { breadcrumb: 'Edit PO' },
            loadComponent: () =>
              import('./features/purchase-orders/po-form/po-form').then(m => m.PoForm)
          },
          {
            path: 'print/:id',
            data: { breadcrumb: 'Print PO' },
            loadComponent: () =>
              import('./features/purchase-orders/po-print/po-print').then(m => m.PoPrint)
          }
        ]
      },

      // 💰 Sales Orders
      {
        path: 'sales-orders',
        data: { breadcrumb: 'Sales Orders' },
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/sales-orders/so-list/so-list').then(m => m.SoList)
          },
          {
            path: 'add',
            data: { breadcrumb: 'New Sales Order' },
            loadComponent: () =>
              import('./features/sales-orders/so-form/so-form').then(m => m.SoForm)
          },
          {
            path: 'edit/:id',
            data: { breadcrumb: 'Edit Sales Order' },
            loadComponent: () =>
              import('./features/sales-orders/so-form/so-form').then(m => m.SoForm)
          },
          {
            path: 'print/:id',
            data: { breadcrumb: 'Print Sales Order' },
            loadComponent: () =>
              import('./features/sales-orders/so-print/so-print').then(m => m.SoPrint)
          }
        ]
      },

      // 🧱 MASTER MODULES
      {
        path: 'master',
        data: { breadcrumb: 'Masters' },
        children: [
          // 🟦 Category
          {
            path: 'categories',
            data: { breadcrumb: 'Categories' },
            children: [
              {
                path: '',
                data: { breadcrumb: 'Details Page' },
                loadComponent: () =>
                  import('./features/master/category/category-list/category-list').then(m => m.CategoryList)
              },
              {
                path: 'add',
                data: { breadcrumb: 'Add Category' },
                loadComponent: () =>
                  import('./features/master/category/category-form/category-form').then(m => m.CategoryForm)
              },
              {
                path: 'edit/:id',
                data: { breadcrumb: 'Edit Category' },
                loadComponent: () =>
                  import('./features/master/category/category-form/category-form').then(m => m.CategoryForm)
              }
            ]
          },
          // 🟩 Subcategory
          {
            path: 'subcategories',
            data: { breadcrumb: 'Subcategories' },
            children: [
              {
                path: '',
                loadComponent: () =>
                  import('./features/master/subcategory/subcategory-list/subcategory-list').then(m => m.SubcategoryList)
              },
              {
                path: 'add',
                loadComponent: () =>
                  import('./features/master/subcategory/subcategory-form/subcategory-form').then(m => m.SubcategoryForm)
              },
              {
                path: 'edit/:id',
                loadComponent: () =>
                  import('./features/master/subcategory/subcategory-form/subcategory-form').then(m => m.SubcategoryForm)
              }
            ]
          },
          // 🟨 Product
          {
            path: 'products',
            data: { breadcrumb: 'Products' },
            children: [
              {
                path: '',
                loadComponent: () =>
                  import('./features/master/product/product-list/product-list').then(m => m.ProductList)
              },
              {
                path: 'add',
                loadComponent: () =>
                  import('./features/master/product/product-form/product-form').then(m => m.ProductForm)
              },
              {
                path: 'edit/:id',
                loadComponent: () =>
                  import('./features/master/product/product-form/product-form').then(m => m.ProductForm)
              }
            ]
          },
          // 🧾 Price List
          {
            path: 'pricelists',
            data: { breadcrumb: 'Price Lists' },
            children: [
              {
                path: '',
                loadComponent: () =>
                  import('./features/master/pricelist/pricelist-list/pricelist-list').then(m => m.PricelistList)
              },
              {
                path: 'add',
                loadComponent: () =>
                  import('./features/master/pricelist/pricelist-form/pricelist-form').then(m => m.PricelistForm)
              },
              {
                path: 'edit/:id',
                loadComponent: () =>
                  import('./features/master/pricelist/pricelist-form/pricelist-form').then(m => m.PricelistForm)
              }
            ]
          }
        ]
      },

      // 📦 INVENTORY MODULES
      {
        path: 'inventory',
        data: { breadcrumb: 'Inventory' },
        children: [
          {
            path: 'polist',
            data: { breadcrumb: 'PO List' },
            children: [
              {
                path: '',
                loadComponent: () =>
                  import('./features/inventory/po-list/po-list').then(m => m.PoList)
              },
              {
                path: 'add',
                loadComponent: () =>
                  import('./features/inventory/po-form/po-form').then(m => m.PoForm)
              },
              {
                path: 'edit/:id',
                loadComponent: () =>
                  import('./features/inventory/po-form/po-form').then(m => m.PoForm)
              }
            ]
          },
          {
            path: 'solist',
            data: { breadcrumb: 'Create SO' },
            children: [
              {
                path: 'add',
                loadComponent: () =>
                  import('./features/inventory/so-form/so-form').then(m => m.SoForm)
              }
            ]
          }
        ]
      }
    ]
  },

  // 🔚 3. Redirects & Wildcards
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' } // Agar URL galat ho ya logout ho jaye, toh wapas login par.
];