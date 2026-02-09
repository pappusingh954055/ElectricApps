import { Injectable } from "@angular/core";
import { Router, NavigationEnd } from "@angular/router";
import { MenuService } from "./menu.service";
import { MenuItem } from "../models/menu-item.model";
import { filter } from "rxjs/operators";

@Injectable({ providedIn: 'root' })
export class PermissionService {

    private currentMenuPermissions: any = null;
    private menuItems: MenuItem[] = [];

    constructor(private router: Router, private menuService: MenuService) {
        // Load menus
        this.menuService.getMenu().subscribe(menus => {
            this.menuItems = menus;
            this.updateCurrentPermissions();
        });

        // Listen to route changes
        this.router.events.pipe(
            filter(event => event instanceof NavigationEnd)
        ).subscribe(() => {
            this.updateCurrentPermissions();
        });
    }

    private updateCurrentPermissions() {
        const currentUrl = this.router.url;
        // Find matching menu item. Matches prefix or exact?
        // Usually exact or matching route definition.
        const menuItem = this.findMenuItemRecursive(this.menuItems, currentUrl);

        if (menuItem && menuItem.permissions) {
            this.currentMenuPermissions = menuItem.permissions;
        } else {
            // Default or null
            this.currentMenuPermissions = null;
        }
    }

    private findMenuItemRecursive(items: MenuItem[], url: string): MenuItem | null {
        for (const item of items) {
            // Check for children first to find the most specific match (leaf node)
            if (item.children && item.children.length > 0) {
                const found = this.findMenuItemRecursive(item.children, url);
                if (found) return found;
            }

            // Check if this item matches the URL. 
            if (item.url && item.url.trim() !== '') {
                // Normalize both URLs: remove query params, trailing slashes, and leading slashes for comparison
                const cleanUrl = url.split('?')[0].replace(/\/$/, '').replace(/^\//, '');
                const cleanItemUrl = item.url.split('?')[0].replace(/\/$/, '').replace(/^\//, '');

                // Match if exact or if the current URL ends with the menu's path segment
                // e.g. 'app/dashboard' matches 'dashboard'
                if (cleanUrl === cleanItemUrl || cleanUrl.endsWith('/' + cleanItemUrl)) {
                    return item;
                }
            }
        }
        return null;
    }

    checkPermissionWithData(menus: MenuItem[], url: string, action: 'CanView' | 'CanAdd' | 'CanEdit' | 'CanDelete'): boolean {
        const menuItem = this.findMenuItemRecursive(menus, url);
        if (!menuItem || !menuItem.permissions) {
            return false;
        }

        switch (action) {
            case 'CanView': return menuItem.permissions.canView;
            case 'CanAdd': return menuItem.permissions.canAdd;
            case 'CanEdit': return menuItem.permissions.canEdit;
            case 'CanDelete': return menuItem.permissions.canDelete;
            default: return false;
        }
    }

    checkPermission(url: string, action: 'CanView' | 'CanAdd' | 'CanEdit' | 'CanDelete'): boolean {
        return this.checkPermissionWithData(this.menuItems, url, action);
    }

    hasPermission(action: 'CanView' | 'CanAdd' | 'CanEdit' | 'CanDelete'): boolean {
        return this.checkPermissionWithData(this.menuItems, this.router.url, action);
    }
}
