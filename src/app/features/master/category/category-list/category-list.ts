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
import { StatusDialogComponent } from '../../../../shared/components/status-dialog-component/status-dialog-component';

@Component({
  selector: 'app-category-list',
  imports: [CommonModule,
    ReactiveFormsModule, MaterialModule, ServerDatagridComponent, RouterLink,
  ],
  templateUrl: './category-list.html',
  styleUrl: './category-list.scss',
})
export class CategoryList implements OnInit {

  constructor(private cdr: ChangeDetectorRef,
    private router: Router, private dialog: MatDialog) { }

  readonly categoryService = inject(CategoryService)

  loading = false;
  filteredColumns: GridColumn[] = [];
  data: CategoryGridDto[] = [];
  totalCount = 0;

  selectedRows: any[] = [];
  lastRequest!: GridRequest;

  @ViewChild(ServerDatagridComponent)
  grid!: ServerDatagridComponent<any>;


  columns: GridColumn[] = [
    { field: 'categoryName', header: 'Category', sortable: true, width: 300, visible: true },
    { field: 'categoryCode', header: 'Code', sortable: true, width: 250, visible: true },
    { field: 'defaultGst', header: 'GST %', sortable: true, width: 150, visible: true },
    { field: 'description', header: 'Description', sortable: true, width: 200, visible: true },
    {
      field: 'isActive',
      header: 'Status',
      width: 150,
      visible: true,
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

    this.categoryService.getPaged(request).subscribe({
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

  deleteCategory(category: any): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: 'Confirm Delete',
          message: 'Are you sure you want to delete this category?'
        }
      })
      .afterClosed()
      .subscribe(confirm => {
        if (!confirm) return;

        this.loading = true;
        this.cdr.detectChanges();
        this.categoryService.delete(category.id).subscribe({
          next: res => {
            this.loading = false;

            this.dialog.open(StatusDialogComponent, {
              data: {
                isSuccess: true,
                message: res.message
              }
            });

            this.loadCategories(this.lastRequest);
          },
          error: err => {
            this.loading = false;

            const message =
              err?.error?.message || 'Unable to delete category';
             this.cdr.detectChanges();

            this.dialog.open(StatusDialogComponent, {
              data: {
                isSuccess: false,
                message
              }
            });
          }
        });
      });
  }

  reloadGrid(): void {
    this.loadCategories(this.lastRequest);
  }

  confirmBulkDelete(): void {
    if (!this.selectedRows.length) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        title: 'Delete Categories',
        message: `Are you sure you want to delete ${this.selectedRows.length} selected categories?`
      }
    });

    dialogRef.afterClosed().subscribe(confirm => {
      if (!confirm) return;

      const ids = this.selectedRows.map(x => x.id);

      this.loading = true;
      

      this.categoryService.deleteMany(ids).subscribe({
        next: (res) => {
          // 🔄 Reload grid
          this.loadCategories(this.lastRequest);

          // 🧹 Clear selection via grid reference
          this.grid.clearSelection();

          this.loading = false;
          this.dialog.open(StatusDialogComponent, {
            data: {
              isSuccess: true,
              message: res.message
            }
          });

          this.loading = false;
           this.cdr.detectChanges();
        },
        error: err => {
          console.error(err);
          this.loading = false;
          const message =
            err?.error?.message || 'Unable to delete category';

          this.dialog.open(StatusDialogComponent, {
            data: {
              isSuccess: false,
              message
            }
          });
          this.cdr.detectChanges();
        }
      });
    });
  }

  onSelectionChange(rows: any[]): void {
    this.selectedRows = rows;
  }
}