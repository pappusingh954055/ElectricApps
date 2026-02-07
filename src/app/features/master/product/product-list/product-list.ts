import { ChangeDetectorRef, Component, OnInit, ViewChild, inject } from '@angular/core'; // inject add kiya
import { ActivatedRoute } from '@angular/router'; // Filter read karne ke liye
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
import { StatusDialogComponent } from '../../../../shared/components/status-dialog-component/status-dialog-component';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, MaterialModule, ServerDatagridComponent],
  providers: [DatePipe],
  templateUrl: './product-list.html',
  styleUrl: './product-list.scss',
})
export class ProductList implements OnInit {
  // ActivatedRoute inject kiya filter read karne ke liye
  private route = inject(ActivatedRoute);

  loading = false;
  totalCount = 0;
  selectedRows: any[] = [];
  lastRequest!: GridRequest;
  isLowStockFilterActive = false; // State for dashboard alert

  @ViewChild(ServerDatagridComponent)
  grid!: ServerDatagridComponent<any>;

  data: Product[] = [];

  constructor(
    private service: ProductService,
    private router: Router,
    private dialog: MatDialog,
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
    { field: 'currentStock', header: 'Current Stock', sortable: true, width: 80, visible: true },
    { field: 'trackInventory', sortable: true, width: 75, visible: true, header: 'Track Inv', cell: (row: any) => row.trackInventory ? 'Yes' : 'No' },
    {
      field: 'createdAt',
      header: 'Created On',
      sortable: true, width: 120, visible: true,
      cell: (row: any) =>
        row.createdAt ? this.datePipe.transform(row.createdAt, 'dd-MMM-yyyy') : '-'
    }
  ];

  ngOnInit(): void {
    // Redirection filter check karein
    this.route.queryParams.subscribe(params => {
      this.isLowStockFilterActive = params['filter'] === 'lowstock';

      // Initial load with default request
      this.loadPriceLists({
        pageNumber: 1,
        pageSize: 10,
        sortDirection: 'desc'
      });
    });
  }

  loadPriceLists(request: GridRequest): void {
    this.loading = true;
    this.lastRequest = request;
    this.cdr.detectChanges();

    // Conditional API Call: Agar dashboard se aaye hain toh low-stock API hit karein
    const apiCall: any = this.isLowStockFilterActive
      ? this.service.getLowStockProducts()
      : this.service.getPaged(request);

    apiCall.subscribe({
      next: (res: any) => {
        // Mapping check: Paged API 'items' return karti hai, LowStock seedha list
        this.data = this.isLowStockFilterActive ? (res as any) : res.items;
        this.totalCount = this.isLowStockFilterActive ? this.data.length : res.totalCount;

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error(err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // Filter clear karke normal view par jaane ke liye
  clearFilter(): void {
    this.router.navigate(['/app/master/products']);
  }

  onEdit(row: any): void {
    this.router.navigate(['/app/master/products/edit', row.id]);
  }

  deleteProduct(category: any): void {
    this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Confirm Delete', message: 'Are you sure you want to delete this product list?' }
    })
      .afterClosed().subscribe(confirm => {
        if (!confirm) return;
        this.loading = true;
        this.service.delete(category.id).subscribe({
          next: (res: any) => {
            this.loading = false;
            this.dialog.open(StatusDialogComponent, { data: { isSuccess: true, message: res.message } });
            this.loadPriceLists(this.lastRequest);
          },
          error: (err: any) => {
            this.loading = false;
            this.dialog.open(StatusDialogComponent, { data: { isSuccess: false, message: err?.error?.message || 'Unable to delete' } });
          }
        });
      });
  }

  reloadGrid(): void {
    this.loadPriceLists(this.lastRequest);
  }

  confirmBulkDelete(): void {
    if (!this.selectedRows.length) return;
    this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: { title: 'Delete product List', message: `Are you sure you want to delete ${this.selectedRows.length} selected items?` }
    }).afterClosed().subscribe(confirm => {
      if (!confirm) return;
      const ids = this.selectedRows.map(x => x.id);
      this.loading = true;
      this.service.deleteMany(ids).subscribe({
        next: (res: any) => {
          this.loadPriceLists(this.lastRequest);
          this.grid.clearSelection();
          this.loading = false;
          this.dialog.open(StatusDialogComponent, { data: { isSuccess: true, message: res.message } });
          this.cdr.detectChanges();
        },
        error: (err: any) => {
          this.loading = false;
          this.dialog.open(StatusDialogComponent, { data: { isSuccess: false, message: err?.error?.message || 'Error' } });
        }
      });
    });
  }

  onSelectionChange(rows: any[]) {
    this.selectedRows = rows;
  }
}