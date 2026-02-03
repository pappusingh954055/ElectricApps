import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core'; // CDR add kiya
import { FormGroup, FormBuilder, Validators, FormArray, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../shared/material/material/material-module';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { PurchaseReturnService } from '../services/purchase-return.service';

@Component({
  selector: 'app-purchase-return-form',
  standalone: true,
  imports: [CommonModule, MaterialModule, ReactiveFormsModule],
  templateUrl: './purchase-return-form.html',
  styleUrl: './purchase-return-form.scss',
})
export class PurchaseReturnForm implements OnInit {
  returnForm!: FormGroup;
  suppliers: any[] = [];
  displayedColumns: string[] = ['product', 'rejectedQty', 'returnQty', 'rate', 'total'];
  tableDataSource: any[] = []; // Explicit data source for MatTable binding

  // CDR inject kiya taaki table bind ho sake [cite: 2026-02-03]
  private cdr = inject(ChangeDetectorRef);

  constructor(
    private fb: FormBuilder,
    private prService: PurchaseReturnService,
    private snackBar: MatSnackBar,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.loadSuppliersWithRejections();
  }

  initForm() {
    this.returnForm = this.fb.group({
      supplierId: ['', Validators.required],
      returnDate: [new Date(), Validators.required],
      items: this.fb.array([])
    });
  }

  get items() {
    return this.returnForm.get('items') as FormArray;
  }

  loadSuppliersWithRejections() {
    this.prService.getSuppliersWithRejections().subscribe({
      next: (data) => this.suppliers = data,
      complete: () => this.cdr.detectChanges(),
      error: (err) => console.error("Error loading suppliers", err)
    });
  }

  onSupplierChange(supplierId: number) {
    this.items.clear();
    this.tableDataSource = [];

    this.prService.getRejectedItems(supplierId).subscribe({
      next: (res) => {
        this.cdr.detectChanges();
        if (res && res.length > 0) {
          setTimeout(() => {
            res.forEach(item => {

              this.items.push(this.fb.group({
                productId: [item.productId],
                productName: [item.productName],
                grnRef: [item.grnRef],
                maxQty: [item.rejectedQty],
                returnQty: [0, [Validators.required, Validators.min(0), Validators.max(item.rejectedQty)]],
                rate: [item.rate],
                total: [0]
              }));
            });


            this.tableDataSource = [...this.items.controls];
            this.cdr.detectChanges();
          });
        }
      },
      error: (err) => this.snackBar.open("Items load nahi ho paye.", "Error"),
      complete: () => this.cdr.detectChanges()
    });
  }

  calculateTotal(index: number) {
    const item = this.items.at(index);
    const qty = item.get('returnQty')?.value || 0;
    const rate = item.get('rate')?.value || 0;
    item.get('total')?.setValue(qty * rate);
  }

  onSubmit() {
    if (this.returnForm.invalid) {
      this.snackBar.open("Check limits (Max qty exceeded).", "Close");
      return;
    }

    const formData = this.returnForm.getRawValue();
    formData.items = formData.items.filter((i: any) => i.returnQty > 0);

    if (formData.items.length === 0) {
      this.snackBar.open("Select at least one item.", "Close");
      return;
    }

    this.prService.savePurchaseReturn(formData).subscribe({
      next: (res) => {
        this.snackBar.open("Purchase Return Saved!", "Success");
        this.router.navigate(['/app/inventory/purchase-return/list']);
      },
      error: (err) => this.snackBar.open("Error saving data", "Error")
    });
  }
}