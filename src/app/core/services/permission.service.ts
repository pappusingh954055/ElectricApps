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
        const cleanUrl = this._normalize(url);
        if (!cleanUrl) return null;

        // Find the most specific (longest) match where the menu item's URL is a prefix of the current URL
        // This ensures that reports like 'finance/suppliers/report' inherit from 'finance/suppliers'
        return this._searchBestMatch(items, cleanUrl);
    }

    private _searchBestMatch(items: MenuItem[], targetUrl: string): MenuItem | null {
        let bestMatch: MenuItem | null = null;
        let longestUrlMatchLen = -1;

        const search = (menuItems: MenuItem[]) => {
            for (const item of menuItems) {
                if (item.url) {
                    const itemUrl = this._normalize(item.url);
                    // Check if current target URL starts with the menu item's URL
                    if (itemUrl !== '' && (targetUrl === itemUrl || targetUrl.startsWith(itemUrl + '/'))) {
                        if (itemUrl.length > longestUrlMatchLen) {
                            longestUrlMatchLen = itemUrl.length;
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

    private _normalize(url: string | null | undefined): string {
        if (!url) return '';
        return url.split('?')[0]
            .toLowerCase()
            .replace(/\/$/, '')
            .replace(/^\//, '')
            .replace(/^app\//, '') // Standarize: internal routes often exclude 'app/' in DB but have it in browser
            .trim();
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
