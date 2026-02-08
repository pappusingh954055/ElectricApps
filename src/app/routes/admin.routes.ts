import { Routes } from '@angular/router';
import { PermissionGuard } from '../core/gaurds/permission.guard';

export const ADMIN_ROUTES: Routes = [
    {
        path: 'role-permissions',
        // canActivate: [PermissionGuard],
        loadComponent: () => import('../features/admin/role-permissions/role-permissions.component').then(m => m.RolePermissionsComponent),
        data: { breadcrumb: 'Role Permissions' }
    },
    {
        path: 'users',
        // canActivate: [PermissionGuard],
        loadComponent: () => import('../features/admin/user-list/user-list.component').then(m => m.UserListComponent),
        data: { breadcrumb: 'Users' }
    }
];
