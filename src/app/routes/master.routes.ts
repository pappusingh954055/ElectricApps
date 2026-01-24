import { Routes } from '@angular/router';

export const MASTER_ROUTES: Routes = [

  {
    path: 'categories',
    children: [
      { path: '', loadComponent: () => import('./../features/master/category/category-list/category-list').then(m => m.CategoryList) },
      { path: 'add', loadComponent: () => import('./../features/master/category/category-form/category-form').then(m => m.CategoryForm) },
      { path: 'edit/:id', loadComponent: () => import('./../features/master/category/category-form/category-form').then(m => m.CategoryForm) }
    ]
  },

  {
    path: 'subcategories',
    children: [
      { path: '', loadComponent: () => import('./../features/master/subcategory/subcategory-list/subcategory-list').then(m => m.SubcategoryList) },
      { path: 'add', loadComponent: () => import('./../features/master/subcategory/subcategory-form/subcategory-form').then(m => m.SubcategoryForm) },
      { path: 'edit/:id', loadComponent: () => import('./../features/master/subcategory/subcategory-form/subcategory-form').then(m => m.SubcategoryForm) }
    ]
  },

  {
    path: 'products',
    children: [
      { path: '', loadComponent: () => import('./../features/master/product/product-list/product-list').then(m => m.ProductList) },
      { path: 'add', loadComponent: () => import('./../features/master/product/product-form/product-form').then(m => m.ProductForm) },
      { path: 'edit/:id', loadComponent: () => import('./../features/master/product/product-form/product-form').then(m => m.ProductForm) }
    ]
  },

  {
    path: 'pricelists',
    children: [
      { path: '', loadComponent: () => import('./../features/master/pricelist/pricelist-list/pricelist-list').then(m => m.PricelistList) },
      { path: 'add', loadComponent: () => import('./../features/master/pricelist/pricelist-form/pricelist-form').then(m => m.PricelistForm) },
      { path: 'edit/:id', loadComponent: () => import('./../features/master/pricelist/pricelist-form/pricelist-form').then(m => m.PricelistForm) }
    ]
  }

];
