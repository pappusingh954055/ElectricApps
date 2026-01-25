import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { MaterialModule } from '../../../shared/material/material/material-module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { EnterpriseHierarchicalGridComponent } from '../../../shared/components/enterprise-hierarchical-grid-component/enterprise-hierarchical-grid-component';
import { MatTableDataSource } from '@angular/material/table';
import { GridColumn } from '../../../shared/models/grid-column.model';
import { InventoryService } from '../service/inventory.service';
import { Router } from '@angular/router';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog-component/confirm-dialog-component';
import { MatDialog } from '@angular/material/dialog';
import { NotificationService } from '../../shared/notification.service';
import { SelectionModel } from '@angular/cdk/collections';

@Component({
  selector: 'app-po-list',
  standalone: true,
  imports: [
    MaterialModule,
    ReactiveFormsModule,
    FormsModule,
    CommonModule,
    EnterpriseHierarchicalGridComponent,
  ],
  providers: [CurrencyPipe, DatePipe],
  templateUrl: './po-list.html',
  styleUrl: './po-list.scss',
})
export class PoList implements OnInit {
  public dataSource = new MatTableDataSource<any>([]);
  public totalRecords: number = 0;
  public pageSize: number = 10;
  public isLoading: boolean = false;

  public poColumns: GridColumn[] = [];
  public itemColumns: GridColumn[] = [];

  private currentGridState: any = {};
  private router = inject(Router);

  selection = new SelectionModel<any>(true, []);
  selectedParentRows: any[] = [];

  // Aur agar child ke liye bhi chahiye:
  childSelection = new SelectionModel<any>(true, []);

  constructor(
    private poService: InventoryService,
    private cdr: ChangeDetectorRef,
    private datePipe: DatePipe,
    private currencyPipe: CurrencyPipe,
    private dialog: MatDialog,
    private notification: NotificationService
  ) { }

  ngOnInit() {
    this.initColumns();
    // initialLoad ki zaroorat nahi hai, Grid ka ngOnInit khud triggerDataLoad call karega
  }

  private initColumns() {
    this.poColumns = [
      { field: 'poNumber', header: 'PO No.', sortable: true, isFilterable: true, isResizable: true, width: 150 },
      { field: 'id', header: 'ID', sortable: true, isFilterable: true, isResizable: true, width: 150 },
      {
        field: 'poDate',
        header: 'Date',
        sortable: true,
        isResizable: true,
        width: 120,
        cell: (row: any) => this.datePipe.transform(row.poDate, 'MM/dd/yyyy')
      },
      { field: 'supplierName', header: 'Supplier Name', sortable: true, isResizable: true, width: 200, isFilterable: true },
      {
        field: 'grandTotal',
        header: 'Grand Total',
        sortable: true,
        isResizable: true,
        width: 130,
        align: 'left',
        cell: (row: any) => this.currencyPipe.transform(row.grandTotal, 'INR', 'symbol', '1.2-2')
      },
      { field: 'status', header: 'Status', sortable: true, isResizable: true, width: 100, isFilterable: true }
    ];

    this.itemColumns = [
      { field: 'productName', header: 'Product Name', width: 200, sortable: true, isFilterable: true, isResizable: true },
      { field: 'qty', header: 'Qty', width: 80, align: 'left' },
      { field: 'unit', header: 'Unit', width: 80, align: 'left' },
      {
        field: 'rate', header: 'Rate', width: 100, align: 'left',
        cell: (row: any) => this.currencyPipe.transform(row.rate, 'INR', 'symbol', '1.2-2')
      },
      {
        field: 'discountPercent', header: 'Dis(%)', width: 100, align: 'left',
        cell: (row: any) => this.currencyPipe.transform(row.discount, 'INR', 'symbol', '1.2-2')
      },
      {
        field: 'gstPercent', header: 'GST(%)', width: 100, align: 'left',
        cell: (row: any) => this.currencyPipe.transform(row.gstPercent, 'INR', 'symbol', '1.2-2')
      },
      {
        field: 'taxAmount', header: 'Tax Amount', width: 120, align: 'left',
        cell: (row: any) => this.currencyPipe.transform(row.taxAmount, 'INR', 'symbol', '1.2-2')
      },
      {
        field: 'total', header: 'Total', width: 120, align: 'left',
        cell: (row: any) => this.currencyPipe.transform(row.total, 'INR', 'symbol', '1.2-2')
      }
    ];
  }

  // Central control function: Grid se jo bhi change hoga, yahan se API call jayegi
  public onGridStateChange(state: any) {
    this.currentGridState = state;
    this.loadData(state);
  }

