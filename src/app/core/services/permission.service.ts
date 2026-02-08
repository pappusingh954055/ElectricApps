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
            if (item.url && url.includes(item.url)) {
                // Simple match, might need strict match
                return item;
            }
            if (item.children) {
                const found = this.findMenuItemRecursive(item.children, url);
                if (found) return found;
            }
        }
        return null;
    }

    checkPermission(url: string, action: 'CanView' | 'CanAdd' | 'CanEdit' | 'CanDelete'): boolean {
        const menuItem = this.findMenuItemRecursive(this.menuItems, url);
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

    hasPermission(action: 'CanView' | 'CanAdd' | 'CanEdit' | 'CanDelete'): boolean {
        return this.checkPermission(this.router.url, action);
    }
}
