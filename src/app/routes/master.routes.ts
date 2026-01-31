import { Routes } from '@angular/router';

export const MASTER_ROUTES: Routes = [

  {
    path: 'categories',
    data: { breadcrumb: 'Categories' },
    children: [
      { path: '', data: { breadcrumb: 'List' }, loadComponent: () => import('./../features/master/category/category-list/category-list').then(m => m.CategoryList) },
      { path: 'add', data: { breadcrumb: 'Add New' }, loadComponent: () => import('./../features/master/category/category-form/category-form').then(m => m.CategoryForm) },
      { path: 'edit/:id', data: { breadcrumb: 'Edit' }, loadComponent: () => import('./../features/master/category/category-form/category-form').then(m => m.CategoryForm) }
    ]
  },

  {
    path: 'subcategories',
    data: { breadcrumb: 'Subcategories' },
    children: [
      { path: '', data: { breadcrumb: 'List' }, loadComponent: () => import('./../features/master/subcategory/subcategory-list/subcategory-list').then(m => m.SubcategoryList) },
      { path: 'add', data: { breadcrumb: 'Add New' }, loadComponent: () => import('./../features/master/subcategory/subcategory-form/subcategory-form').then(m => m.SubcategoryForm) },
      { path: 'edit/:id', data: { breadcrumb: 'Edit' }, loadComponent: () => import('./../features/master/subcategory/subcategory-form/subcategory-form').then(m => m.SubcategoryForm) }
    ]
  },

  {
    path: 'products',
    data: { breadcrumb: 'Products' },
    children: [
      { path: '', data: { breadcrumb: 'List' }, loadComponent: () => import('./../features/master/product/product-list/product-list').then(m => m.ProductList) },
      { path: 'add', data: { breadcrumb: 'Add New' }, loadComponent: () => import('./../features/master/product/product-form/product-form').then(m => m.ProductForm) },
      { path: 'edit/:id', data: { breadcrumb: 'Edit' }, loadComponent: () => import('./../features/master/product/product-form/product-form').then(m => m.ProductForm) }
    ]
  },

  {
    path: 'pricelists',
    data: { breadcrumb: 'Price Lists' },
    children: [
      { path: '', data: { breadcrumb: 'List' }, loadComponent: () => import('./../features/master/pricelist/pricelist-list/pricelist-list').then(m => m.PricelistList) },
      { path: 'add', data: { breadcrumb: 'Add New' }, loadComponent: () => import('./../features/master/pricelist/pricelist-form/pricelist-form').then(m => m.PricelistForm) },
      { path: 'edit/:id', data: { breadcrumb: 'Edit' }, loadComponent: () => import('./../features/master/pricelist/pricelist-form/pricelist-form').then(m => m.PricelistForm) }
    ]
  }

];
