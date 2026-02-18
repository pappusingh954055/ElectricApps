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

    private _normalize(url: string | null | undefined): string {
        if (!url) return '';
        let clean = url.split('?')[0].toLowerCase().trim();

        // Remove leading slash
        if (clean.startsWith('/')) {
            clean = clean.substring(1);
        }

        // Remove 'app/' prefix if present
        if (clean.startsWith('app/')) {
            clean = clean.substring(4);
        }

        // Remove trailing slash
        if (clean.endsWith('/')) {
            clean = clean.substring(0, clean.length - 1);
        }

        return clean;
    }

    private _searchBestMatch(items: MenuItem[], targetUrl: string): MenuItem | null {
        let bestMatch: MenuItem | null = null;
        let longestUrlMatchLen = -1;

        const search = (list: MenuItem[]) => {
            for (const item of list) {
                if (item.url) {
                    const itemUrl = this._normalize(item.url);

                    // Logic: Match Exact OR Parent-Child relationship
                    // Example: Menu='inventory/gate-pass', Target='inventory/gate-pass/outward' -> Match!
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

    checkPermissionWithData(menus: MenuItem[], url: string, action: 'CanView' | 'CanAdd' | 'CanEdit' | 'CanDelete'): boolean {
        const normalizedUrl = this._normalize(url);
        console.log(`[PermissionService] Checking ${action} for URL: '${url}' (Normalized: '${normalizedUrl}')`);

        const menuItem = this._searchBestMatch(menus, normalizedUrl); // Use internal match logic directly

        if (!menuItem) {
            console.warn(`[PermissionService] No matching menu item found for: ${normalizedUrl}`);
            return false;
        }

        if (!menuItem.permissions) {
            console.warn(`[PermissionService] Menu item found (${menuItem.title}) but has no permissions object.`);
            return false;
        }

        const hasPerm = menuItem.permissions[action === 'CanView' ? 'canView' : action === 'CanAdd' ? 'canAdd' : action === 'CanEdit' ? 'canEdit' : 'canDelete'];
        console.log(`[PermissionService] Found Menu: ${menuItem.title} (${menuItem.url}) -> ${action}: ${hasPerm}`);

        return hasPerm;
    }

    checkPermission(url: string, action: 'CanView' | 'CanAdd' | 'CanEdit' | 'CanDelete'): boolean {
        return this.checkPermissionWithData(this.menuItems, url, action);
    }

    hasPermission(action: 'CanView' | 'CanAdd' | 'CanEdit' | 'CanDelete'): boolean {
        return this.checkPermissionWithData(this.menuItems, this.router.url, action);
    }
}
