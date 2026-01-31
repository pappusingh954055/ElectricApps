import { ChangeDetectorRef, Component, OnChanges, OnInit, SimpleChanges, ViewChild, inject } from '@angular/core';


import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../../../shared/material/material/material-module';
import { ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { SubCategoryService } from '../services/subcategory.service';
import { SubCategory } from '../modesls/subcategory.model';

import { CategoryService } from '../../category/services/category.service';
import { ServerDatagridComponent } from '../../../../shared/components/server-datagrid-component/server-datagrid-component';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog-component/confirm-dialog-component';
import { GridColumn } from '../../../../shared/models/grid-column.model';
import { GridRequest } from '../../../../shared/models/grid-request.model';
import { ApiResultDialog } from '../../../shared/api-result-dialog/api-result-dialog';




@Component({
  selector: 'app-subcategory-list',
  imports: [CommonModule, MaterialModule, ReactiveFormsModule, RouterLink, ServerDatagridComponent],
  templateUrl: './subcategory-list.html',
  styleUrl: './subcategory-list.scss',
})
export class SubcategoryList implements OnInit, OnChanges {

  constructor(
    private cdr: ChangeDetectorRef,
    private router: Router, private dialog: MatDialog
  ) { }

  readonly categoryService = inject(CategoryService)
  readonly subCategoryService = inject(SubCategoryService)

  loading = false;

  data: SubCategory[] = [];
  totalCount = 0;

  selectedRows: any[] = [];
  lastRequest!: GridRequest;

  @ViewChild(ServerDatagridComponent)
  grid!: ServerDatagridComponent<any>;


  columns: GridColumn[] = [
    { field: 'categoryName', header: 'Category', sortable: true, width: 300, visible: true },
    { field: 'subcategoryName', header: 'Subcategory', sortable: true, width: 300, visible: true },
    { field: 'subcategoryCode', header: 'Code', sortable: true, width: 150, visible: true },
    { field: 'defaultGst', header: 'GST %', sortable: true, width: 150, visible: true },
    {
      field: 'isActive',
      header: 'Status',
      sortable: true, width: 100, visible: true,
      cell: (row: any) => row.isActive ? 'Yes' : 'No'
    }
  ];


  ngOnInit(): void {
    // Initial load
    this.loadSubCategories({
      pageNumber: 1,
      pageSize: 10,
      sortDirection: 'desc'
    });
  }

  loadSubCategories(request: GridRequest): void {
    this.lastRequest = request; // ✅ store last state
    this.loading = true;

    this.subCategoryService.getPaged(request).subscribe({
      next: res => {
        this.data = res.items;
        console.log(this.data);
        this.totalCount = res.totalCount;
        this.loading = false;
      },
      error: err => {
        console.error(err);
        this.loading = false;
      }
    });
  }


  onEdit(row: any): void {
    this.router.navigate(['/app/master/subcategories/edit', row.id]);
  }

  deleteCategory(category: any): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: 'Confirm Delete',
          message: 'Are you sure you want to delete this sub category?'
        }
      })
      .afterClosed()
      .subscribe(confirm => {
        if (!confirm) return;

        this.loading = true;

        this.subCategoryService.delete(category.id).subscribe({
          next: res => {
            this.loading = false;

            this.dialog.open(ApiResultDialog, {
              data: {
                success: true,
                message: res.message
              }
            });

            this.loadSubCategories(this.lastRequest);
          },
          error: err => {
            this.loading = false;

            const message =
              err?.error?.message || 'Unable to delete sub category';

            this.dialog.open(ApiResultDialog, {
              data: {
                success: false,
                message
              }
            });
          }
        });
      });
  }



  reloadGrid(): void {
    this.loadSubCategories(this.lastRequest);
  }

  confirmBulkDelete(): void {
    if (!this.selectedRows.length) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        title: 'Delete Price List',
        message: `Are you sure you want to delete ${this.selectedRows.length} selected sub category?`
      }
    });

    dialogRef.afterClosed().subscribe(confirm => {
      if (!confirm) return;

      const ids = this.selectedRows.map(x => x.id);

      this.loading = true;

      this.subCategoryService.deleteMany(ids).subscribe({
        next: (res) => {
          // 🔄 Reload grid
          this.loadSubCategories(this.lastRequest);

          // 🧹 Clear selection via grid reference
          this.grid.clearSelection();

          this.loading = false;
          this.dialog.open(ApiResultDialog, {
            data: {
              success: true,
              message: res.message
            }
          });

          this.loading = false;
        },
        error: err => {
          console.error(err);
          this.loading = false;
          const message =
            err?.error?.message || 'Unable to delete price list';

          this.dialog.open(ApiResultDialog, {
            data: {
              success: false,
              message
            }
          });
        }
      });
    });
  }

  onSelectionChange(rows: any[]) {
    this.selectedRows = rows;
  }
  ngOnChanges(changes: SimpleChanges): void {

  }
}