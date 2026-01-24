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
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService } from '../../master/product/service/product.service';
import { StatusDialogComponent } from '../../../shared/components/status-dialog-component/status-dialog-component';
import { PurchaseOrderPayload } from '../models/purchaseorder.model';
import { POService } from '../service/po.service';

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
  private poService = inject(POService);
  private router = inject(Router);
  private destroy$ = new Subject<void>();
  private route = inject(ActivatedRoute);

  isPriceListAutoSelected = false;
  filteredProducts: Observable<any[]>[] = [];
  isProductLoading: boolean[] = [];
  suppliers: Supplier[] = [];
  priceLists: any[] = [];
  isLoading = false;
  grandTotal = 0;
  totalTaxAmount = 0;
  poForm!: FormGroup;


  poId!: any;

  lineItems: any[] = [];
  isEditMode: boolean = false;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    // FIX: Agar id '0' hai aur aapka API use support nahi karta,
    // toh use tabhi call karein jab id 0 se badi ho.
    if (id && id !== '0') {
      this.poId = id;
      this.isEditMode = true;
      this.loadPODetails(id);
    } else {
      this.isEditMode = false;
      this.poId = null;
    }

    this.initForm();
    this.loadSuppliers();
    this.loadAllPriceLists();

    // Route state se check karein ki data Edit ke liye aaya hai ya nahi
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras.state as { data: any, mode: string };

    if (state && state.mode === 'edit') {
      this.isEditMode = true;
      this.poId = state.data.id;
      this.loadPODataForEdit(this.poId);
    } else {
      this.loadNextPoNumber();
      this.addRow(); // Initial empty row for New PO
    }
  }

  loadPODetails(id: any) {
    this.isLoading = true;
    this.poService.getById(id).subscribe({
      next: (res: any) => {
        console.log('PO Details Loaded items:', res);
        // 1. Header fields (Supplier, PO Number, Date, Remarks) ko patch karein
        this.poForm.patchValue({
          supplierId: res.supplierId,
          priceListId: res.priceListId,
          PoNumber: res.poNumber,
          poDate: res.poDate,
          expectedDeliveryDate: res.expectedDeliveryDate,
          remarks: res.remarks,
          totalTaxAmount: res.totalTax,
          grandTotal: res.grandTotal
        });

        // 2. FormArray (Items) ko populate karein
        const itemsArray = this.poForm.get('items') as FormArray;
        itemsArray.clear(); // Purana data saaf karein

        if (res.items && res.items.length > 0) {
          res.items.forEach((item: any) => {
            // Naya group banayein aur backend values map karein
            const itemGroup = this.fb.group({
              productSearch: [item.productName], // displayProductFn ke liye
              productId: [item.productId],
              qty: [item.qty],
              unit: [item.unit],
              price: [item.rate], // API mein 'rate' hai, control mein 'rate'
              discountPercent: [item.discountPercent],
              gstPercent: [item.gstPercent],
              taxAmount: [item.taxAmount],
              total: [item.total]
            });

            itemsArray.push(itemGroup);
          });
        }

        // 3. Totals update karein
        this.grandTotal = res.grandTotal;
        this.totalTaxAmount = res.totalTax;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading PO:', err);
        this.isLoading = false;
      }
    });
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

  loadPODataForEdit(id: number): void {
    this.isLoading = true;
    this.poService.getById(id).pipe(
      finalize(() => {
        this.isLoading = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (res: any) => {
        // Header Patching
        this.poForm.patchValue({
          supplierId: res.supplierId,
          priceListId: res.priceListId,
          poDate: new Date(res.poDate),
          expectedDeliveryDate: res.expectedDeliveryDate ? new Date(res.expectedDeliveryDate) : null,
          PoNumber: res.poNo || res.poNumber,
          remarks: res.remarks
        });

        // Items Patching
        this.items.clear();
        if (res.items && res.items.length > 0) {
          res.items.forEach((item: any, index: number) => {
            this.addEditRow(item, index);
          });
        }
        this.calculateGrandTotal();
      },
      error: (err) => {
        this.showStatusPopup('error', 'Error', 'Failed to load PO details');
      }
    });
  }

  addEditRow(item: any, index: number): void {
    const row = this.fb.group({
      productSearch: [item.productName, Validators.required],
      productId: [item.productId, Validators.required],
      qty: [item.qty, [Validators.required, Validators.min(1)]],
      unit: [{ value: item.unit, disabled: true }],
      price: [item.rate, Validators.required],
      discountPercent: [item.discountPercent || 0],
      gstPercent: [item.gstPercent || 0],
      taxAmount: [{ value: item.taxAmount, disabled: true }],
      total: [{ value: item.total, disabled: true }],
      amount: [item.qty * item.rate],
      id: [item.id || 0] // Primary key for Child table
    });

    this.items.push(row);
    this.isProductLoading[index] = false;
    this.setupFilter(index);
    this.updateTotal(index);
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

  onProductChange(index: number, event: any): void {
    const product = event.option.value;
    const row = this.items.at(index);
    const priceListId = this.poForm.get('priceListId')?.value;

    const isDuplicate = this.items.controls.some((ctrl, i) => {
      return i !== index && ctrl.get('productId')?.value === product.id;
    });

    if (isDuplicate) {
      this.showStatusPopup('warning', 'Duplicate Product', `Product "${product.name}" is already added.`);
      row.patchValue({ productId: null, productSearch: '', unit: '', price: 0 });
      return;
    }

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
    this.totalTaxAmount = Number(tax.toFixed(2));
    this.grandTotal = Number(grand.toFixed(2));
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
      amount: [0],
      id: [0]
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


  // Common Status Popup Helper
  private showStatusPopup(status: string, title: string, message: string) {
    this.dialog.open(StatusDialogComponent, {
      width: '400px',
      data: { status, title, message }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  saveDraft() {
    if (this.poForm.invalid) {
      this.poForm.markAllAsTouched();
      return;
    }

    // ExpressionChangedAfterItHasBeenCheckedError se bachne ke liye
    this.isLoading = true;

    const currentUserId = localStorage.getItem('userId') || '00000000-0000-0000-0000-000000000000';
    const formValue = this.poForm.getRawValue();

    // Payload structure as per backend UpdatePurchaseOrderDto
    const payload: any = {
      // URL mein 4 ja raha hai toh yahan bhi numeric 4 hona chahiye
      id: this.isEditMode ? Number(this.poId) : 0,
      supplierId: Number(formValue.supplierId),
      supplierName: this.suppliers.find(s => s.id === formValue.supplierId)?.name || '',
      priceListId: Number(formValue.priceListId),
      poDate: formValue.poDate,
      expectedDeliveryDate: formValue.expectedDeliveryDate,
      remarks: formValue.remarks || '',
      poNumber: formValue.PoNumber, // Backend property name check karein (P capital or small)
      createdBy: currentUserId,
      totalTax: Number(this.totalTaxAmount || 0),
      grandTotal: Number(this.grandTotal || 0),

      items: formValue.items.map((item: any) => ({
        id: Number(item.id || 0), // Existing item update ke liye ID zaroori hai
        productId: item.productId, // Guid format
        qty: Number(item.qty),
        unit: item.unit,
        rate: Number(item.price), // Angular 'price' -> Backend 'rate' mapping
        discountPercent: Number(item.discountPercent || 0),
        gstPercent: Number(item.gstPercent || 0),
        taxAmount: Number(item.taxAmount || 0),
        total: Number(item.total)
      }))
    };

    // Debugging: object ko stringify karke dekhein
    console.log("Final JSON Payload:", JSON.stringify(payload));

    const request$ = this.isEditMode
      ? this.poService.update(this.poId, payload) // PUT /api/purchaseorders/4
      : this.inventoryService.savePoDraft(payload);

    request$.subscribe({
      next: (res: any) => {
        this.isLoading = false;
        const msg = this.isEditMode ? 'Updated' : 'Saved';
        this.showStatusPopup('success', 'Success', res.message || `Purchase Order ${msg} Successfully`);
        this.router.navigate(['/app/inventory/po-list']);
      },
      error: (err: any) => {
        this.isLoading = false;
        // Backend validation errors ko console mein dekhein
        console.error("Backend Error Details:", err.error);
        this.showStatusPopup('error', 'Error', err.error?.message || 'Transaction failed');
      }
    });
  }
}