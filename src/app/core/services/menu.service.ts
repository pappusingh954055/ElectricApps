import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { BehaviorSubject, Observable, map, of } from "rxjs";
import { environment } from "../../enviornments/environment";
import { MenuItem } from "../models/menu-item.model";

@Injectable({ providedIn: 'root' })
export class MenuService {

  private readonly baseUrl = environment.LoginApiBaseUrl.replace('/auth', '') + '/menus';

  constructor(private http: HttpClient) { }

  // Get hierarchical menu for current user (sidebar)
  getMenu(): Observable<MenuItem[]> {
    return this.http.get<MenuItem[]>(`${this.baseUrl}/user-menu`);
  }

  // Get all menus (flat or tree) for Admin management
  getAllMenus(): Observable<MenuItem[]> {
    return this.http.get<MenuItem[]>(this.baseUrl);
  }

  createMenu(menu: MenuItem): Observable<MenuItem> {
    return this.http.post<MenuItem>(this.baseUrl, menu);
  }

  updateMenu(id: number, menu: MenuItem): Observable<MenuItem> {
    return this.http.put<MenuItem>(`${this.baseUrl}/${id}`, menu);
  }

  deleteMenu(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  private getStaticMenu(): MenuItem[] {
    return [
      {
        title: 'Dashboard',
        icon: 'dashboard',
        url: '/app/dashboard',
        permissions: { canView: true, canAdd: false, canEdit: false, canDelete: false }
      },
      {
        title: 'Inventory',
        icon: 'layers',
        url: '',
        children: [
          {
            title: 'Purchase Order',
            icon: 'shopping_cart',
            url: '/app/inventory/polist',
            permissions: { canView: true, canAdd: true, canEdit: true, canDelete: true }
          },
          {
            title: 'Sale Order',
            icon: 'description',
            url: '/app/inventory/solist',
            permissions: { canView: true, canAdd: true, canEdit: true, canDelete: true }
          },
          {
            title: 'GRN List',
            icon: 'list',
            url: '/app/inventory/grn-list',
            permissions: { canView: true, canAdd: true, canEdit: true, canDelete: true }
          },
          {
            title: 'Current Stock',
            icon: 'shopping_cart',
            url: '/app/inventory/current-stock',
            permissions: { canView: true, canAdd: true, canEdit: true, canDelete: true }
          },
          {
            title: 'Purchase Return',
            icon: 'assignment_return',
            url: '/app/inventory/purchase-return',
            permissions: { canView: true, canAdd: true, canEdit: true, canDelete: true }
          },
          {
            title: 'Sale Return',
            icon: 'assignment_return',
            url: '/app/inventory/sale-return',
            permissions: { canView: true, canAdd: true, canEdit: true, canDelete: true }
          },
        ]
      },
      {
        title: 'Masters',
        icon: 'layers',
        url: '',
        children: [
          {
            title: 'Categories',
            icon: 'category',
            url: '/app/master/categories',
            permissions: { canView: true, canAdd: true, canEdit: true, canDelete: true }
          },
          {
            title: 'Subcategories',
            icon: 'list_alt',
            url: '/app/master/subcategories',
            permissions: { canView: true, canAdd: true, canEdit: true, canDelete: true }
          },
          {
            title: 'Products',
            icon: 'inventory_2',
            url: '/app/master/products',
            permissions: { canView: true, canAdd: true, canEdit: true, canDelete: true }
          },
          {
            title: 'Suppliers',
            icon: 'local_shipping',
            url: '/app/master/suppliers',
            permissions: { canView: true, canAdd: true, canEdit: true, canDelete: true }
          },
          {
            title: 'Customers',
            icon: 'person',
            url: '/app/master/customer',
            permissions: { canView: true, canAdd: true, canEdit: true, canDelete: true }
          },
          {
            title: 'Price Lists',
            icon: 'price_check',
            url: '/app/master/pricelists',
            permissions: { canView: true, canAdd: true, canEdit: true, canDelete: true }
          }
        ]
      },
      {
        title: 'Admin',
        icon: 'admin_panel_settings',
        url: '',
        children: [
          {
            title: 'Role Permissions',
            icon: 'security',
            url: '/app/admin/role-permissions',
            permissions: { canView: true, canAdd: true, canEdit: true, canDelete: true }
          },
          {
            title: 'Users',
            icon: 'people',
            url: '/app/admin/users',
            permissions: { canView: true, canAdd: true, canEdit: true, canDelete: true }
          }
        ]
      }
    ];
  }
}
