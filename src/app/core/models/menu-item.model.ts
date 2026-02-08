export interface MenuItem {
  id?: number;
  title: string;
  url: string;
  icon?: string;
  parentId?: number | null;
  children?: MenuItem[];
  permissions?: MenuPermissions;
}

export interface MenuPermissions {
  canView: boolean;
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
}
