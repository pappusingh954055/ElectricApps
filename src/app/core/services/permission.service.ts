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
            // item.url must be non-empty and must match exactly or be the start of the URL.
            if (item.url && item.url.trim() !== '') {
                // Remove trailing slashes and potential query params for comparison if needed
                const cleanUrl = url.split('?')[0].replace(/\/$/, '');
                const cleanItemUrl = item.url.split('?')[0].replace(/\/$/, '');

                if (cleanUrl === cleanItemUrl) {
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
