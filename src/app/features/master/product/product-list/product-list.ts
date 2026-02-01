import { ChangeDetectorRef, Component, OnChanges, OnInit, ViewChild } from '@angular/core';

import { CommonModule, DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../shared/material/material/material-module';
import { Product } from '../model/product.model';
import { ProductService } from '../service/product.service';
import { ServerDatagridComponent } from '../../../../shared/components/server-datagrid-component/server-datagrid-component';
import { MatDialog } from '@angular/material/dialog';
import { GridRequest } from '../../../../shared/models/grid-request.model';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog-component/confirm-dialog-component';
import { ApiResultDialog } from '../../../shared/api-result-dialog/api-result-dialog';
import { StatusDialogComponent } from '../../../../shared/components/status-dialog-component/status-dialog-component';


@Component({
  selector: 'app-product-list',
  imports: [CommonModule, RouterLink, ReactiveFormsModule, MaterialModule,
    ServerDatagridComponent],
  providers: [DatePipe],
  templateUrl: './product-list.html',
  styleUrl: './product-list.scss',
})
export class ProductList implements OnInit {

  loading = false;

  totalCount = 0;

  selectedRows: any[] = [];

  lastRequest!: GridRequest;

  @ViewChild(ServerDatagridComponent)
  grid!: ServerDatagridComponent<any>;

  data: Product[] = [];

  constructor(
    private service: ProductService,
    private router: Router, private dialog: MatDialog,
    private datePipe: DatePipe,
    private cdr: ChangeDetectorRef) { }

  columns = [
    { field: 'categoryName', header: 'Category', sortable: true, width: 150, visible: true },
    { field: 'subcategoryName', header: 'Subcategory', sortable: true, width: 140, visible: true },
    { field: 'productName', header: 'Product', sortable: true, width: 150, visible: true },
    { field: 'sku', header: 'SKU', sortable: true, width: 75, visible: true },
    { field: 'unit', header: 'Unit', sortable: true, width: 75, visible: true },

    { field: 'defaultGst', header: 'GST %', sortable: true, width: 75, visible: true },
    { field: 'hsnCode', header: 'HSN Code', sortable: true, width: 80, visible: true },
    { field: 'minStock', header: 'Min Stock', sortable: true, width: 80, visible: true },

    { field: 'trackInventory', sortable: true, width: 75, visible: true, header: 'Track Inv', cell: (row: any) => row.trackInventory ? 'Yes' : 'No' },
    {
      field: 'createdAt',
      header: 'Created On',
      sortable: true, width: 120, visible: true,
      cell: (row: any) =>
        row.createdAt ?
          this.datePipe.transform(row.createdAt, 'dd-MMM-yyyy') : '-'
    }
  ];

  ngOnInit(): void {
    // Initial load
    this.loadPriceLists({
      pageNumber: 1,
      pageSize: 10,
      sortDirection: 'desc'
    });
  }

  loadPriceLists(request: GridRequest): void {
    this.loading = true;
    this.lastRequest = request; // ✅ store last state    
    this.cdr.detectChanges();

    this.service.getPaged(request).subscribe({
      next: res => {
        this.data = res.items;
        console.log(this.data)
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
    this.router.navigate(['/app/master/products/edit', row.id]);
  }

  deleteProduct(category: any): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: 'Confirm Delete',
          message: 'Are you sure you want to delete this product list?'
        }
      })
      .afterClosed()
      .subscribe(confirm => {
        if (!confirm) return;

        this.loading = true;

        this.service.delete(category.id).subscribe({
          next: res => {
            this.loading = false;

            this.dialog.open(StatusDialogComponent, {
              data: {
                isSuccess: true,
                message: res.message
              }
            });

            this.loadPriceLists(this.lastRequest);
          },
          error: err => {
            this.loading = false;

            const message =
              err?.error?.message || 'Unable to delete Price list';

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
    this.loadPriceLists(this.lastRequest);
  }

  confirmBulkDelete(): void {
    if (!this.selectedRows.length) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        title: 'Delete product List',
        message: `Are you sure you want to delete ${this.selectedRows.length} selected product list?`
      }
    });

    dialogRef.afterClosed().subscribe(confirm => {
      if (!confirm) return;

      const ids = this.selectedRows.map(x => x.id);

      this.loading = true;

      this.service.deleteMany(ids).subscribe({
        next: (res) => {
          // 🔄 Reload grid
          this.loadPriceLists(this.lastRequest);

          // 🧹 Clear selection via grid reference
          this.grid.clearSelection();

          this.loading = false;
          this.dialog.open(StatusDialogComponent, {
            data: {
              isSuccess: true,
              message: res.message
            }
          });

          this.cdr.detectChanges();
        },
        error: err => {
          console.error(err);
          this.loading = false;
          const message =
            err?.error?.message || 'Unable to delete product list';

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

  onSelectionChange(rows: any[]) {
    this.selectedRows = rows;
  }
}