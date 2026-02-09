import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MaterialModule } from '../../../shared/material/material/material-module';
import { MenuService } from '../../../core/services/menu.service';
import { MenuItem } from '../../../core/models/menu-item.model';

import { StatusDialogComponent } from '../../../shared/components/status-dialog-component/status-dialog-component';
import { MenuFormDialogComponent } from './menu-form-dialog/menu-form-dialog.component';
// Trigger re-build

@Component({
    selector: 'app-menu-management',
    standalone: true,
    imports: [CommonModule, MaterialModule, MatTableModule, MatPaginatorModule, MatSortModule, MatDialogModule],
    templateUrl: './menu-management.component.html',
    styleUrl: './menu-management.component.scss'
})
export class MenuManagementComponent implements OnInit, AfterViewInit {
    displayedColumns: string[] = ['id', 'title', 'url', 'parentId', 'order', 'actions'];
    dataSource = new MatTableDataSource<MenuItem>([]);
    allMenus: MenuItem[] = [];

    @ViewChild(MatPaginator) paginator!: MatPaginator;
    @ViewChild(MatSort) sort!: MatSort;

    constructor(
        private menuService: MenuService,
        private dialog: MatDialog
    ) { }

    ngOnInit(): void {
        this.loadMenus();
    }

    ngAfterViewInit() {
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
    }

    loadMenus(): void {
        this.menuService.getAllMenus().subscribe(menus => {
            this.allMenus = menus;
            this.dataSource.data = menus;
        });
    }

    applyFilter(event: Event) {
        const filterValue = (event.target as HTMLInputElement).value;
        this.dataSource.filter = filterValue.trim().toLowerCase();

        if (this.dataSource.paginator) {
            this.dataSource.paginator.firstPage();
        }
    }

    getParentTitle(parentId: number): string {
        const parent = this.allMenus.find(m => m.id === parentId);
        return parent ? parent.title : 'Unknown';
    }

    openMenuDialog(menu?: MenuItem): void {
        const dialogRef = this.dialog.open(MenuFormDialogComponent, {
            width: '500px',
            data: {
                menu: menu || null,
                allMenus: this.allMenus.filter(m => !m.parentId) // Only top-level menus as potential parents
            }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.loadMenus();
            }
        });
    }

    deleteMenu(menu: MenuItem): void {
        if (!menu.id) return;

        // Show confirmation ideally, but for now simple delete
        if (confirm(`Are you sure you want to delete menu "${menu.title}"?`)) {
            this.menuService.deleteMenu(menu.id).subscribe({
                next: () => {
                    this.loadMenus();
                    this.showStatus(true, 'Menu deleted successfully');
                },
                error: (err) => {
                    console.error(err);
                    this.showStatus(false, 'Failed to delete menu');
                }
            });
        }
    }

    private showStatus(isSuccess: boolean, message: string): void {
        this.dialog.open(StatusDialogComponent, {
            data: { isSuccess, message }
        });
    }
}
