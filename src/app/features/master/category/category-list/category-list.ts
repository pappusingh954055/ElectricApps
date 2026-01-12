import { ChangeDetectorRef, Component, OnInit, ViewChild, inject } from '@angular/core';

import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../shared/material/material/material-module';
import { Router, RouterLink } from '@angular/router';

import { CategoryService } from '../services/category.service';

import { GridColumn } from '../../../../shared/models/grid-column.model';
import { GridRequest } from '../../../../shared/models/grid-request.model';

import { ServerDatagridComponent } from '../../../../shared/components/server-datagrid-component/server-datagrid-component';
import { CategoryGridDto } from '../models/category-grid-response.model';
import { ApiResultDialog } from '../../../shared/api-result-dialog/api-result-dialog';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog-component/confirm-dialog-component';

@Component({
  selector: 'app-category-list',
  imports: [CommonModule, ReactiveFormsModule, MaterialModule, RouterLink, ServerDatagridComponent
  ],
  templateUrl: './category-list.html',
  styleUrl: './category-list.scss',
})
export class CategoryList implements OnInit {

  constructor(private cdr: ChangeDetectorRef, private router: Router, private dialog: MatDialog) { }

  readonly categoryService = inject(CategoryService)

  loading = false;

  data: CategoryGridDto[] = [];
  totalCount = 0;

  selectedRows: any[] = [];
  lastRequest!: GridRequest;

  @ViewChild(ServerDatagridComponent)
  grid!: ServerDatagridComponent<any>;


  columns: GridColumn[] = [
    { field: 'categoryName', header: 'Category', sortable: true },
    { field: 'categoryCode', header: 'Code', sortable: true },
    { field: 'defaultGst', header: 'GST %', sortable: true },
    {
      field: 'isActive',
      header: 'Status',
      cell: (row: any) => row.isActive ? 'Yes' : 'No'
    }
  ];


  ngOnInit(): void {
    // Initial load
    this.loadCategories({
      pageNumber: 1,
      pageSize: 10,
      sortDirection: 'desc'
    });
  }

  loadCategories(request: GridRequest): void {
    this.lastRequest = request; // ✅ store last state
    this.loading = true;
    this.cdr.detectChanges();

    this.categoryService.getPagedCategories(request).subscribe({
      next: res => {
        this.data = res.items;
        this.totalCount = res.totalCount;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: err => {
        console.error(err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }


  onEdit(row: any): void {
    this.router.navigate(['/app/master/categories/edit', row.id]);
  }

  onDelete(category: any): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Category',
        message: `Are you sure you want to delete "${category.categoryName}"?`
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.categoryService.delete(category.id).subscribe(() => {
          this.loadCategories(this.lastRequest);
        });
      }
    });
  }



  reloadGrid(): void {
    this.loadCategories(this.lastRequest);
  }

  deleteSelected(): void {
    if (!this.selectedRows.length) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        title: 'Delete Categories',
        message: `Are you sure you want to delete ${this.selectedRows.length} selected categories?`
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (!result) return;

      const ids = this.selectedRows.map(r => r.id);

      this.loading = true;

      this.categoryService.deleteMany(ids).subscribe({
        next: () => {
          this.loadCategories(this.lastRequest);

          // ✅ CLEAR SELECTION PROPERLY
          this.grid.clearSelection();
        },
        error: () => {
          this.loading = false;
        }
      });
    });
  }

}