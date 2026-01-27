import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { MaterialModule } from '../../../shared/material/material/material-module';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { InventoryService } from '../service/inventory.service';
import { StatusDialogComponent } from '../../../shared/components/status-dialog-component/status-dialog-component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-grn-form-component',
  standalone: true,
  imports: [CommonModule, MaterialModule, ReactiveFormsModule, FormsModule], // FormsModule zaroori hai ngModel ke liye
  templateUrl: './grn-form-component.html',
  styleUrl: './grn-form-component.scss',
})
export class GrnFormComponent implements OnInit {
  grnForm!: FormGroup;
  items: any[] = [];
  poId: number = 0;
  supplierId: number = 0;
  private dialog = inject(MatDialog);

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private inventoryService: InventoryService
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const idFromUrl = params['id'];
      if (idFromUrl) {
        this.poId = +idFromUrl;
        this.loadPOData(this.poId);
      }
    });
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
    this.inventoryService.getPODataForGRN(id).subscribe({
      next: (res) => {
        this.grnForm.patchValue({
          poNumber: res.poNumber,
          supplierName: res.supplierName
        });
        this.supplierId = res.supplierId;
        this.items = res.items.map((item: any) => ({
          ...item,
          receivedQty: item.pendingQty, 
          total: Number(item.pendingQty) * Number(item.unitRate)
        }));
      }
    });
  }

  // FIXED: Row level calculation with explicit Number conversion
  onQtyChange(item: any) {
    const enteredQty = Number(item.receivedQty); // String to Number
    const pendingQty = Number(item.pendingQty);
    const unitRate = Number(item.unitRate);

    // Validation: Check if entered qty is more than pending
    if (enteredQty > pendingQty) {
      item.receivedQty = pendingQty; // Reset to max
      
      this.dialog.open(StatusDialogComponent, {
        width: '350px',
        data: {
          title: 'Validation Error',
          message: `Received quantity cannot exceed the pending quantity (${pendingQty}).`,
          status: 'error',
          isSuccess: false
        }
      });
    }

    // Amount Reflection: Update total for this row
    item.total = Number(item.receivedQty) * unitRate;
    
    // Global Update: Calculate Grand Total
    this.calculateGrandTotal();
  }

  calculateGrandTotal(): number {
    return this.items.reduce((acc, item) => acc + (Number(item.receivedQty) * Number(item.unitRate)), 0);
  }

  saveGRN() {
    if (this.grnForm.invalid || this.items.length === 0) return;

    const grnData = {
      poHeaderId: this.poId,
      supplierId: this.supplierId,
      receivedDate: this.grnForm.getRawValue().receivedDate,
      remarks: this.grnForm.value.remarks,
      totalAmount: this.calculateGrandTotal(),
      status: 'Received',
      items: this.items.map(item => ({
        productId: item.productId,
        orderedQty: item.orderedQty,
        receivedQty: Number(item.receivedQty), // Ensure number
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