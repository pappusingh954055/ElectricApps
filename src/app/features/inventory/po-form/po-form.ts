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

import { POService } from '../service/po.service';
import { DateHelper } from '../../../shared/models/date-helper';
import { NotificationService } from '../../shared/notification.service';

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
  private notification = inject(NotificationService);

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
        console.log('PO Details Loaded:', res);

        // 1. Header fields mapping
        this.poForm.patchValue({
          supplierId: res.supplierId,
          priceListId: res.priceListId,
          PoNumber: res.poNumber,
          poDate: DateHelper.toDateObject(res.poDate),
          expectedDeliveryDate: DateHelper.toDateObject(res.expectedDeliveryDate),
          status: res.status,
          remarks: res.remarks,
          // Ensure these names match your FormGroup controls
          totalTaxAmount: res.totalTax,
          grandTotal: res.grandTotal
        });

        // 2. FormArray (Items) population
        const itemsArray = this.poForm.get('items') as FormArray;
        itemsArray.clear();

        if (res.items && res.items.length > 0) {
          res.items.forEach((item: any) => {
            const itemGroup = this.fb.group({
              // VERY IMPORTANT: ID field zaroori hai update ke liye
              id: [item.id || 0],

              productSearch: [item.productName],
              productId: [item.productId],
              qty: [item.qty],
              unit: [item.unit],
              price: [item.rate], // Backend 'rate' -> UI 'price'
              discountPercent: [item.discountPercent || 0],
              gstPercent: [item.gstPercent || 0],
              taxAmount: [item.taxAmount || 0],
              total: [item.total || 0]
            });

            itemsArray.push(itemGroup);
          });
        }

        // 3. Update local variables for UI display
        this.grandTotal = res.grandTotal;
        this.totalTaxAmount = res.totalTax;

        // Spinner stop
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading PO:', err);
        this.isLoading = false;
        this.notification.showStatus(false, 'Failed to load order details');
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
        this.notification.showStatus(false, 'Failed to load PO details');
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

    // Debugging logs
    console.log("1. Selected Product Object:", product);

    if (!product) return;

    // Fix: Safe Name extraction taaki popup mein 'undefined' na aaye
    const displayName = product.productName || product.name || 'Unknown Product';

    // 1. Duplicate Check
    const isDuplicate = this.items.controls.some((ctrl, i) => {
      return i !== index && ctrl.get('productId')?.value === product.id;
    });

    if (isDuplicate) {
      console.warn("Duplicate product detected!");
      // Ab yahan 'undefined' nahi dikhayega
      this.notification.showStatus(false, `Product "${displayName}" is already added.`);

      row.patchValue({
        productId: null,
        productSearch: '',
        unit: '',
        price: 0,
        gstPercent: 0,
        total: 0
      });
      return;
    }

    // 2. Initial Mapping
    // Note: 'productSearch' mein poora 'product' object daala hai taaki selection gayab na ho
    row.patchValue({
      productId: product.id,
      productSearch: product,
      unit: product.unit || 'PCS',
      price: product.basePurchasePrice || 0,
      gstPercent: product.defaultGst || 0,
      qty: 1 // Default quantity set kar rahe hain
    });

    // 3. Price Fetching Logic (Backend Fallback Integration)
    if (product.id) {
      this.inventoryService.getProductRate(product.id, priceListId).subscribe({
        next: (res: any) => {
          console.log("4. API Response:", res);

          if (res) {
            row.patchValue({
              // 'recommendedRate' automatically price list ya base price pick karega
              price: res.recommendedRate,
              gstPercent: res.gstPercent,
              unit: res.unit || product.unit
            }, { emitEvent: false });
          }

          // Calculation trigger karein
          this.updateTotal(index);
        },
        error: (err) => {
          console.error("6. Rate fetch failed:", err);
          this.updateTotal(index);
        }
      });
    } else {
      this.updateTotal(index);
    }
  }
  updateTotal(index: number): void {
    const row = this.items.at(index);
    const qty = Number(row.get('qty')?.value || 0);
    const price = Number(row.get('price')?.value || 0);
    const discPercent = Number(row.get('discountPercent')?.value || 0);
    const gstPercent = Number(row.get('gstPercent')?.value || 0);

    // Step 1: Basic Amount
    const amount = qty * price;

    // Step 2: Discount
    const discountAmt = (amount * discPercent) / 100;
    const taxableAmount = amount - discountAmt;

    // Step 3: Tax Calculation
    const taxAmt = (taxableAmount * gstPercent) / 100;

    // Step 4: Row Total (Taxable + Tax)
    const rowTotal = taxableAmount + taxAmt;

    row.patchValue({
      taxAmount: taxAmt.toFixed(2),
      total: rowTotal.toFixed(2) // Yahan tax add hona zaroori hai
    }, { emitEvent: false });

    this.calculateGrandTotal();
  }

  calculateGrandTotal(): void {
    let totalTax = 0;
    let totalWithTax = 0;

    this.items.controls.forEach(c => {
      const rowTax = Number(c.get('taxAmount')?.value || 0);
      const rowTotal = Number(c.get('total')?.value || 0);

      totalTax += rowTax;
      totalWithTax += rowTotal;
    });

    // Final State Updates
    this.totalTaxAmount = Number(totalTax.toFixed(2));
    this.grandTotal = Number(totalWithTax.toFixed(2));

    // Change Detection manually trigger karein
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




  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  saveDraft() {
    // 1. Sabse pehle raw values uthaein
    const formValue = this.poForm.getRawValue();

    // 2. STAGE 1: Date Validation
    const isDateValid = this.notification.isValidDeliveryDate(formValue.poDate, formValue.expectedDeliveryDate);

    if (!isDateValid) {
      console.error('Validation Blocked: Invalid Date');
      this.notification.showStatus(false, 'Expected Delivery Date cannot be earlier than PO Date.');
      return; // <--- YEH ZAROORI HAI: Iske niche wala koi code nahi chalega
    }

    // 3. STAGE 2: Items Array Validation
    // Screenshot mein items array empty hai, isliye hum strictly check karenge
    const hasItems = formValue.items && formValue.items.length > 0;

    if (!hasItems) {
      console.error('Validation Blocked: No Items Found');
      this.notification.showStatus(false, 'Please add at least one product to the Purchase Order.');
      return; // <--- YEH ZAROORI HAI: API call ko yahi stop karega
    }

    // 4. STAGE 3: Form Controls Validation
    if (this.poForm.invalid) {
      this.poForm.markAllAsTouched();
      this.notification.showStatus(false, 'Please fill all required fields correctly.');
      return; // <--- Stop if form is invalid
    }

    // 5. STAGE 4: Final Processing (Sirf tabhi chalega jab upar ke 3 stages pass honge)
    this.isLoading = true;

    const currentUserId = localStorage.getItem('userId') || '00000000-0000-0000-0000-000000000000';

    const payload: any = {
      id: this.isEditMode ? Number(this.poId) : 0,
      supplierId: Number(formValue.supplierId),
      supplierName: this.suppliers.find(s => s.id === formValue.supplierId)?.name || '',
      priceListId: formValue.priceListId,
      priceList: { id: formValue.priceListId },
      poDate: DateHelper.toLocalISOString(formValue.poDate),
      expectedDeliveryDate: DateHelper.toLocalISOString(formValue.expectedDeliveryDate),
      remarks: formValue.remarks || '',
      poNumber: formValue.PoNumber,
      createdBy: currentUserId,
      updatedBy: currentUserId,
      totalTax: Number(this.totalTaxAmount || 0),
      grandTotal: Number(this.grandTotal || 0),
      items: formValue.items.map((item: any) => ({
        id: Number(item.id || 0),
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

    console.log('API Request Triggered with Payload:', payload);

    const request$ = this.isEditMode
      ? this.poService.update(this.poId, payload)
      : this.inventoryService.savePoDraft(payload);

    request$.subscribe({
      next: (res: any) => {
        this.isLoading = false;
        const isSuccess = res !== null && res !== false && res !== undefined;

        if (isSuccess) {
          const successMsg = this.isEditMode ? 'Updated Successfully' : 'Saved Successfully';
          this.notification.showStatus(true, successMsg);
          this.router.navigate(['/app/inventory/polist']);
        } else {
          this.notification.showStatus(false, res?.message || 'Transaction failed');
        }
      },
      error: (err: any) => {
        this.isLoading = false;
        this.notification.showStatus(false, err.error?.message || 'Server connection error');
      }
    });
  }
}