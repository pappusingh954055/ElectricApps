export interface Role {
    id: number;
    name: string;
    description: string;
}

export interface RolePermission {
    roleId: number;
    menuId: number;
    canView: boolean;
    canAdd: boolean;
    canEdit: boolean;
    canDelete: boolean;
}
