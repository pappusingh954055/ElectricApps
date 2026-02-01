import { Injectable } from "@angular/core";

@Injectable({ providedIn: 'root' })
export class MenuService {

  getMenu() {
    return [

      {
        label: 'Dashboard',
        icon: 'dashboard',
        route: '/app/dashboard'
      },
      {
        label: 'Inventory',
        icon: 'layers',
        children: [
          {
            label: 'Purchase Order',
            icon: 'shopping_cart',
            route: '/app/inventory/polist'
          },
          {
            label: 'Sale Order',
            icon: 'description',
            route: '/app/inventory/solist/add'
          },
          {
            label: 'GRN List',
            icon: 'list',
            route: '/app/inventory/grn-list'
          },
          {
            label: 'Current Stock',
            icon: 'shopping_cart',
            route: '/app/inventory/current-stock'
          },
        ]
      },

      {
        label: 'Masters',
        icon: 'layers',
        children: [
          {
            label: 'Categories',
            icon: 'category',
            route: '/app/master/categories'
          },
          {
            label: 'Subcategories',
            icon: 'list_alt',
            route: '/app/master/subcategories'
          },
          {
            label: 'Products',
            icon: 'inventory_2',
            route: '/app/master/products'
          },
          {
            label: 'Suppliers',
            icon: 'local_shipping',
            route: '/app/master/suppliers'
          },
          {
            label: 'Customers',
            icon: 'person',
            route: '/app/master/customer'
          },
          {
            label: 'Price Lists',
            icon: 'price_check',
            route: '/app/master/pricelists'
          }
        ]
      }
    ];
  }
}
