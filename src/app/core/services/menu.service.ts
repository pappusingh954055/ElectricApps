import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { BehaviorSubject, Observable, map, of, catchError } from "rxjs";
import { environment } from "../../enviornments/environment";
import { MenuItem } from "../models/menu-item.model";
import { AuthService } from "./auth.service";
import { RoleService } from "./role.service";
import { switchMap } from "rxjs";

@Injectable({ providedIn: 'root' })
export class MenuService {

  private readonly baseUrl = environment.LoginApiBaseUrl.replace('/auth', '') + '/menus';

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private roleService: RoleService
  ) { }

  // Get hierarchical menu for current user (sidebar)
  getMenu(): Observable<MenuItem[]> {
    const roleName = this.authService.getUserRole();

    return this.roleService.getAllRoles().pipe(
      switchMap(roles => {
        const userRole = roles.find(r => r.roleName === roleName);
        const roleId = userRole ? userRole.id : 0; // Default or handle error

        return this.roleService.getRolePermissions(roleId).pipe(
          switchMap(permissions => {
            return this.getAllMenus().pipe(
              map(flatMenus => {
                if (!flatMenus) return [];

                // 1. Build Tree from Flat List
                const menuTree = this.buildMenuTree(flatMenus);

                // 2. Filter Tree by Permissions
                return this.filterMenusByPermissions(menuTree, permissions);
              })
            );
          })
        );
      }),
      catchError(err => {
        console.error('Error loading menu:', err);
        return of([]);
      })
    );
  }

  private buildMenuTree(flatMenus: MenuItem[]): MenuItem[] {
    const menuMap = new Map<number, MenuItem>();
    const rootMenus: MenuItem[] = [];

    // 1. Initialize map and ensure children arrays exist
    flatMenus.forEach(menu => {
      // Create a shallow copy to manage references cleanly if needed, 
      // but here we modify the objects to link them.
      menu.children = [];
      if (menu.id) {
        menuMap.set(menu.id, menu);
      }
    });

    // 2. Link children to parents
    flatMenus.forEach(menu => {
      if (menu.parentId) {
        const parent = menuMap.get(menu.parentId);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(menu);
        }
      } else {
        // No parentId means it's a root item
        rootMenus.push(menu);
      }
    });

    return rootMenus;
  }

  private filterMenusByPermissions(menus: MenuItem[], permissions: any[]): MenuItem[] {
    return menus.map(menu => {
      // Find permission for this menu
      const perm = permissions.find(p => p.menuId === menu.id);

      // If no permission record, assume hidden.
      const canView = perm ? !!perm.canView : false;

      // Process children recursively
      let children: MenuItem[] = [];
      if (menu.children && menu.children.length > 0) {
        children = this.filterMenusByPermissions(menu.children, permissions);
      }

      // Return the menu if it is viewable
      if (canView) {
        return {
          ...menu,
          children: children,
          permissions: perm ? {
            canView: !!perm.canView,
            canAdd: !!perm.canAdd,
            canEdit: !!perm.canEdit,
            canDelete: !!perm.canDelete
          } : undefined
        };
      }
      return null;
    }).filter(m => m !== null) as MenuItem[];
  }

  // Get all menus (flat or tree) for Admin management
  getAllMenus(): Observable<MenuItem[]> {
    return this.http.get<MenuItem[]>(this.baseUrl).pipe(
      map(menus => {
        if (!menus || menus.length === 0) return [];
        // If it's a tree structure, sort Masters. If it's flat, sorting is harder but usually tree is returned.
        return this.sortMastersMenu(menus);
      }),
      catchError(() => of([]))
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


}
