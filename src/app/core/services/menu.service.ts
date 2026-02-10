import { Injectable, inject } from "@angular/core";
import { BehaviorSubject, Observable, map, of, catchError } from "rxjs";
import { environment } from "../../enviornments/environment";
import { MenuItem } from "../models/menu-item.model";
import { AuthService } from "./auth.service";
import { RoleService } from "./role.service";
import { switchMap } from "rxjs";
import { ApiService } from "../../shared/api.service";

@Injectable({ providedIn: 'root' })
export class MenuService {
  private api = inject(ApiService);
  private authService = inject(AuthService);
  private roleService = inject(RoleService);

  private readonly baseUrl = environment.api.identity;

  // Get hierarchical menu for current user (sidebar)
  getMenu(): Observable<MenuItem[]> {
    const roleName = this.authService.getUserRole();

    return this.roleService.getAllRoles().pipe(
      switchMap(roles => {
        const userRole = roles.find(r => r.roleName === roleName);
        const roleId = userRole ? userRole.id : 0;

        return this.roleService.getRolePermissions(roleId).pipe(
          switchMap(permissions => {
            return this.getAllMenus().pipe(
              map(flatMenus => {
                if (!flatMenus || flatMenus.length === 0) return [];

                // 1. Build Tree
                const menuTree = this.buildMenuTree(flatMenus);

                // 2. Sort Tree (Recursive) - Dynamic based on Order column
                const sortedTree = this.sortMenus(menuTree);

                // 3. Filter by Permissions
                return this.filterMenusByPermissions(sortedTree, permissions);
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

  buildMenuTree(flatMenus: MenuItem[]): MenuItem[] {
    const menuMap = new Map<number, MenuItem>();
    const rootMenus: MenuItem[] = [];

    // 1. Initialize map and sort flat list by order first
    const sortedFlat = [...flatMenus].sort((a, b) => (a.order || 0) - (b.order || 0));

    sortedFlat.forEach(menu => {
      menu.children = [];
      if (menu.id) {
        menuMap.set(menu.id, menu);
      }
    });

    // 2. Link children to parents
    sortedFlat.forEach(menu => {
      if (menu.parentId) {
        const parent = menuMap.get(menu.parentId);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(menu);
        }
      } else {
        rootMenus.push(menu);
      }
    });

    return rootMenus;
  }

  // Generic sorting by order property
  sortMenus(menus: MenuItem[]): MenuItem[] {
    if (!menus) return [];

    // Sort current level
    menus.sort((a, b) => (a.order || 0) - (b.order || 0));

    // Recursively sort children
    menus.forEach(menu => {
      if (menu.children && menu.children.length > 0) {
        this.sortMenus(menu.children);
      }
    });

    return menus;
  }

  private filterMenusByPermissions(menus: MenuItem[], permissions: any[]): MenuItem[] {
    return menus.map(menu => {
      const perm = permissions.find(p => p.menuId === menu.id);
      const canView = perm ? !!perm.canView : false;

      let children: MenuItem[] = [];
      if (menu.children && menu.children.length > 0) {
        children = this.filterMenusByPermissions(menu.children, permissions);
      }

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

  getAllMenus(): Observable<MenuItem[]> {
    return this.api.get<MenuItem[]>('menus', this.baseUrl).pipe(
      catchError(() => of([]))
    );
  }

  createMenu(menu: MenuItem): Observable<MenuItem> {
    return this.api.post<MenuItem>('menus', menu, this.baseUrl);
  }

  updateMenu(id: number, menu: MenuItem): Observable<MenuItem> {
    return this.api.put<MenuItem>(`menus/${id}`, menu, this.baseUrl);
  }

  deleteMenu(id: number): Observable<void> {
    return this.api.delete<void>(`menus/${id}`, this.baseUrl);
  }
}

