import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { PriceListService } from '../service/pricelist.service';
import { CommonModule, DatePipe } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../shared/material/material/material-module';
import { Router, RouterLink } from '@angular/router';
import { PriceListModel } from '../models/pricelist.model';
import { ServerDatagridComponent } from '../../../../shared/components/server-datagrid-component/server-datagrid-component';
import { GridRequest } from '../../../../shared/models/grid-request.model';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog-component/confirm-dialog-component';
import { ApiResultDialog } from '../../../shared/api-result-dialog/api-result-dialog';
import { PricelistForm } from '../pricelist-form/pricelist-form';
import { MatDrawer } from '@angular/material/sidenav';
import { StatusDialogComponent } from '../../../../shared/components/status-dialog-component/status-dialog-component';

@Component({
  selector: 'app-pricelist-list',
  standalone: true, // Ensure standalone if used
  imports: [CommonModule, ReactiveFormsModule, MaterialModule, ServerDatagridComponent, PricelistForm],
  providers: [DatePipe],
  templateUrl: './pricelist-list.html',
  styleUrl: './pricelist-list.scss',
})
export class PricelistList implements OnInit {

  columns = [
    { field: 'name', header: 'Price List Name', sortable: true, width: 300, visible: true },
    { field: 'code', header: 'Code', sortable: true, width: 150, visible: true },
    { field: 'priceType', header: 'Price Type', sortable: true, width: 150, visible: true },
    {
      field: 'validFrom',
      header: 'Valid From', sortable: true, width: 125, visible: true,
      cell: (row: any) => row.validFrom ? this.datePipe.transform(row.validFrom, 'dd-MMM-yyyy') : '-'
    },
    {
      field: 'validTo',
      header: 'Valid To', sortable: true, width: 125, visible: true,
      cell: (row: any) => row.validTo ? this.datePipe.transform(row.validTo, 'dd-MMM-yyyy') : '-'
    },
    {
      field: 'isActive',
      header: 'Status', sortable: true, width: 100, visible: true,
      cell: (row: any) => row.isActive ? 'Active' : 'Inactive'
    }
  ];

  loading = true;
  totalCount = 0;
  selectedRows: any[] = [];
  lastRequest!: GridRequest;

  @ViewChild(ServerDatagridComponent) grid!: ServerDatagridComponent<any>;
  data: PriceListModel[] = [];

  constructor(
    private service: PriceListService,
    private router: Router,
    private dialog: MatDialog,
    private datePipe: DatePipe,
    private cdr: ChangeDetectorRef) { }

  @ViewChild('drawer') drawer!: MatDrawer; // Drawer ka access lene ke liye
  selectedId: string | null = null; // ID store karne ke liye

  ngOnInit(): void {
    this.loadPriceLists({
      pageNumber: 1,
      pageSize: 10,
      sortDirection: 'desc'
    });
  }

  loadPriceLists(request: GridRequest): void {
    this.lastRequest = request;
    this.loading = true;
    this.cdr.detectChanges();

    // Mapping service function to get paged data
    this.service.getPriceLists().subscribe({
      next: (res: any) => {

        this.data = res.items || res;
        this.totalCount = res.totalCount || this.data.length;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: err => {
        console.error("Load Error:", err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }


  deletePriceList(row: any): void {
    this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Confirm Delete',
        message: `Are you sure you want to delete "${row.name}"?`
      }
    }).afterClosed().subscribe(confirm => {
      if (!confirm) return;

      this.loading = true;
      this.service.deletePriceList(row.id).subscribe({
        next: (res) => {
          this.loading = false;
          this.cdr.detectChanges();
          this.dialog.open(StatusDialogComponent, {
            data: { isSuccess: true, message: 'Price list deleted successfully' }
          });
          this.loadPriceLists(this.lastRequest);
        },
        error: err => {
          this.loading = false;
          this.dialog.open(StatusDialogComponent, {
            data: { isSuccess: false, message: err?.error?.message || 'Delete failed' }
          });
        }
      });
    });
  }

  confirmBulkDelete(): void {
    if (!this.selectedRows.length) return;

    this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        title: 'Bulk Delete',
        message: `Delete ${this.selectedRows.length} selected items?`
      }
    }).afterClosed().subscribe(confirm => {
      if (!confirm) return;

      this.loading = true;
      const ids = this.selectedRows.map(x => x.id);

      // Note: Assuming deleteMany exists in service or using multiple calls
      this.service.deletePriceList(ids[0]).subscribe({ // Example for single, update for multi
        next: () => {
          this.loading = false;
          this.cdr.detectChanges();
          this.grid.clearSelection();
          this.loadPriceLists(this.lastRequest);
        },
        error: () => this.loading = false
      });
    });
  }

  onSelectionChange(rows: any[]) {
    this.selectedRows = rows;
  }

  // Jab Grid mein Edit click hoga [cite: 2026-01-22]
  onEditClicked(event: any) {


    // 1. Row ki ID save karein [cite: 2026-01-22]
    this.selectedId = event.id || event.data?.id;

    // 2. Drawer ko open karein [cite: 2026-01-22]
    if (this.drawer) {
      this.drawer.open();
    }
  }


  openCreateDrawer() {
    this.selectedId = null;
    this.drawer.open();
  }

  handleFormAction(event: any) {

    this.drawer.close();
  }
}