import { ChangeDetectorRef, Component, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../shared/material/material/material-module';
import { RoleService } from '../../../core/services/role.service';
import { MenuService } from '../../../core/services/menu.service';
import { Role, RolePermission } from '../../../core/models/role.model';
import { MenuItem } from '../../../core/models/menu-item.model';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';

@Component({
  selector: 'app-role-permissions',
  standalone: true,
  imports: [CommonModule, MaterialModule, FormsModule],
  templateUrl: './role-permissions.component.html',
  styleUrls: ['./role-permissions.component.scss']
})
export class RolePermissionsComponent implements OnInit {
  roles: Role[] = [];
  selectedRoleId: number | null = null;
  permissions: RolePermission[] = [];

  displayedColumns = ['menu', 'canView', 'canAdd', 'canEdit', 'canDelete'];
  dataSource: MatTableDataSource<MenuItem>;

  @ViewChild(MatPaginator) set matPaginator(mp: MatPaginator) {
    this.paginator = mp;
    this.dataSource.paginator = this.paginator;
  }

  @ViewChild(MatSort) set matSort(ms: MatSort) {
    this.sort = ms;
    this.dataSource.sort = this.sort;
  }

  paginator!: MatPaginator;
  sort!: MatSort;

  private roleService = inject(RoleService);
  private menuService = inject(MenuService);
  private snackBar = inject(MatSnackBar);
  private cdr = inject(ChangeDetectorRef);

  constructor() {
    this.dataSource = new MatTableDataSource<MenuItem>([]);
  }

  ngOnInit() {
    this.loadRoles();
    this.loadMenus();
  }

  loadRoles() {
    this.roleService.getAllRoles().subscribe(roles => {
      this.roles = roles;
      this.cdr.detectChanges();
    });
  }

  loadMenus() {
    this.menuService.getAllMenus().subscribe(menus => {
      const flatMenus = this.flattenMenus(menus);
      this.dataSource.data = flatMenus;

      // Re-assign paginator after data load to ensure it calculates pages correctly
      if (this.paginator) {
        this.dataSource.paginator = this.paginator;
      }
      this.cdr.detectChanges();
    });
  }

  flattenMenus(menus: MenuItem[]): MenuItem[] {
    let result: MenuItem[] = [];
    for (const menu of menus) {
      result.push(menu);
      if (menu.children) {
        result = result.concat(this.flattenMenus(menu.children));
      }
    }
    return result;
  }

  onRoleChange() {
    if (this.selectedRoleId) {
      this.roleService.getRolePermissions(this.selectedRoleId).subscribe(perms => {
        this.permissions = perms;
        // Trigger CD implicitly via binding updates

      });
    }
  }

  getPermission(menuId: number | undefined): RolePermission {
    if (!menuId) return { roleId: 0, menuId: 0, canView: false, canAdd: false, canEdit: false, canDelete: false };

    let perm = this.permissions.find(p => p.menuId === menuId);
    if (!perm) {

      // Default permission object (not added to array yet to avoid clutter until saved, 
      // but binding requires it to be in array or stable object.
      // Better: Create it and push to local permissions array so Reference works.
      perm = { roleId: this.selectedRoleId!, menuId: menuId, canView: false, canAdd: false, canEdit: false, canDelete: false };
      this.permissions.push(perm);
    }
    return perm;
  }

  savePermissions() {
    if (this.selectedRoleId) {
      // Filter out permissions that are all false to save DB space? 
      // Or send all. Sending all is safer for "edit" logic (to turn off).
      this.roleService.updateRolePermissions(this.selectedRoleId, this.permissions).subscribe(() => {
        this.snackBar.open('Permissions saved successfully', 'Close', { duration: 3000 });

      });
    }
  }

  resetPermissions() {
    if (this.selectedRoleId) {
      this.onRoleChange(); // Reload from DB
      this.snackBar.open('Permissions reset to last saved state.', 'Close', { duration: 2000 });

    }
  }

  // --- Data Table Features ---

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  // --- Bulk Actions ---

  isAllSelected(column: 'canView' | 'canAdd' | 'canEdit' | 'canDelete'): boolean {
    const visibleData = this.dataSource.filteredData; // Only affect filtered rows
    if (visibleData.length === 0) return false;

    return visibleData.every(row => this.getPermission(row.id)[column]);

  }

  isSomeSelected(column: 'canView' | 'canAdd' | 'canEdit' | 'canDelete'): boolean {
    const visibleData = this.dataSource.filteredData;
    if (visibleData.length === 0) return false;

    return visibleData.some(row => this.getPermission(row.id)[column]);
  }

  toggleAll(column: 'canView' | 'canAdd' | 'canEdit' | 'canDelete', checked: boolean) {
    const visibleData = this.dataSource.filteredData;
    visibleData.forEach(row => {
      const perm = this.getPermission(row.id);

      perm[column] = checked;
    });
  }
}
