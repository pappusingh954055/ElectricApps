import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { MaterialModule } from '../../../shared/material/material/material-module';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule, FormsModule, FormArray } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { InventoryService } from '../service/inventory.service';
import { StatusDialogComponent } from '../../../shared/components/status-dialog-component/status-dialog-component';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';

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
  isFromPopup: boolean = false; // Source track karne ke liye [cite: 2026-01-22]
  private dialog = inject(MatDialog);

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router, private cdr: ChangeDetectorRef,
    private inventoryService: InventoryService
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    // 1. Grid Flow: Jab aap list se 'Edit' ya 'View' karke aate hain
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.resetFormBeforeLoad(); // Purana data saaf karein
        this.poId = +params['id'];
        this.isFromPopup = false;
        this.loadPOData(this.poId);
      }
    });

    // 2. Popup Flow: Jab selection popup band hota hai
    this.route.queryParams.subscribe(params => {
      if (params['poId']) {
        this.resetFormBeforeLoad(); // Items list ko saaf karein taaki glitch na ho
        this.poId = +params['poId'];
        this.isFromPopup = true;

        // Header data agar URL mein hai toh turant fill karein
        if (params['poNo']) {
          this.grnForm.patchValue({ poNumber: params['poNo'] });
        }

        this.loadPOData(this.poId);
        this.cdr.detectChanges();
      }
    });
  }





  private resetFormBeforeLoad() {
    this.items = []; // Items table khali karein
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

  goBack() {
    this.router.navigate(['/app/inventory/grn-list']);
  }



  loadPOData(id: number) {
    const isViewMode = this.router.url.includes('/view');

    this.inventoryService.getPODataForGRN(id).subscribe({
      next: (res) => {
        this.grnForm.patchValue({
          grnNumber: res.grnNumber || 'AUTO-GEN',
          poNumber: res.poNumber,
          supplierName: res.supplierName
        });

        // Flow check: Popup se ya Direct Grid se
        const itemObservable = this.isFromPopup
          ? this.inventoryService.getPOItemsForGRN(id)
          : of({ items: res.items }); // Simple wrapper agar data pehle se hai

        // Hum ensure karenge ki mapItems poora ho jaye
        if (this.isFromPopup) {
          this.inventoryService.getPOItemsForGRN(id).subscribe(popupItems => {
            this.mapItems(popupItems);
            this.forceLockTable(isViewMode); // Yahan lock trigger hoga
          });
        } else {
          this.mapItems(res.items);
          this.forceLockTable(isViewMode); // Yahan lock trigger hoga
        }
      }
    });
  }

  // Ye naya function table ko "Zabardasti" lock karega
  forceLockTable(isViewMode: boolean) {
    if (isViewMode) {
      this.grnForm.disable(); // Header lock karein

      // Sabse zaruri step: Items array ko explicitly lock karein
      const items = this.grnForm.get('items') as FormArray;
      if (items) {
        items.disable(); // Ab table ke andar ke saare white boxes grey ho jayenge
      }

      this.cdr.detectChanges(); // UI refresh
    }
  }

  mapItems(incomingItems: any[]) {
    this.items = incomingItems.map((item: any) => {
      // Case-sensitivity fix: Dono handle karein (Capital and Small)
      const ordered = Number(item.OrderedQty || item.orderedQty || 0);
      const received = Number(item.AlreadyReceivedQty || item.alreadyReceivedQty || 0);
      const rate = Number(item.UnitPrice || item.unitPrice || item.unitRate || 0);
      const pending = ordered - received;

      return {
        ...item,
        productId: item.ProductId || item.productId,
        productName: item.ProductName || item.productName,
        orderedQty: ordered,
        pendingQty: pending,
        receivedQty: pending,
        rejectedQty: 0,
        acceptedQty: pending, // Initially all received is accepted
        unitRate: rate,
        total: pending * rate
      };
    });
    this.calculateGrandTotal();
    this.cdr.detectChanges();
  }

  onQtyChange(item: any) {
    const enteredQty = Number(item.receivedQty || 0);
    const pendingQty = Number(item.pendingQty || 0);
    const rejectedQty = Number(item.rejectedQty || 0);
    const unitRate = Number(item.unitRate || 0);

    // Validation 1: Received > Pending
    if (enteredQty > pendingQty) {
      item.receivedQty = pendingQty;
      this.showValidationError(`Received quantity cannot exceed the pending quantity (${pendingQty}).`);
      return;
    }

    // Validation 2: Rejected > Received
    if (rejectedQty > enteredQty) {
      item.rejectedQty = 0; // Reset rejected if invalid
      this.showValidationError(`Rejected quantity cannot exceed the received quantity (${enteredQty}).`);
    }

    // Calculate Accepted
    item.acceptedQty = Math.max(0, item.receivedQty - (item.rejectedQty || 0));

    // Calculate Total (Based on Accepted Qty) [cite: Assumption: Pay for accepted only]
    item.total = item.acceptedQty * unitRate;

    this.calculateGrandTotal();
  }

  showValidationError(message: string) {
    this.dialog.open(StatusDialogComponent, {
      width: '350px',
      data: {
        title: 'Validation Error',
        message: message,
        status: 'error',
        isSuccess: false
      }
    });
  }

  calculateGrandTotal(): number {
    // Grand Total based on Accepted Qty
    return this.items.reduce((acc, item) => acc + (Number(item.acceptedQty || 0) * Number(item.unitRate || 0)), 0);
  }

  saveGRN() {
    if (this.grnForm.invalid || this.items.length === 0) return;
    const currentUserId = localStorage.getItem('userId') || '00000000-0000-0000-0000-000000000000';
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
        orderedQty: item.orderedQty || item.qty,
        receivedQty: Number(item.receivedQty),
        rejectedQty: Number(item.rejectedQty),
        acceptedQty: Number(item.acceptedQty),
        unitRate: Number(item.unitRate)
      }))
    };

    this.inventoryService.saveGRN({ data: grnData }).subscribe({
      next: () => {
        this.dialog.open(StatusDialogComponent, {
          width: '350px',
          data: { title: 'Success', message: 'Stock Updated Successfully!', status: 'success', isSuccess: true }
        }).afterClosed().subscribe(() => {
          this.router.navigate(['/app/inventory/current-stock']);
        });
      }
    });
  }

  onCancel() { this.router.navigate(['/app/inventory/grn-list']); }
}