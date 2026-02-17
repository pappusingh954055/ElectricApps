import { ChangeDetectorRef, Component, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../../shared/material/material/material-module';
import { Router } from '@angular/router';
import { customerService } from '../customer-component/customer.service';
import { GridColumn } from '../../../shared/models/grid-column.model';
import { GridRequest } from '../../../shared/models/grid-request.model';
import { ServerDatagridComponent } from '../../../shared/components/server-datagrid-component/server-datagrid-component';
import { MatDialog } from '@angular/material/dialog';
import { CustomerComponent } from '../customer-component/customer-component';
import { LoadingService } from '../../../core/services/loading.service';

@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [CommonModule, MaterialModule, ServerDatagridComponent],
  templateUrl: './customer-list.html',
  styleUrl: './customer-list.scss',
})
export class CustomerList implements OnInit {
  private router = inject(Router);
  private customerService = inject(customerService);
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
    { field: 'customerName', header: 'Customer Name', sortable: true, width: 250, visible: true },
    { field: 'phone', header: 'Phone', sortable: true, width: 150, visible: true },
    { field: 'customerType', header: 'Type', sortable: true, width: 150, visible: true },
    { field: 'status', header: 'Status', sortable: true, width: 120, visible: true }
  ];

  ngOnInit(): void {
    // Global loader ON
    this.isDashboardLoading = true;
    this.isFirstLoad = true;
    this.loadingService.setLoading(true);
    this.cdr.detectChanges();

    this.loadCustomers({
      pageNumber: 1,
      pageSize: 10,
      sortDirection: 'desc'
    });

    // Safety timeout - force stop loader after 10 seconds
    setTimeout(() => {
      if (this.isDashboardLoading) {
        console.warn('[CustomerList] Force stopping loader after 10s timeout');
        this.isDashboardLoading = false;
        this.isFirstLoad = false;
        this.loadingService.setLoading(false);
        this.cdr.detectChanges();
      }
    }, 10000);
  }

  loadCustomers(request: GridRequest): void {
    this.lastRequest = request;
    this.loading = true;
    this.customerService.getPaged(request).subscribe({
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

  addCustomer() {
    const dialogRef = this.dialog.open(CustomerComponent, {
      width: '600px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadCustomers(this.lastRequest);
      }
    });
  }

  onEdit(row: any) {
    // Current CustomerComponent doesn't fully support edit in modal yet based on param handling, 
    // but the user asked to call the popup.
    const dialogRef = this.dialog.open(CustomerComponent, {
      width: '600px',
      data: { id: row.id },
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadCustomers(this.lastRequest);
      }
    });
  }
}
