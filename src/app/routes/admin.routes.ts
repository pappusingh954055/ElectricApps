import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
    {
        path: 'role-permissions',
        loadComponent: () => import('../features/admin/role-permissions/role-permissions.component').then(m => m.RolePermissionsComponent),
        data: { breadcrumb: 'Role Permissions' }
    },
    {
        path: 'users',
        loadComponent: () => import('../features/admin/user-list/user-list.component').then(m => m.UserListComponent),
        data: { breadcrumb: 'Users' }
    }
];
