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
        let bestMatch: MenuItem | null = null;
        let longestUrlMatch = -1;

        const search = (menuItems: MenuItem[]) => {
            for (const item of menuItems) {
                if (item.url && item.url.trim() !== '') {
                    const cleanUrl = url.split('?')[0].replace(/\/$/, '').replace(/^\//, '');
                    const cleanItemUrl = item.url.split('?')[0].replace(/\/$/, '').replace(/^\//, '');

                    // Check if current URL matches this menu item or is a sub-path of it
                    const isExact = cleanUrl === cleanItemUrl;
                    const isPrefix = cleanUrl.startsWith(cleanItemUrl + '/');
                    const isSegment = cleanUrl.endsWith('/' + cleanItemUrl) || cleanUrl.includes('/' + cleanItemUrl + '/');

                    if (isExact || isPrefix || isSegment) {
                        // Pick the most specific match (the one with the longest URL)
                        if (cleanItemUrl.length > longestUrlMatch) {
                            longestUrlMatch = cleanItemUrl.length;
                            bestMatch = item;
                        }
                    }
                }

                if (item.children && item.children.length > 0) {
                    search(item.children);
                }
            }
        };

        search(items);
        return bestMatch;
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
