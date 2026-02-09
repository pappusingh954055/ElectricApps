import { Injectable, inject } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { PermissionService } from '../services/permission.service';
import { MenuService } from '../services/menu.service';
import { Observable, map, of, catchError } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { StatusDialogComponent } from '../../shared/components/status-dialog-component/status-dialog-component';

@Injectable({ providedIn: 'root' })
export class PermissionGuard implements CanActivate {
    private router = inject(Router);
    private permissionService = inject(PermissionService);
    private menuService = inject(MenuService);
    private dialog = inject(MatDialog);

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
        // We fetch the latest menu/permissions from the DB to ensure we don't use stale data after login
        return this.menuService.getMenu().pipe(
            map(menus => {
                const hasViewPermission = this.permissionService.checkPermissionWithData(menus, state.url, 'CanView');

                if (hasViewPermission) {
                    return true;
                }

                console.error(`[PermissionGuard] Access Denied to ${state.url}`);

                // Show proper error message using StatusDialogComponent
                this.dialog.open(StatusDialogComponent, {
                    data: {
                        isSuccess: false,
                        message: 'Access Denied: Your account has no assigned roles or permissions. Please contact your administrator.'
                    },
                    disableClose: true
                });

                return false;
            }),
            catchError((err) => {
                console.error('[PermissionGuard] Error checking permissions:', err);
                return of(false);
            })
        );
    }
}
