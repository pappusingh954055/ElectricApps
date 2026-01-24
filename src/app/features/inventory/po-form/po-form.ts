import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MaterialModule } from '../../../shared/material/material/material-module';
import { MatDialog } from '@angular/material/dialog';
import { SupplierModalComponent } from '../supplier-modal/supplier-modal';
import { Supplier, SupplierService } from '../service/supplier.service';
import { InventoryService } from '../service/inventory.service';
import { Observable, of, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, takeUntil, finalize, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { ProductService } from '../../master/product/service/product.service';
import { StatusDialogComponent } from '../../../shared/components/status-dialog-component/status-dialog-component';
import { PurchaseOrderPayload } from '../models/purchaseorder.model';

@Component({
  selector: 'app-po-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MaterialModule],
  templateUrl: './po-form.html',
  styleUrl: './po-form.scss',
})
export class PoForm implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private dialog = inject(MatDialog);
  private cdr = inject(ChangeDetectorRef);
  private supplierService = inject(SupplierService);
  private inventoryService = inject(InventoryService);
  private productService = inject(ProductService);
  private router = inject(Router);
  private destroy$ = new Subject<void>();

  isPriceListAutoSelected = false;
  filteredProducts: Observable<any[]>[] = [];
  isProductLoading: boolean[] = []; 
  suppliers: Supplier[] = [];
  priceLists: any[] = [];
  isLoading = false;
  grandTotal = 0;
  totalTaxAmount = 0;
  poForm!: FormGroup;

  ngOnInit(): void {
    this.initForm();
    this.loadNextPoNumber();
    this.loadSuppliers();
    this.loadAllPriceLists();
    this.addRow();
  }

  initForm(): void {
    this.poForm = this.fb.group({
      supplierId: [0, [Validators.required, Validators.min(1)]],
      priceListId: [null],
      poDate: [new Date(), Validators.required],
      expectedDeliveryDate: [null],
      PoNumber: [{ value: '', disabled: true }],
      remarks: [''],
      items: this.fb.array([])
    });
  }

  get items(): FormArray {
    return this.poForm.get('items') as FormArray;
  }

  onSupplierChange(supplierId: number): void {
    this.supplierService.getSupplierById(supplierId).subscribe((res: any) => {
      const pListId = res.defaultpricelistId;
      if (pListId) {
        this.poForm.patchValue({ priceListId: pListId });
        this.isPriceListAutoSelected = true;
        this.refreshAllItemRates(pListId);
      } else {
        this.poForm.patchValue({ priceListId: null });
        this.isPriceListAutoSelected = false;
      }
    });
  }

  refreshAllItemRates(priceListId: string) {
    this.items.controls.forEach((control, index) => {
      const prodId = control.get('productId')?.value;
      if (prodId && prodId !== 0) {
        this.inventoryService.getProductRate(prodId, priceListId).subscribe((res: any) => {
          if (res && res.rate) {
            control.patchValue({ price: res.rate });
            this.updateTotal(index);
          }
        });
      }
    });
  }

  // --- UPDATED: Dynamic Product Change with Duplication Check ---
  onProductChange(index: number, event: any): void {
    const product = event.option.value;
    const row = this.items.at(index);
    const priceListId = this.poForm.get('priceListId')?.value;

    // 1. Check for Duplication
    const isDuplicate = this.items.controls.some((ctrl, i) => {
      return i !== index && ctrl.get('productId')?.value === product.id;
    });

    if (isDuplicate) {
      // Show Warning Dialog
      this.dialog.open(StatusDialogComponent, {
        width: '400px',
        data: {
          status: 'warning',
          title: 'Duplicate Product',
          message: `Product "${product.name}" is already added to the list.`
        }
      });

      // Clear the current row's selection
      row.patchValue({
        productId: null,
        productSearch: '',
        unit: '',
        price: 0
      });
      return;
    }

    // 2. If not duplicate, proceed with patching values
    row.patchValue({
      productId: product.id,
      productSearch: product.name,
      unit: product.unit,
      price: product.price
    });

    if (priceListId) {
      this.inventoryService.getProductRate(product.id, priceListId).subscribe((res: any) => {
        if (res && res.rate) {
          row.patchValue({ price: res.rate });
        }
        this.updateTotal(index);
      });
    } else {
      this.updateTotal(index);
    }
  }

  updateTotal(index: number) {
    const row = this.items.at(index);
    const qty = row.get('qty')?.value || 0;
    const price = row.get('price')?.value || 0;
    const disc = row.get('discountPercent')?.value || 0;
    const gst = row.get('gstPercent')?.value || 0;

    const amountAfterDisc = (qty * price) * (1 - disc / 100);
    const taxAmt = amountAfterDisc * (gst / 100);
    const finalTotal = amountAfterDisc + taxAmt;

    row.patchValue({
      taxAmount: taxAmt.toFixed(2),
      total: finalTotal.toFixed(2),
      amount: amountAfterDisc
    }, { emitEvent: false });

    this.calculateGrandTotal();
  }

  calculateGrandTotal(): void {
    let tax = 0;
    let grand = 0;
    this.items.controls.forEach(c => {
      tax += Number(c.get('taxAmount')?.value || 0);
      grand += Number(c.get('total')?.value || 0);
    });
    this.totalTaxAmount = tax;
    this.grandTotal = grand;
    this.cdr.detectChanges();
  }

  addRow(): void {
    const row = this.fb.group({
      productSearch: ['', Validators.required],
      productId: [null, Validators.required],
      qty: [1, [Validators.required, Validators.min(1)]],
      unit: [{ value: '', disabled: true }],
      price: [0, Validators.required],
      discountPercent: [0],
      gstPercent: [0],
      taxAmount: [{ value: 0, disabled: true }],
      total: [{ value: 0, disabled: true }],
      amount: [0]
    });

    this.items.push(row);
    this.isProductLoading[this.items.length - 1] = false;
    this.setupFilter(this.items.length - 1);
  }

  private setupFilter(index: number): void {
    const row = this.items.at(index);
    this.filteredProducts[index] = row.get('productSearch')!.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(value => {
        const str = typeof value === 'string' ? value : value?.name;
        if (!str || str.length < 2) return of([]);

        this.isProductLoading[index] = true;
        return this.productService.searchProducts(str).pipe(
          finalize(() => {
            this.isProductLoading[index] = false;
            this.cdr.detectChanges();
          }),
          catchError(() => {
            this.isProductLoading[index] = false;
            return of([]);
          })
        );
      }),
      takeUntil(this.destroy$)
    );
  }

  displayProductFn(product: any): string {
    return product?.name || (typeof product === 'string' ? product : '');
  }

  removeItem(index: number): void {
    if (this.items.length > 1) {
      this.items.removeAt(index);
      this.isProductLoading.splice(index, 1);
      this.filteredProducts.splice(index, 1);
      this.calculateGrandTotal();
    }
  }

  openSupplierModal() {
    const dialogRef = this.dialog.open(SupplierModalComponent, { width: '500px' });
    dialogRef.afterClosed().subscribe((newSupplier) => {
      if (newSupplier) {
        this.suppliers = [...this.suppliers, newSupplier];
        this.poForm.patchValue({ supplierId: newSupplier.id });
        this.onSupplierChange(newSupplier.id);
      }
    });
  }

  loadNextPoNumber() {
    this.inventoryService.getNextPoNumber().subscribe(res => this.poForm.patchValue({ PoNumber: res.poNumber }));
  }

  loadSuppliers() {
    this.supplierService.getSuppliers().subscribe(data => this.suppliers = data);
  }

  loadAllPriceLists() {
    this.inventoryService.getPriceLists().subscribe(data => this.priceLists = data);
  }

  saveDraft() {
    if (this.poForm.invalid) {
      this.poForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const currentUserId = localStorage.getItem('userId') || '00000000-0000-0000-0000-000000000000';
    const formValue = this.poForm.getRawValue();

    const payload: PurchaseOrderPayload = {
      supplierId: formValue.supplierId,
      supplierName: this.suppliers.find(s => s.id === formValue.supplierId)?.name || '',
      priceListId: formValue.priceListId,
      poDate: formValue.poDate,
      expectedDeliveryDate: formValue.expectedDeliveryDate,
      remarks: formValue.remarks,
      poNumber: formValue.PoNumber, 
      createdBy: currentUserId, 
      totalTax: Number(this.totalTaxAmount || 0), 
      grandTotal: Number(this.grandTotal || 0),   

      items: formValue.items.map((item: any) => ({
        productId: item.productId, 
        qty: Number(item.qty),     
        unit: item.unit,           
        rate: Number(item.price),  
        discountPercent: Number(item.discountPercent || 0),
        gstPercent: Number(item.gstPercent || 0),
        taxAmount: Number(item.taxAmount || 0),
        total: Number(item.total)  
      }))
    };

    this.inventoryService.savePoDraft(payload).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success) {
          const dialogRef = this.dialog.open(StatusDialogComponent, {
            width: '400px',
            data: {
              status: 'success',
              title: 'Success',
              message: res.message || 'Purchase Order Draft Saved Successfully'
            }
          });

          dialogRef.afterClosed().subscribe(() => {
            this.router.navigate(['/inventory/po-list']);
          });
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.dialog.open(StatusDialogComponent, {
          width: '400px',
          data: {
            status: 'error',
            title: 'Error',
            message: err.error?.message || 'Something went wrong while saving PO'
          }
        });
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}