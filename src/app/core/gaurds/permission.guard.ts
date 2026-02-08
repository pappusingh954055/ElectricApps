import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { PermissionService } from '../services/permission.service';

@Injectable({ providedIn: 'root' })
export class PermissionGuard implements CanActivate {

    constructor(
        private router: Router,
        private permissionService: PermissionService
    ) { }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
        const hasViewPermission = this.permissionService.checkPermission(state.url, 'CanView');

        if (hasViewPermission) {
            return true;
        }

        // Redirect to unauthorized page or dashboard if user tries to access restricted page directly
        // Or just return false to block navigation
        console.log(`Access Denied to ${state.url}`);
        // this.router.navigate(['/unauthorized']); 
        // For now, let's keep it simple:
        return false;
    }
}
