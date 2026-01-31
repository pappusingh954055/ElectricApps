import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { MaterialModule } from '../../../shared/material/material/material-module';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
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
  isFromPopup: boolean = false;
  isViewMode: boolean = false;
  private dialog = inject(MatDialog);

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
        this.isFromPopup = false;
        
        // Logic Update: View mode mein id ko grnHeaderId ki tarah treat karein
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

  // Logic Update: Parameter handle for View vs Add mode
  loadPOData(id: number, grnHeaderId: number | null = null) {
    this.inventoryService.getPODataForGRN(id, grnHeaderId).subscribe({
      next: (res) => {
        if (!res) return;

        this.grnForm.patchValue({
          grnNumber: res.grnNumber || 'AUTO-GEN',
          poNumber: res.poNumber,
          supplierName: res.supplierName,
          remarks: res.remarks || '' 
        });

        if (res.items && res.items.length > 0) {
          this.mapItems(res.items);
        } else if (this.isFromPopup) {
          this.inventoryService.getPOItemsForGRN(id).subscribe(popupItems => {
            this.mapItems(popupItems);
          });
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

      const received = this.isViewMode
        ? Number(item.receivedQty || item.ReceivedQty || 0)
        : pending;

      const rejected = Number(item.rejectedQty || item.RejectedQty || 0);

      const accepted = this.isViewMode
        ? Number(item.acceptedQty || item.AcceptedQty || (received - rejected))
        : (received - rejected);

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
        total: accepted * rate
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
    item.total = item.acceptedQty * unitRate;

    this.calculateGrandTotal();
  }

  showValidationError(message: string) {
    this.dialog.open(StatusDialogComponent, {
      width: '350px',
      data: { title: 'Validation Error', message: message, status: 'error', isSuccess: false }
    });
  }

  calculateGrandTotal(): number {
    return this.items.reduce((acc, item) => acc + (Number(item.acceptedQty || 0) * Number(item.unitRate || 0)), 0);
  }

  saveGRN() {
    if (this.grnForm.invalid || this.items.length === 0 || this.isViewMode) return;
    const currentUserId = localStorage.getItem('userId') || '00000000-0000-0000-0000-000000000000';

    const grnData = {
      poHeaderId: this.poId,
      receivedDate: this.grnForm.getRawValue().receivedDate,
      remarks: this.grnForm.value.remarks,
      totalAmount: this.calculateGrandTotal(),
      status: 'Received',
      createdBy: currentUserId,
      items: this.items.map(item => ({
        productId: item.productId,
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

  goBack() { this.router.navigate(['/app/inventory/grn-list']); }
  onCancel() { this.goBack(); }
}