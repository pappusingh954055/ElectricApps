import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { MaterialModule } from '../../../shared/material/material/material-module';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { InventoryService } from '../service/inventory.service';
import { StatusDialogComponent } from '../../../shared/components/status-dialog-component/status-dialog-component';
import { MatDialog } from '@angular/material/dialog';


@Component({
  selector: 'app-grn-form-component',
  standalone: true, // Agar standalone use kar rahe hain
  imports: [CommonModule, MaterialModule, ReactiveFormsModule],
  templateUrl: './grn-form-component.html',
  styleUrl: './grn-form-component.scss',
})
export class GrnFormComponent implements OnInit {
  grnForm!: FormGroup;
  items: any[] = [];
  poId: number = 0;
  supplierId: number = 0; // Backend save ke liye zaroori hai
  private dialog = inject(MatDialog);
  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,

    private inventoryService: InventoryService // Service inject ho gayi [cite: 2026-01-22]
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    // FIX: URL mein 'poid' hai (image_ca9490 dekhein), isliye yahan bhi 'poid' use karein
    this.route.queryParams.subscribe(params => {
      const idFromUrl = params['poId'];
      console.log('URL se mili ID:', idFromUrl); // Debugging ke liye

      if (idFromUrl) {
        this.poId = +idFromUrl;
        this.loadPOData(this.poId); // Real API call trigger karega
      } else {
        console.error('URL mein poid nahi mila!');
      }
    });
  }

  initForm() {
    this.grnForm = this.fb.group({
      grnNumber: [{ value: 'AUTO-GEN', disabled: true }],
      receivedDate: [new Date(), Validators.required],
      supplierName: [{ value: '', disabled: true }], // Readonly as per UI
      poNumber: [{ value: '', disabled: true }], // Readonly as per UI
      remarks: ['']
    });
  }

  // API se real data fetch karna
  loadPOData(id: number) {
    this.inventoryService.getPODataForGRN(id).subscribe({
      next: (res) => {
        this.grnForm.patchValue({
          poNumber: res.poNumber,
          supplierName: res.supplierName
        });
        this.supplierId = res.supplierId;

        // Items mapping with default received quantity
        this.items = res.items.map((item: any) => ({
          ...item,
          receivedQty: item.pendingQty, // Default logic
          total: item.pendingQty * item.unitRate
        }));
      },
      error: (err) => console.error("Data load failed", err)
    });
  }

  // Row level calculation [cite: 2026-01-22]
  onQtyChange(item: any) {
    if (item.receivedQty > item.pendingQty) {
      item.receivedQty = item.pendingQty; // Validation: Pending se zyada nahi le sakte
    }
    item.total = item.receivedQty * item.unitRate;
  }

  calculateGrandTotal(): number {
    return this.items.reduce((acc, item) => acc + (item.receivedQty * item.unitRate), 0);
  }

  // Save Logic with CQRS Payload
  saveGRN() {
    if (this.grnForm.invalid || this.items.length === 0) return;

    const savedRoles = localStorage.getItem('roles');
    const rolesArray = savedRoles ? JSON.parse(savedRoles) : [];
    const userRole = rolesArray.length > 0 ? rolesArray[0] : 'Unknown User';

    const grnData = {
      poHeaderId: this.poId,
      supplierId: this.supplierId,
      receivedDate: this.grnForm.getRawValue().receivedDate,
      remarks: this.grnForm.value.remarks,
      totalAmount: this.calculateGrandTotal(),
      status: 'Received',
      createdBy: userRole,
      items: this.items.map(item => ({
        productId: item.productId,
        orderedQty: item.orderedQty,
        receivedQty: item.receivedQty,
        unitRate: item.unitRate
      }))
    };

    // ERROR FIX: Backend 'Data' property maang raha hai, isliye wrap karein
    const finalPayload = { data: grnData };

    this.inventoryService.saveGRN(finalPayload).subscribe({
      next: () => {
        this.dialog.open(StatusDialogComponent, {
          width: '350px',
          data: {
            title: 'Success',
            message: 'Stock Updated Successfully!',
            type: 'success',
            isSuccess: true
          }
        }).afterClosed().subscribe(() => {
          this.router.navigate(['/app/inventory/grn-list']);
        });
      },
      error: (err) => {
        this.dialog.open(StatusDialogComponent, {
          width: '350px',
          data: {
            title: 'Error',
            message: 'Error saving GRN: ' + err.message,
            type: 'error',
            isSuccess: false
          }
        });
      }
    });
  }
  onCancel() { this.router.navigate(['/app/inventory/grn-list']); }
  goBack() { this.router.navigate(['/app/inventory/grn-list']); }

  calculateTotal(item: any) { }
}