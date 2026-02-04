import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core'; // CDR add kiya
import { FormGroup, FormBuilder, Validators, FormArray, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../shared/material/material/material-module';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { PurchaseReturnService } from '../services/purchase-return.service';
import { StatusDialogComponent } from '../../../../shared/components/status-dialog-component/status-dialog-component';
import { MatDialog } from '@angular/material/dialog';

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
    public router: Router,
    private dialog: MatDialog,
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.loadSuppliersWithRejections();
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

  loadSuppliersWithRejections() {
    this.prService.getSuppliersWithRejections().subscribe({
      next: (data) => this.suppliers = data,
    
      complete: () => this.cdr.detectChanges(),
      
      error: (err) => console.error("Error loading suppliers", err)
    });
      console.log("Suppliers with rejections:", this.suppliers);
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
}

