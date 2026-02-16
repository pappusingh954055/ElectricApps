import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { MaterialModule } from '../../../shared/material/material/material-module';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { InventoryService } from '../service/inventory.service';
import { StatusDialogComponent } from '../../../shared/components/status-dialog-component/status-dialog-component';
import { MatDialog } from '@angular/material/dialog';
import { GrnSuccessDialogComponent } from '../grn-success-dialog/grn-success-dialog.component';
import { FinanceService } from '../../finance/service/finance.service';

@Component({
  selector: 'app-grn-form-component',
  standalone: true,
  imports: [CommonModule, MaterialModule, ReactiveFormsModule, FormsModule],
  templateUrl: './grn-form-component.html',
  styleUrl: './grn-form-component.scss',
})
export class GrnFormComponent implements OnInit {
  grnForm!: FormGroup;
  items: any[] = [];
  poId: number = 0;
  supplierId: number = 0;
  supplierName: string = '';
  isFromPopup: boolean = false;
  isViewMode: boolean = false;
  private dialog = inject(MatDialog);
  private financeService = inject(FinanceService);

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private inventoryService: InventoryService
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.isViewMode = this.router.url.includes('/view');

    this.route.params.subscribe(params => {
      if (params['id']) {
        this.resetFormBeforeLoad();
        this.poId = +params['id'];
        if (this.isViewMode) {
          this.loadPOData(0, this.poId);
        } else {
          this.loadPOData(this.poId);
        }
      }
    });

