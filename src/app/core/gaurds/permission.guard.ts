import { Injectable, inject } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { PermissionService } from '../services/permission.service';
import { MenuService } from '../services/menu.service';
import { AuthService } from '../services/auth.service';
import { Observable, map, of, catchError } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { StatusDialogComponent } from '../../shared/components/status-dialog-component/status-dialog-component';

@Injectable({ providedIn: 'root' })
export class PermissionGuard implements CanActivate {
    private router = inject(Router);
    private permissionService = inject(PermissionService);
    private menuService = inject(MenuService);
    private authService = inject(AuthService);
    private dialog = inject(MatDialog);

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
        console.log(`[PermissionGuard] Checking access for: ${state.url}`);

        return this.menuService.getMenu().pipe(
            map((menus: any[]) => {
                if (!menus || menus.length === 0) {
                    console.error('[PermissionGuard] No menus loaded. Denying access to:', state.url);
                }

                const hasViewPermission = this.permissionService.checkPermissionWithData(menus as any, state.url, 'CanView');

                console.log(`[PermissionGuard] Access result for ${state.url}:`, hasViewPermission);

                if (hasViewPermission) {
                    return true;
                }

                console.error(`[PermissionGuard] Access Denied to ${state.url}`);

                const errorMessage = (menus && menus.length > 0)
                    ? `Access Denied: You do not have permission to view the requested page (${state.url}).`
                    : 'Access Denied: Your account has no assigned roles or permissions. Please contact your administrator.';

                // Show proper error message using StatusDialogComponent
                this.dialog.open(StatusDialogComponent, {
                    data: {
                        isSuccess: false,
                        message: errorMessage
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