  public loadData(state: any) {
    this.isLoading = true;
    this.cdr.detectChanges();

    // Mapping column filters if any
    const columnFilters = state && state.filters ? state.filters : [];

    const requestPayload = {
      pageIndex: state.pageIndex ?? 0,
      pageSize: state.pageSize ?? 10,
      sortField: state.sortField ?? 'PoDate',
      sortOrder: state.sortOrder ?? 'desc',
      filter: state.globalSearch || '', // Grid ke Search input se aa raha hai
      fromDate: state.fromDate ? this.datePipe.transform(state.fromDate, 'yyyy-MM-dd') : null,
      toDate: state.toDate ? this.datePipe.transform(state.toDate, 'yyyy-MM-dd') : null,
      filters: columnFilters
    };

    this.poService.getPagedOrders(requestPayload).subscribe({
      next: (res) => {
        this.dataSource.data = res.data || [];
        this.totalRecords = res.totalRecords || 0;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('API Error:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }
  OnEditPo(row: any): void {
    // Hamari strategy 'state' transfer ki hai
    this.router.navigate(['/app/inventory/po-list/add', row.id], {
      state: {
        data: row,        // Is 'row' object mein 'id' hona zaroori hai
        mode: 'edit'
      }
    });
  }
  // po-list.component.ts
  handleEdit(data: any) {
    console.log('Redirecting to Edit Path:', data);

    // Routing file mein 'edit/:id' hai, isliye wahi path use karein
    const editPath = '/app/inventory/polist/edit';
    const addPath = '/app/inventory/polist/add';

    if (data && (data.id !== undefined && data.id !== null)) {
      // Yeh routing ke { path: 'edit/:id' } se match karega
      this.router.navigate([editPath, data.id]);
    } else {
      // Yeh routing ke { path: 'add' } se match karega
      this.router.navigate([addPath]);
    }
  }

  // --- 1. SINGLE PARENT DELETE (Row Trash Icon) ---
  onDeleteSingleParentRecord(row: any) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Purchase Order',
        message: `Do you want to delete the PO No: ${row.poNumber}? This will delete all items.`,
        confirmText: 'Yes, Delete All',
        cancelText: 'No'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.isLoading = true;
        this.poService.deletePurchaseOrder(row.id).subscribe({
          next: (res) => {
            this.isLoading = false;
            if (res.success) {
              this.notification.showStatus(true, `PO: ${row.poNumber} deleted!`);
              this.loadData(this.currentGridState);
            }
            this.cdr.detectChanges();
          },
          error: () => {
            this.isLoading = false;
            this.notification.showStatus(false, 'Error: PO not deleted.');
            this.cdr.detectChanges();
          }
        });
      }
    });
  }

  // --- 2. BULK PARENT DELETE (Main Selection) ---
  onBulkDeleteParentOrders(selectedRows: any[]) {
    if (!selectedRows || selectedRows.length === 0) {
      this.notification.showStatus(false, 'First select the po!');
      return;
    }

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '450px',
      data: {
        title: '⚠️ Critical: Bulk Delete Parent Orders',
        message: `Do you want to permanently remove these ${selectedRows.length} orders?`,
        confirmText: 'Yes, Delete All',
        cancelText: 'Cancel'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.isLoading = true;
        const parentIds = selectedRows.map(row => row.id);

        this.poService.bulkDeletePurchaseOrders(parentIds).subscribe({
          next: (res) => {
            this.isLoading = false;
            if (res.success) {
              this.notification.showStatus(true, `${selectedRows.length} Orders deleted.`);
              this.selection.clear(); // Important cleanup
              this.loadData(this.currentGridState);
            }
            this.cdr.detectChanges();
          },
          error: () => {
            this.isLoading = false;
            this.notification.showStatus(false, 'Error: Bulk delete failed.');
            this.cdr.detectChanges();
          }
        });
      }
    });
  }

  // --- 3. CHILD DELETE (Single & Bulk merged) ---
  onBulkDeleteChildItems(event: any) {
    // event.isBulk true hai toh multiple IDs, warna single ID array mein
    const poNo = event.parent.poNumber;
    const itemIds = event.isBulk ? event.child.map((i: any) => i.id) : [event.child.id];
    const displayMsg = event.isBulk ? `${event.child.length} items` : `item "${event.child.productName}"`;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Remove Line Item(s)',
        message: `Do you want to remove ${displayMsg} from PO: ${poNo}?`,
        confirmText: 'Remove',
        cancelText: 'Keep'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.isLoading = true;
        this.poService.bulkDeletePOItems(event.parent.id, itemIds).subscribe({
          next: (res) => {
            this.isLoading = false;
            if (res.success) {
              this.notification.showStatus(true, 'Items removed successfully.');
              if (event.isBulk) this.childSelection.clear(); // Clear child selections
              this.loadData(this.currentGridState);
            }
            this.cdr.detectChanges();
          },
          error: () => {
            this.isLoading = false;
            this.notification.showStatus(false, 'Error removing items.');
            this.cdr.detectChanges();
          }
        });
      }
    });
  }


  onGridSelectionChange(selectedRows: any[]) {
    this.selectedParentRows = selectedRows;
  }

  
}