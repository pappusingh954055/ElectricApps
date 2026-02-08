import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { BehaviorSubject, Observable, map, of, catchError } from "rxjs";
import { environment } from "../../enviornments/environment";
import { MenuItem } from "../models/menu-item.model";

@Injectable({ providedIn: 'root' })
export class MenuService {

  private readonly baseUrl = environment.LoginApiBaseUrl.replace('/auth', '') + '/menus';

  constructor(private http: HttpClient) { }

  // Get hierarchical menu for current user (sidebar)
  getMenu(): Observable<MenuItem[]> {
    return this.http.get<MenuItem[]>(`${this.baseUrl}/user-menu`).pipe(
      map(menus => {
        if (!menus || menus.length === 0) return this.getStaticMenu();
        return this.sortMastersMenu(menus);
      }),
      catchError(() => of(this.getStaticMenu()))
    );
  }

  // Get all menus (flat or tree) for Admin management
  getAllMenus(): Observable<MenuItem[]> {
    return this.http.get<MenuItem[]>(this.baseUrl).pipe(
      map(menus => {
        if (!menus || menus.length === 0) return this.getStaticMenu();
        // If it's a tree structure, sort Masters. If it's flat, sorting is harder but usually tree is returned.
        return this.sortMastersMenu(menus);
      }),
      catchError(() => of(this.getStaticMenu()))
    );
  }

  private sortMastersMenu(menus: MenuItem[]): MenuItem[] {
    const masterOrder = ['Categories', 'Subcategories', 'Products', 'Price Lists', 'Suppliers', 'Customers'];

    const mastersIndex = menus.findIndex(m => m.title === 'Masters');
    if (mastersIndex !== -1 && menus[mastersIndex].children) {
      menus[mastersIndex].children.sort((a, b) => {
        const indexA = masterOrder.indexOf(a.title);
        const indexB = masterOrder.indexOf(b.title);

        // If not found in our order list, push to the end
        const orderA = indexA === -1 ? 99 : indexA;
        const orderB = indexB === -1 ? 99 : indexB;

        return orderA - orderB;
      });
    }
    return menus;
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
            title: 'Price Lists',
            icon: 'price_check',
            url: '/app/master/pricelists',
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
