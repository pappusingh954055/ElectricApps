import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core'; // CDR add kiya
import { FormGroup, FormBuilder, Validators, FormArray, FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { MaterialModule } from '../../../../shared/material/material/material-module';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { PurchaseReturnService } from '../services/purchase-return.service';
import { StatusDialogComponent } from '../../../../shared/components/status-dialog-component/status-dialog-component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-purchase-return-form',
  standalone: true,
  imports: [CommonModule, MaterialModule, ReactiveFormsModule, FormsModule],
  templateUrl: './purchase-return-form.html',
  styleUrl: './purchase-return-form.scss',
})
export class PurchaseReturnForm implements OnInit {
  returnForm!: FormGroup;
  suppliers: any[] = [];
  displayedColumns: string[] = ['product', 'rejectedQty', 'returnQty', 'rate', 'total', 'actions'];
  tableDataSource: any[] = []; // Explicit data source for MatTable binding

  // CDR inject kiya taaki table bind ho sake [cite: 2026-02-03]
  private cdr = inject(ChangeDetectorRef);

  constructor(
    private fb: FormBuilder,
    private prService: PurchaseReturnService,
    private snackBar: MatSnackBar,
    public router: Router,
    private dialog: MatDialog,
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.GetSuppliersForPurchaseReturnAsync();
  }

  initForm() {
    this.returnForm = this.fb.group({
      supplierId: ['', Validators.required],
      returnDate: [new Date(), Validators.required],
      remarks: ['', Validators.required],
      items: this.fb.array([])
    });
  }

  get items() {
    return this.returnForm.get('items') as FormArray;
  }

  GetSuppliersForPurchaseReturnAsync() {
    this.prService.GetSuppliersForPurchaseReturnAsync().subscribe({
      next: (data) => {
        this.suppliers = data || [];
        this.cdr.detectChanges();
      },
      error: (err) => console.error("Error loading suppliers", err)
    });
  }

  receivedStockItems: any[] = [];
  receivedStockControl = new FormControl<any[]>([]);
  isLoadingStock: boolean = false;

  onSupplierChange(supplierId: number) {
    if (!supplierId) return;

    this.items.clear();
    this.tableDataSource = [];
    this.receivedStockItems = [];
    this.receivedStockControl.setValue([]);
    this.isLoadingStock = true;

    // 1. Load Rejected Items (Auto-load)
    this.prService.getRejectedItems(supplierId).subscribe({
      next: (res) => {
        this.cdr.detectChanges();
        if (res && res.length > 0) {
          res.forEach(item => {
            this.addReturnItem(item, 'Rejected');
          });
          this.tableDataSource = [...this.items.controls];
          this.cdr.detectChanges();
        }
      },
      error: () => { }
    });

    // 2. Load Received Stock (For Search/Select)
    this.prService.getReceivedStock(supplierId).subscribe({
      next: (data) => {
        this.receivedStockItems = data || [];
        this.isLoadingStock = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoadingStock = false;
        this.cdr.detectChanges();
      }
    });
  }

  addReturnItem(item: any, type: string) {
    const existingIndex = this.items.controls.findIndex(c =>
      c.get('productId')?.value === item.productId &&
      c.get('grnRef')?.value === item.grnRef
    );

    if (existingIndex !== -1) {
      return true; // Is duplicate
    }

    this.items.push(this.fb.group({
      productId: [item.productId],
      productName: [item.productName],
      grnRef: [item.grnRef],
      maxQty: [item.availableQty || item.rejectedQty],
      returnQty: [0, [Validators.required, Validators.min(0), Validators.max(item.availableQty || item.rejectedQty)]],
      rate: [item.rate],
      total: [0],
      itemType: [type] // Useful for UI differentiation
    }));

    this.tableDataSource = [...this.items.controls];
    this.cdr.detectChanges();
    return false; // Not a duplicate
  }

  onReceivedStockSelect(event: any) {
    const selectedItems = event.value as any[];
    if (!selectedItems || selectedItems.length === 0) return;

    const duplicates: string[] = [];

    selectedItems.forEach(item => {
      const isDuplicate = this.addReturnItem(item, 'Received');
      if (isDuplicate) {
        duplicates.push(item.productName);
      }
    });

    if (duplicates.length > 0) {
      const uniqueDuplicates = [...new Set(duplicates)];
      const message = `The following items are already in the list and will be removed from selection: \n${uniqueDuplicates.join(', ')}`;

      const dialogRef = this.dialog.open(StatusDialogComponent, {
        width: '400px',
        data: { isSuccess: false, message },
        disableClose: false // Permiting backdrop close or manual close
      });

      dialogRef.afterClosed().subscribe(() => {
        // Remove duplicates from the select control value
        const currentVal = this.receivedStockControl.value || [];
        const filtered = currentVal.filter(v => !uniqueDuplicates.includes(v.productName));
        this.receivedStockControl.setValue(filtered);
        this.cdr.detectChanges();
      });
    }
  }

  calculateTotal(index: number) {
    const item = this.items.at(index);
    const qty = item.get('returnQty')?.value || 0;
    const rate = item.get('rate')?.value || 0;
    item.get('total')?.setValue(qty * rate);
  }

  onSubmit() {
    if (this.returnForm.invalid) return;

    const rawData = this.returnForm.getRawValue();
    const itemsToReturn = rawData.items.filter((item: any) => item.returnQty > 0);

    if (itemsToReturn.length === 0) {

      this.openDialog(false, 'At least one item must be returned.');
      return;
    }

    const payload = {
      supplierId: rawData.supplierId,
      returnDate: rawData.returnDate,
      remarks: rawData.remarks,
      items: itemsToReturn
    };

    this.prService.savePurchaseReturn(payload).subscribe({
      next: (res) => {
        this.cdr.detectChanges();
        const dialogRef = this.dialog.open(StatusDialogComponent, {
          width: '400px',
          data: {
            isSuccess: true,
            message: `Purchase Return ${res.returnNumber} successfully created.`
          }
        });

        dialogRef.afterClosed().subscribe(() => {
          this.router.navigate(['/app/inventory/purchase-return']);
        });
      },
      error: (err) => {
        this.cdr.detectChanges();
        this.openDialog(false, err.error?.message || 'An error occurred while saving the data.');
      }
    });
  }


  openDialog(isSuccess: boolean, message: string) {
    this.dialog.open(StatusDialogComponent, {
      width: '400px',
      data: { isSuccess, message }
    });
  }

  removeItem(index: number) {
    const itemToRemove = this.items.at(index).value;
    this.items.removeAt(index);
    this.tableDataSource = [...this.items.controls];

    // If it was a received item, remove it from the select control as well
    if (itemToRemove.itemType === 'Received') {
      const currentVal = this.receivedStockControl.value || [];
      const filtered = currentVal.filter(v =>
        !(v.productId === itemToRemove.productId && v.grnRef === itemToRemove.grnRef)
      );
      this.receivedStockControl.setValue(filtered);
    }

    this.cdr.detectChanges();
  }
}


