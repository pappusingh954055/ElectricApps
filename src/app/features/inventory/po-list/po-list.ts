import { ChangeDetectorRef, Component, inject, OnInit, ViewChild } from '@angular/core';
import { MaterialModule } from '../../../shared/material/material/material-module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { EnterpriseHierarchicalGridComponent } from '../../../shared/components/enterprise-hierarchical-grid-component/enterprise-hierarchical-grid-component';
import { MatTableDataSource } from '@angular/material/table';
import { GridColumn } from '../../../shared/models/grid-column.model';
import { InventoryService } from '../service/inventory.service';
import { POService } from '../service/po.service';
import { Router } from '@angular/router';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog-component/confirm-dialog-component';
import { MatDialog } from '@angular/material/dialog';
import { NotificationService } from '../../shared/notification.service';
import { SelectionModel } from '@angular/cdk/collections';
import { AuthService } from '../../../core/services/auth.service';
import { PurchaseOrderStatus } from '../models/po-status.enum';
import { StatusDialogComponent } from '../../../shared/components/status-dialog-component/status-dialog-component';
import { ActionConfirmDialog } from '../../../shared/components/action-confirm-dialog/action-confirm-dialog';
import { ReasonRejectDialog } from '../../../shared/components/reason-reject-dialog/reason-reject-dialog';
import { PoPrintModalComponent } from './po-print-modal/po-print-modal.component';

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

  private authService = inject(AuthService);

  userRole: any;

  @ViewChild(EnterpriseHierarchicalGridComponent) grid!: EnterpriseHierarchicalGridComponent;

  constructor(
    private poService: InventoryService,
    private poActionService: POService,
    private cdr: ChangeDetectorRef,
    private datePipe: DatePipe,
    private currencyPipe: CurrencyPipe,
    private dialog: MatDialog,
    private notification: NotificationService
  ) { }

  ngOnInit() {
    this.initColumns();
    this.userRole = this.authService.getUserRole();

    console.log('[PoList] Current User Role:', this.userRole);

    // Iske baad apna data load karein
    this.loadData(this.currentGridState);
  }

  private initColumns() {
    this.poColumns = [
      { field: 'poNumber', header: 'PO No.', sortable: true, isFilterable: true, isResizable: true, width: 150 },
      { field: 'id', header: 'ID', sortable: true, isFilterable: true, visible: false, isResizable: true, width: 150 },
      {
        field: 'poDate',
        header: 'Date',
        sortable: true,
        isResizable: true,
        width: 120,
        cell: (row: any) => this.datePipe.transform(row.poDate, 'MM/dd/yyyy')
      },
      {
        field: 'expectedDeliveryDate',
        header: 'Delivery Date',
        sortable: true,
        isResizable: true,
        width: 120,
        cell: (row: any) => this.datePipe.transform(row.expectedDeliveryDate, 'MM/dd/yyyy')
      },
      { field: 'createdBy', header: 'Created By', sortable: true, isFilterable: true, isResizable: true, width: 150 },
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
    this.pageSize = state.pageSize || 10;
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
      sortField: state.sortField ?? 'CreatedDate',
      sortOrder: state.sortOrder ?? 'desc',
      filter: state.globalSearch || '', // Grid ke Search input se aa raha hai
      fromDate: state.fromDate ? this.datePipe.transform(state.fromDate, 'yyyy-MM-dd') : null,
      toDate: state.toDate ? this.datePipe.transform(state.toDate, 'yyyy-MM-dd') : null,
      filters: columnFilters
    };

    this.poService.getPagedOrders(requestPayload).subscribe({
      next: (res) => {
        console.log('API PO List Response:', res);
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
    this.router.navigate(['/app/inventory/polist/edit', row.id], {
      state: {
        data: row,
        mode: 'edit'
      }
    });
  }



  // --- 1. SINGLE PARENT DELETE (Row Trash Icon) ---
  onDeleteSingleParentRecord(row: any) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Purchase Order',
        message: `Do you want to delete the PO No: ${row.poNumber}? This will delete all items.`,
        confirmText: 'Yes',
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

  onBulkDeleteParentOrders(selectedRows: any[]) {
    if (!selectedRows || selectedRows.length === 0) {
      this.notification.showStatus(false, 'First select the po!');
      return;
    }

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

  // 1. Grid se aane wale actions ko route karne ke liye
  handleGridAction(event: { action: string, row: any }) {
    const row = event.row;

    switch (event.action) {
      case 'EDIT': // <--- Yeh case miss ho gaya tha
        this.OnEditPo(row);
        break;
      case 'SUBMIT':
        this.onSubmitPO(row);
        break;
      case 'APPROVE':
        this.onApprovePO(row);
        break;
      case 'REJECT':
        this.onRejectPO(row);
        break;

      case 'VIEW': // Eye icon -> Download Mode
        this.onPrintPO(row, 'VIEW');
        break;

      // --- Naye Cases Jo Humne Add Kiye ---
      case 'PRINT': // Print icon -> Print Mode
        this.onPrintPO(row, 'PRINT');
        break;
      case 'CREATE_GRN':
        this.onCreateGRN(row); // Approved PO ke liye truck icon logic
        break;
      case 'DELETE':
        this.onDeleteSingleParentRecord(row);
        break;

      default:
        console.warn(`Action ${event.action} is not handled.`);
        break;
    }
  }
  // 1. GRN Page par bhejta hai
  onCreateGRN(row: any) {
    console.log('Redirecting to GRN for PO:', row.poNumber);
    this.router.navigate(['/app/inventory/grn-list/edit', row.id], {
      state: { poData: row, mode: 'save' }
    });
  }

  // 2. Print logic
  // 2. Print logic
  onPrintPO(row: any, mode: string = 'PRINT') {
    this.isLoading = true;
    this.cdr.detectChanges();

    this.poActionService.getPrintDetails(row.id).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.cdr.detectChanges();

        if (res) {
          this.dialog.open(PoPrintModalComponent, {
            width: '850px',
            maxWidth: '95vw',
            data: { ...res, mode: mode, id: row.id, status: row.status }, // Pass status for conditional buttons
            autoFocus: false
          });
        } else {
          this.notification.showStatus(false, 'No print details found.');
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.cdr.detectChanges();
        console.error('Print Fetch Error:', err);
        this.notification.showStatus(false, 'Failed to fetch print data.');
      }
    });
  }
  // 1. User: Submit (Status: 'Submitted')
  onSubmitPO(row: any) {
    const poNumber = row.poNumber || 'N/A';

    const dialogRef = this.dialog.open(ActionConfirmDialog, {
      width: '400px',
      data: {
        title: 'Confirm Submission',
        message: `Do you want to send Po No: ${poNumber} for approval?`,
        confirmText: 'Submit',
        confirmColor: 'primary'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.updateStatus(row.id, 'Submitted', `PO ${poNumber} has been successfully submitted!`);
      }
    });
  }

  // 2. Manager: Approve (Status: 'Approved')
  onApprovePO(row: any) {
    const poNumber = row.poNumber || 'N/A';

    const dialogRef = this.dialog.open(ActionConfirmDialog, {
      width: '400px',
      data: {
        title: 'Approve PO',
        message: `Do you want to approve the PO NO: ${poNumber}?`,
        confirmText: 'Approve',
        confirmColor: 'success'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.updateStatus(row.id, 'Approved', 'PO Approved Successfully!');
      }
    });
  }

  // 3. Manager: Reject (Status: 'Rejected')
  onRejectPO(row: any) {
    // Debugging ke liye console zaroor check karein ki 'row' mein kya aa raha hai
    console.log('Rejecting Row:', row);

    const dialogRef = this.dialog.open(ReasonRejectDialog, {
      width: '450px',
      maxWidth: '90vw',
      disableClose: true,
      // Fallback logic: poNo check karein, agar nahi hai toh pono check karein [cite: 2026-01-22]
      data: { poNo: row.poNumber || row.poNumber || 'N/A' }
    });

    dialogRef.afterClosed().subscribe(reason => {
      if (reason) {
        this.poService.updatePOStatus(row.id, 'Rejected', reason).subscribe({
          next: () => {
            this.loadData(this.currentGridState);
            this.dialog.open(StatusDialogComponent, {
              width: '400px',
              data: {
                title: 'Success',
                message: `PO ${row.poNumber || row.poNumber} has been rejected successfully.`,
                isSuccess: true
              }
            });
          },
          error: (err) => {
            this.dialog.open(StatusDialogComponent, {
              width: '400px',
              data: { title: 'Error', message: 'Failed to reject PO.', type: 'error', isSuccess: false, },

            });
          }
        });
      }
    });
  }

  // 4. Common Update Method with Status Dialog
  private updateStatus(id: number, status: string, successMessage: string) {
    this.poService.updatePOStatus(id, status).subscribe({
      next: (response) => {
        // SUCCESS logic: isSuccess ko true bhejna hai [cite: 2026-01-22]
        const dialogRef = this.dialog.open(StatusDialogComponent, {
          width: '350px',
          data: {
            message: successMessage,
            isSuccess: true // Aapke HTML mein yahi property use ho rahi hai [cite: 2026-01-22]
          }
        });

        setTimeout(() => dialogRef.close(), 2500);
        this.loadData(this.currentGridState);
      },
      error: (err) => {
        console.error('API Error:', err);
        // ERROR logic: isSuccess ko false bhejna hai [cite: 2026-01-22]
        this.dialog.open(StatusDialogComponent, {
          width: '350px',
          data: {
            message: 'Server connectivity issue ya data validation error.',
            isSuccess: false // Error icon aur red color ke liye [cite: 2026-01-22]
          }
        });
      }
    });
  }

  onBulkSentForDraftApproval(selectedRows: any[]) {
    // 1. Validation: Only Drafts
    const draftRows = selectedRows.filter((row: any) => row.status === 'Draft');

    if (draftRows.length === 0) {
      this.notification.showStatus(false, 'Selected items must be in "Draft" status to submit.');
      return;
    }

    if (draftRows.length !== selectedRows.length) {
      this.notification.showStatus(false, 'Some selected items were skipped (not Draft). Processing valid ones only.');
    }

    // 2. Confirmation Dialog
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '450px',
      data: {
        title: 'Bulk Approval Submission',
        message: `Are you sure you want to send ${draftRows.length} POs for approval?`,
        confirmText: 'Yes, Send All',
        cancelText: 'Cancel'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.isLoading = true;
        const ids = draftRows.map((row: any) => row.id);

        this.poActionService.bulkSentForDraftApproval(ids).subscribe({
          next: () => {
            this.isLoading = false;
            this.notification.showStatus(true, 'Selected POs sent for approval successfully.');

            // Clear selection and reload
            if (this.grid && this.grid.selection) {
              this.grid.selection.clear();
            }
            this.loadData(this.currentGridState);
          },
          error: (err) => {
            console.error(err);
            this.isLoading = false;
            this.notification.showStatus(false, 'Failed to submit POs for approval.');
          }
        });
      }
    });
  }

  onBulkDraftApproved(selectedRows: any[]) {
    // 1. Validation: Only Submitted items usually, but strictly based on user req, maybe Drafts too?
    // Assuming we are approving drafts directly or similar state. 
    // The previous logic filtered 'Draft', lets see. The user said 'Bulk Draft Approved'.
    // If the API is bulkApprove, usually it moves status to Approved.
    // I'll check if they need to be in a specific state. 
    // Usually "Draft Approved" might mean skipping "Submitted" state or Approving "Submitted" ones.
    // Given the previous button was "Bulk Draft Approval" (which calls 'bulkSentForDraftApproval' -> changes status to Submitted?),
    // and this is "Bulk Draft Approved" (calls 'bulkDraftApprove' -> changes status to Approved?).

    // Let's assume we can approve from Draft or Submitted if the API allows. 
    // But usually approval happens on 'Submitted' items.
    // However, if the user explicitly calls it "Bulk Draft Approved", maybe they want to approve drafts directly?
    // Be safe, just send the IDs and let backend handle status checks, or filter for non-Approved.

    const validRows = selectedRows.filter((row: any) => row.status !== 'Approved'); // Basic check

    if (validRows.length === 0) {
      this.notification.showStatus(false, 'Selected items are already Approved.');
      return;
    }

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '450px',
      data: {
        title: 'Bulk Approve',
        message: `Are you sure you want to Approve ${validRows.length} POs?`,
        confirmText: 'Yes, Approve All',
        cancelText: 'Cancel'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.isLoading = true;
        this.cdr.detectChanges();
        const ids = validRows.map((row: any) => row.id);

        this.poActionService.bulkDraftApprove(ids).subscribe({
          next: () => {
            this.isLoading = false;
            this.notification.showStatus(true, 'Selected POs Approved successfully.');
            if (this.grid && this.grid.selection) {
              this.grid.selection.clear();
            }
            this.loadData(this.currentGridState);
          },
          error: (err) => {
            console.error(err);
            this.isLoading = false;
            this.notification.showStatus(false, 'Failed to Approve POs.');
            this.cdr.detectChanges();
          }
        });
      }
    });
  }

  onBulkCreateGrn(selectedRows: any[]) {
    if (!selectedRows || selectedRows.length === 0) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '450px',
      data: {
        title: 'Bulk Receive Items',
        message: `System will automatically create ${selectedRows.length} Goods Received Notes (GRN) for selected POs. Do you want to continue?`,
        confirmText: 'Yes, Create All',
        cancelText: 'Cancel',
        confirmColor: 'primary'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.isLoading = true;
        this.cdr.detectChanges();

        const request = {
          purchaseOrderIds: selectedRows.map(r => r.id),
          createdBy: this.authService.getUserName()
        };

        this.poService.createBulkGrn(request).subscribe({
          next: (res) => {
            this.isLoading = false;
            this.notification.showStatus(true, `${selectedRows.length} GRNs created successfully!`);
            if (this.grid && this.grid.selection) {
              this.grid.selection.clear();
            }
            this.loadData(this.currentGridState);
            this.cdr.detectChanges();
          },
          error: (err) => {
            this.isLoading = false;
            this.notification.showStatus(false, 'Bulk GRN creation failed. Please check if all selected items are Approved.');
            this.cdr.detectChanges();
          }
        });
      }
    });
  }

  onBulkPOReject(selectedRows: any[]) {
    // 1. Filter for Submitted items (Since manager views Submitted items)
    // We can also double check that they are not already Rejected or Approved if needed
    // But Manager selects "Submitted" items mostly.

    if (!selectedRows || selectedRows.length === 0) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '450px',
      data: {
        title: 'Bulk Reject',
        message: `Are you sure you want to Reject ${selectedRows.length} POs?`,
        confirmText: 'Yes, Reject All',
        cancelText: 'Cancel',
        confirmColor: 'warn'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.isLoading = true;
        this.cdr.detectChanges();
        const ids = selectedRows.map((row: any) => row.id);

        this.poActionService.bulkPOReject(ids).subscribe({
          next: () => {
            this.isLoading = false;
            this.notification.showStatus(true, 'Selected POs Rejected successfully.');
            if (this.grid && this.grid.selection) {
              this.grid.selection.clear();
            }
            this.loadData(this.currentGridState);
            this.cdr.detectChanges();
          },
          error: (err) => {
            console.error(err);
            this.isLoading = false;
            this.notification.showStatus(false, 'Failed to Reject POs.');
            this.cdr.detectChanges();
          }
        });
      }
    });
  }
}