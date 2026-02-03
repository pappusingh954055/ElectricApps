import { ChangeDetectorRef, Component, inject, OnInit, ViewChild } from '@angular/core';
import { MaterialModule } from '../../../shared/material/material/material-module';
import { CommonModule } from '@angular/common';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { InventoryService } from '../service/inventory.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog-component/confirm-dialog-component';
import { Router } from '@angular/router';
import { SaleOrderDetailDialog } from '../sale-order-detail-dialog/sale-order-detail-dialog';
import { StatusDialogComponent } from '../../../shared/components/status-dialog-component/status-dialog-component';
import { SaleOrderService } from '../service/saleorder.service';
import { SelectionModel } from '@angular/cdk/collections';

@Component({
  selector: 'app-so-list',
  standalone: true,
  imports: [MaterialModule, CommonModule],
  templateUrl: './so-list.html',
  styleUrl: './so-list.scss',
})
export class SoList implements OnInit {
  displayedColumns: string[] = ['select', 'soNumber', 'soDate', 'customerName', 'grandTotal', 'status', 'actions'];
  dataSource = new MatTableDataSource<any>([]);
  isAdmin: boolean = false;
  isLoading: boolean = false;

  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  selection = new SelectionModel<any>(true, []);
  totalRecords: number = 0;
  searchKey: string = "";
  constructor(
    private inventoryService: InventoryService,
    private saleOrderService: SaleOrderService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit() {
    this.checkUserRole();
    this.loadOrders();
  }

  // --- Selection Helper Logic (New) ---
  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  masterToggle() {
    this.isAllSelected() ?
      this.selection.clear() :
      this.dataSource.data.forEach(row => this.selection.select(row));
  }

  getSelectedIds(): string[] {
    return this.selection.selected.map(row => row.id);
  }

  // --- Existing Methods (Exactly as you provided) ---

  checkUserRole() {
    const role = localStorage.getItem('userRole');
    this.isAdmin = role === 'Admin' || role === 'Manager';
  }
  loadOrders() {
    this.isLoading = true;

    const pageIndex = this.paginator ? this.paginator.pageIndex + 1 : 1;
    const pageSize = this.paginator ? this.paginator.pageSize : 10;
    const sortField = this.sort ? this.sort.active : 'soDate';
    const sortDir = this.sort ? this.sort.direction : 'desc';

    this.saleOrderService.getSaleOrders(pageIndex, pageSize, sortField, sortDir, this.searchKey).subscribe({
      next: (res) => {
        // FIX: Backend se aane wala 'totalCount' yahan update karein
        this.dataSource.data = res.data;
        this.totalRecords = res.totalCount;

        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // Search bar ke liye function
  applySearch(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.searchKey = filterValue.trim().toLowerCase();
    this.paginator.pageIndex = 0; // Search par hamesha page 1 par jayein
    this.loadOrders();
  }

  clearSearch() {
    this.searchKey = "";
    this.paginator.pageIndex = 0;
    this.loadOrders();
  }

  confirmOrder(order: any) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: "Confirm Stock Reduction",
        message: `Order #${order.soNumber} Upon confirmation, the stock will be deducted from the inventory. Are you sure?`,
        confirmText: "Confirm",
        confirmColor: "primary"
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.isLoading = true;
        this.cdr.detectChanges();
        this.saleOrderService.updateSaleOrderStatus(order.id, 'Confirmed').subscribe({
          next: (res) => {
            this.isLoading = false;
            this.dialog.open(StatusDialogComponent, {
              width: '350px',
              data: {
                type: 'success',
                title: 'Order Confirmed',
                message: `Order #${order.soNumber} The order has been successfully confirmed and the stock has been updated.`
              }
            });
            this.loadOrders();
            this.cdr.detectChanges();
          },
          error: (err) => {
            this.isLoading = false;
            this.dialog.open(StatusDialogComponent, {
              width: '350px',
              data: {
                type: 'error',
                title: 'Action Failed',
                message: err.error?.message || "Stock update karne mein error aaya."
              }
            });
            this.cdr.detectChanges();
          }
        });
      }
    });
  }

  viewOrder(row: any) {
    this.isLoading = true;
    this.cdr.detectChanges();
    this.saleOrderService.getSaleOrderById(row.id).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.dialog.open(SaleOrderDetailDialog, { width: '800px', data: res });
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoading = false;
        this.dialog.open(StatusDialogComponent, {
          width: '350px',
          data: { type: 'error', title: 'Load Failed', message: "Connection error." }
        });
        this.cdr.detectChanges();
      }
    });
  }

  createNewOrder() {
    this.router.navigate(['/app/inventory/solist/add']);
  }

  DownloadMultipleOrders(productIds: string[]) {
    if (!productIds || productIds.length === 0) {
      this.dialog.open(StatusDialogComponent, {
        width: '350px',
        data: { type: 'error', title: 'Selection Required', message: 'Kripya products select karein.' }
      });
      return;
    }

    this.isLoading = true;
    this.cdr.detectChanges();
    this.saleOrderService.SaleOrderReportDownload(productIds).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `SaleOrder_Report_${new Date().getTime()}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        this.isLoading = false;
        this.dialog.open(StatusDialogComponent, {
          width: '350px',
          data: { type: 'success', title: 'Report Downloaded', message: 'The Sale Order report has been successfully downloaded.' }
        });
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoading = false;
        this.dialog.open(StatusDialogComponent, {
          width: '350px',
          data: { type: 'error', title: 'Export Failed', message: "Server responded with 400 Bad Request." }
        });
        this.cdr.detectChanges();
      }
    });
  }

  exportOrders() {
    this.isLoading = true;
    this.cdr.detectChanges();
    this.saleOrderService.exportSaleOrderList().subscribe({
      next: (blob) => {
        this.isLoading = false;
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Orders_Report_${new Date().getTime()}.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.dialog.open(StatusDialogComponent, {
          width: '350px',
          data: { type: 'success', title: 'Success', message: 'Excel download complete!' }
        });
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }
}