    this.route.queryParams.subscribe(params => {
      if (params['poId']) {
        this.resetFormBeforeLoad();
        this.poId = +params['poId'];
        this.isFromPopup = true;
        if (params['poNo']) {
          this.grnForm.patchValue({ poNumber: params['poNo'] });
        }
        this.loadPOData(this.poId);
      }
    });
  }

  private resetFormBeforeLoad() {
    this.items = [];
    this.grnForm.patchValue({ supplierName: '', poNumber: '' });
  }

  initForm() {
    this.grnForm = this.fb.group({
      grnNumber: [{ value: 'AUTO-GEN', disabled: true }],
      receivedDate: [new Date(), Validators.required],
      supplierName: [{ value: '', disabled: true }],
      poNumber: [{ value: '', disabled: true }],
      remarks: ['']
    });
  }

  loadPOData(id: number, grnHeaderId: number | null = null) {
    this.inventoryService.getPODataForGRN(id, grnHeaderId).subscribe({
      next: (res) => {
        if (!res) return;
        console.log('pendingqtycheck:', res);

        // Capture supplier details for payment navigation
        // Testing both camelCase and PascalCase to be safe
        this.supplierId = res.supplierId || res.SupplierId || 0;
        this.supplierName = res.supplierName || res.SupplierName || '';

        console.log('✅ PO Data Loaded. Supplier Info:', {
          id: this.supplierId,
          name: this.supplierName,
          originalRes: res
        });

        this.grnForm.patchValue({
          grnNumber: res.grnNumber || 'AUTO-GEN',
          poNumber: res.poNumber,
          supplierName: this.supplierName,
          remarks: res.remarks || ''
        });

        if (res.items && res.items.length > 0) {
          this.mapItems(res.items);
        }
        this.forceLockTable();
      }
    });
  }

  forceLockTable() {
    if (this.isViewMode) {
      this.grnForm.disable();
      this.cdr.detectChanges();
    }
  }

  mapItems(incomingItems: any[]) {
    this.items = incomingItems.map((item: any) => {
      const ordered = Number(item.orderedQty || item.OrderedQty || 0);
      const pending = Number(item.pendingQty || item.PendingQty || 0);
      const rate = Number(item.unitRate || item.unitPrice || item.UnitPrice || 0);

      // LOGIC: Naya GRN banate waqt default receivedQty pendingQty ke barabar honi chahiye
      const received = this.isViewMode
        ? Number(item.receivedQty || item.ReceivedQty || 0)
        : pending;

      const rejected = Number(item.rejectedQty || item.RejectedQty || 0);

      const accepted = received - rejected;

      const discPer = Number(item.discountPercent || item.DiscountPercent || 0);
      const gstPer = Number(item.gstPercent || item.GstPercent || 0);

      const baseAmt = accepted * rate;
      const discAmt = baseAmt * (discPer / 100);
      const taxableAmt = baseAmt - discAmt;
      const taxAmt = taxableAmt * (gstPer / 100);

      return {
        ...item,
        productId: item.productId || item.ProductId,
        productName: item.productName || item.ProductName,
        orderedQty: ordered,
        pendingQty: pending,
        receivedQty: received,
        rejectedQty: rejected,
        acceptedQty: accepted,
        unitRate: rate,
        discountPercent: discPer,
        gstPercent: gstPer,
        taxAmount: taxAmt,
        total: taxableAmt + taxAmt
      };
    });
    this.calculateGrandTotal();
    this.cdr.detectChanges();
  }

  onQtyChange(item: any) {
    if (this.isViewMode) return;

    const enteredQty = Number(item.receivedQty || 0);
    const pendingQty = Number(item.pendingQty || 0);
    const rejectedQty = Number(item.rejectedQty || 0);
    const unitRate = Number(item.unitRate || 0);

    // VALIDATION: Pending se zyada received nahi ho sakta
    if (enteredQty > pendingQty) {
      item.receivedQty = pendingQty;
      this.showValidationError(`Received quantity cannot exceed the pending quantity (${pendingQty}).`);
      this.onQtyChange(item);
      return;
    }

    if (rejectedQty > enteredQty) {
      item.rejectedQty = 0;
      this.showValidationError(`Rejected quantity cannot exceed the received quantity (${enteredQty}).`);
      this.onQtyChange(item);
      return;
    }

    item.acceptedQty = Math.max(0, enteredQty - rejectedQty);

    // Financial Calculations
    const discPer = Number(item.discountPercent || 0);
    const gstPer = Number(item.gstPercent || 0);

    const baseAmt = item.acceptedQty * unitRate;
    const discAmt = baseAmt * (discPer / 100);
    const taxableAmt = baseAmt - discAmt;
    const taxAmt = taxableAmt * (gstPer / 100);

    item.taxAmount = taxAmt;
    item.total = taxableAmt + taxAmt;

    this.calculateGrandTotal();
  }

  showValidationError(message: string) {
    this.dialog.open(StatusDialogComponent, {
      width: '350px',
      data: { title: 'Validation Error', message: message, status: 'error', isSuccess: false }
    });
  }

  calculateGrandTotal(): number {
    return this.items.reduce((acc, item) => acc + (Number(item.total || 0)), 0);
  }

  saveGRN() {
    if (this.grnForm.invalid || this.items.length === 0 || this.isViewMode) return;

    // Show confirmation dialog first
    const confirmDialog = this.dialog.open(StatusDialogComponent, {
      width: '400px',
      data: {
        title: 'Confirm GRN Save',
        message: `Are you sure you want to save this GRN and update stock?\n\nGrand Total: ₹${this.calculateGrandTotal().toFixed(2)}`,
        status: 'warning',
        isSuccess: false,
        showCancel: true
      }
    });

    confirmDialog.afterClosed().subscribe(confirmed => {
      if (!confirmed) return; // User cancelled

      // User confirmed, proceed with save
      this.performGRNSave();
    });
  }

  performGRNSave() {
    const currentUserId = localStorage.getItem('email') || '';

    const grnData = {
      poHeaderId: this.poId,
      supplierId: this.supplierId,
      receivedDate: this.grnForm.getRawValue().receivedDate,
      remarks: this.grnForm.value.remarks,
      totalAmount: this.calculateGrandTotal(),
      status: 'Received',
      createdBy: currentUserId,
      items: this.items.map(item => ({
        productId: item.productId,
        orderedQty: Number(item.orderedQty),
        receivedQty: Number(item.receivedQty),
        pendingQty: Number(item.pendingQty),
        rejectedQty: Number(item.rejectedQty),
        acceptedQty: Number(item.acceptedQty),
        unitRate: Number(item.unitRate),
        discountPercent: Number(item.discountPercent),
        gstPercent: Number(item.gstPercent),
        taxAmount: Number(item.taxAmount),
        totalAmount: Number(item.total)
      }))
    };

    this.inventoryService.saveGRN({ data: grnData }).subscribe({
      next: (response: any) => {
        const grnNumber = response?.grnNumber || 'AUTO-GEN';

        // Show success dialog with payment option
        const dialogRef = this.dialog.open(GrnSuccessDialogComponent, {
          width: '500px',
          disableClose: true,
          data: {
            grnNumber: grnNumber,
            grandTotal: this.calculateGrandTotal(),
            supplierId: this.supplierId,
            supplierName: this.supplierName
          }
        });

        dialogRef.afterClosed().subscribe(result => {
          if (result === 'make-payment') {
            this.performDirectPayment({
              grnNumber: grnNumber,
              grandTotal: this.calculateGrandTotal(),
              supplierId: this.supplierId
            });
          } else {
            // Navigate to GRN List
            this.router.navigate(['/app/inventory/grn-list']);
          }
        });
      },
      error: (err) => {
        console.error('Error saving GRN:', err);
        this.dialog.open(StatusDialogComponent, {
          width: '350px',
          data: {
            title: 'Error',
            message: 'Failed to save GRN. Please try again.',
            status: 'error',
            isSuccess: false
          }
        });
      }
    });
  }

  performDirectPayment(data: any) {
    console.log('🚀 Initiating Direct Payment with data:', data);

    if (!data.supplierId || data.supplierId <= 0) {
      console.error('❌ Cannot perform direct payment: Supplier ID is invalid:', data.supplierId);
      this.dialog.open(StatusDialogComponent, {
        width: '400px',
        data: {
          isSuccess: false,
          title: 'Payment Error',
          message: `Cannot process payment. Supplier ID is missing or invalid (${data.supplierId}). Please try Recording Payment from the GRN list.`,
          status: 'error'
        }
      });
      this.router.navigate(['/app/inventory/grn-list']);
      return;
    }

    const paymentPayload = {
      supplierId: data.supplierId,
      amount: data.grandTotal,
      paymentMode: 'Cash', // Default to Cash for direct payment from GRN
      referenceNumber: data.grnNumber,
      paymentDate: new Date().toISOString(),
      remarks: `Direct Payment for GRN: ${data.grnNumber}`,
      createdBy: localStorage.getItem('email') || 'Admin'
    };

    // Add a small delay to ensure Purchase transaction is fully committed
    setTimeout(() => {
      this.financeService.recordSupplierPayment(paymentPayload).subscribe({
        next: () => {
          this.dialog.open(StatusDialogComponent, {
            width: '350px',
            data: {
              isSuccess: true,
              title: 'Payment Successful',
              message: `Direct payment of ₹${data.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })} recorded for GRN ${data.grnNumber}.`,
              status: 'success'
            }
          });
          this.router.navigate(['/app/inventory/grn-list']);
        },
        error: (err) => {
          console.error('Direct payment failed:', err);
          this.dialog.open(StatusDialogComponent, {
            width: '350px',
            data: {
              isSuccess: false,
              title: 'Payment Failed',
              message: 'GRN saved but direct payment failed. You can record it manually from the GRN list.',
              status: 'error'
            }
          });
          this.router.navigate(['/app/inventory/grn-list']);
        }
      });
    }, 500);
  }

  goBack() { this.router.navigate(['/app/inventory/grn-list']); }
  onCancel() { this.goBack(); }
}