import { ChangeDetectorRef, Component, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Router } from '@angular/router';


import { MatDialog } from '@angular/material/dialog';

import { MaterialModule } from '../../../../shared/material/material/material-module';
import { ServerDatagridComponent } from '../../../../shared/components/server-datagrid-component/server-datagrid-component';
import { SupplierModalComponent } from '../../../../features/inventory/supplier-modal/supplier-modal';
import { GridColumn } from '../../../../shared/models/grid-column.model';
import { GridRequest } from '../../../../shared/models/grid-request.model';
import { SupplierService } from '../../../../features/inventory/service/supplier.service';
import { LoadingService } from '../../../../core/services/loading.service';

@Component({
  selector: 'app-supplier-list',
  standalone: true,
  imports: [CommonModule, MaterialModule, ServerDatagridComponent],
  templateUrl: './supplier-list.html',
  styleUrl: './supplier-list.scss',
})
export class SupplierList implements OnInit {
  private router = inject(Router);
  private supplierService = inject(SupplierService);
  private cdr = inject(ChangeDetectorRef);
  private dialog = inject(MatDialog);

  loading = false;
  isDashboardLoading = true;
  private isFirstLoad = true;
  private loadingService = inject(LoadingService);
  data: any[] = [];
  totalCount = 0;
  lastRequest!: GridRequest;

  columns: GridColumn[] = [
    { field: 'name', header: 'Supplier Name', sortable: true, width: 250, visible: true },
    { field: 'phone', header: 'Phone', sortable: true, width: 150, visible: true },
    { field: 'gstIn', header: 'GSTIN', sortable: true, width: 180, visible: true },
    {
      field: 'isActive',
      header: 'Status',
      width: 120,
      visible: true,
      cell: (row: any) => row.isActive ? 'Active' : 'Inactive'
    }
  ];

  ngOnInit(): void {
    // Global loader ON
    this.isDashboardLoading = true;
    this.isFirstLoad = true;
    this.loadingService.setLoading(true);
    this.cdr.detectChanges();

    this.loadSuppliers({
      pageNumber: 1,
      pageSize: 10,
      sortDirection: 'desc'
    });

    // Safety timeout - force stop loader after 10 seconds
    setTimeout(() => {
      if (this.isDashboardLoading) {
        console.warn('[SupplierList] Force stopping loader after 10s timeout');
        this.isDashboardLoading = false;
        this.isFirstLoad = false;
        this.loadingService.setLoading(false);
        this.cdr.detectChanges();
      }
    }, 10000);
  }

  loadSuppliers(request: GridRequest): void {
    this.lastRequest = request;
    this.loading = true;
    this.supplierService.getPaged(request).subscribe({
      next: (res) => {
        this.data = res.items;
        this.totalCount = res.totalCount;
        this.loading = false;

        // Turn off global loader on first load
        if (this.isFirstLoad) {
          this.isFirstLoad = false;
          this.isDashboardLoading = false;
          this.loadingService.setLoading(false);
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.loading = false;

        // Turn off global loader on first load
        if (this.isFirstLoad) {
          this.isFirstLoad = false;
          this.isDashboardLoading = false;
          this.loadingService.setLoading(false);
        }
        this.cdr.detectChanges();
      }
    });
  }

  addSupplier() {
    const dialogRef = this.dialog.open(SupplierModalComponent, {
      width: '600px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadSuppliers(this.lastRequest);
      }
    });
  }

  onEdit(row: any) {
    const dialogRef = this.dialog.open(SupplierModalComponent, {
      width: '600px',
      data: { supplier: row },
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadSuppliers(this.lastRequest);
      }
    });
  }
}
