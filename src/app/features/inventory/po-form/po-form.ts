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
  currentStatus = '';
  lineItems: any[] = [];
  isEditMode: boolean = false;
  private refillData: any = null;

  bulkItemsToLoad: any[] = [];

  constructor() {
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras.state) {
      this.refillData = navigation.extras.state['refillData'];

    }
  }


  ngOnInit(): void {

    const id = this.route.snapshot.paramMap.get('id');
    this.initForm();
    this.loadSuppliers();
    this.loadAllPriceLists();

    if (id && id !== '0') {
      // --- Edit Mode ---
      this.poId = id;
      this.isEditMode = true;
      this.loadPODetails(id);
    } else if (this.refillData) {
      // --- Refill Mode (From Dashboard) ---
      this.isEditMode = false;
      this.loadNextPoNumber();



      // 2. Table Row add karein (Product, Rate, Unit)
      this.addRefillRow(this.refillData);

    } else {
      // --- Fresh Entry Mode ---
      this.isEditMode = false;
      this.loadNextPoNumber();
      this.addRow();
      this.cdr.detectChanges();
    }
  }


  // NEW METHOD: Handle automatic refill from dashboard
  private addRefillRow(data: any) {
    const index = this.items.length;
    const row = this.fb.group({
      productSearch: [data.productName, Validators.required],
      productId: [data.productId, Validators.required],
      qty: [data.suggestedQty || 10, [Validators.required, Validators.min(1)]],
      unit: [{ value: data.unit || 'PCS', disabled: true }],
      price: [data.rate || 0, Validators.required],
      discountPercent: [0],
      gstPercent: [data.gstPercent || 18],
      taxAmount: [{ value: 0, disabled: true }],
      total: [{ value: 0, disabled: true }],
      amount: [0],
      id: [0]
    });

    this.items.push(row);
    this.isProductLoading[index] = false;
    this.setupFilter(index);
    this.updateTotal(index);
    this.poForm.updateValueAndValidity();
    this.cdr.detectChanges();
  }

  loadPODetails(id: any) {
    this.isLoading = true;
    this.poService.getById(id).subscribe({
      next: (res: any) => {
        this.currentStatus = res.status;
        this.poForm.patchValue({
          supplierId: res.supplierId,
          priceListId: res.priceListId,
          PoNumber: res.poNumber,
          poDate: DateHelper.toDateObject(res.poDate),
          expectedDeliveryDate: DateHelper.toDateObject(res.expectedDeliveryDate),
          status: res.status,
          remarks: res.remarks,
          totalTaxAmount: res.totalTax,
          grandTotal: res.grandTotal
        });

        const itemsArray = this.poForm.get('items') as FormArray;
        itemsArray.clear();

        if (res.items && res.items.length > 0) {
          res.items.forEach((item: any, idx: number) => {
            this.addEditRow(item, idx);
          });
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
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
        this.poForm.patchValue({
          supplierId: res.supplierId,
          priceListId: res.priceListId,
          poDate: new Date(res.poDate),
          expectedDeliveryDate: res.expectedDeliveryDate ? new Date(res.expectedDeliveryDate) : null,
          PoNumber: res.poNo || res.poNumber,
          remarks: res.remarks
        });

        this.items.clear();
        if (res.items && res.items.length > 0) {
          res.items.forEach((item: any, index: number) => {
            this.addEditRow(item, index);
          });
        }
        this.calculateGrandTotal();
        this.cdr.detectChanges();
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
      id: [item.id || 0]
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
        this.cdr.detectChanges();
      } else {
        this.poForm.patchValue({ priceListId: null });
        this.isPriceListAutoSelected = false;
        this.cdr.detectChanges();
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
            this.cdr.detectChanges();
          }
        });
      }
    });
  }

  onProductChange(index: number, event: any): void {
    const product = event.option.value;
    const row = this.items.at(index);
    const priceListId = this.poForm.get('priceListId')?.value;
 
    if (!product) return;

    const displayName = product.productName || product.name || 'Unknown Product';

    const isDuplicate = this.items.controls.some((ctrl, i) => {
      return i !== index && ctrl.get('productId')?.value === product.id;
    });

    if (isDuplicate) {
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

    row.patchValue({
      productId: product.id,
      productSearch: product,
      unit: product.unit || 'PCS',
      price: product.basePurchasePrice || 0,
      gstPercent: product.defaultGst || 0,
      qty: 1
    });

    if (product.id) {
      console.log('Product ID:', product.id, 'Price List ID:', priceListId); 
      this.inventoryService.getProductRate(product.id, priceListId).subscribe({
        next: (res: any) => {
          if (res) {
            row.patchValue({
              price: res.recommendedRate,
              gstPercent: res.gstPercent,
              unit: res.unit || product.unit
            }, { emitEvent: false });
          }
          this.updateTotal(index);
          this.cdr.detectChanges();
        },
        error: () => this.updateTotal(index)
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

    const amount = qty * price;
    const discountAmt = (amount * discPercent) / 100;
    const taxableAmount = amount - discountAmt;
    const taxAmt = (taxableAmount * gstPercent) / 100;
    const rowTotal = taxableAmount + taxAmt;

    row.patchValue({
      taxAmount: taxAmt.toFixed(2),
      total: rowTotal.toFixed(2)
    }, { emitEvent: false });

    this.calculateGrandTotal();
    this.cdr.detectChanges();
  }

  calculateGrandTotal(): void {
    let totalTax = 0;
    let totalWithTax = 0;

    this.items.controls.forEach(c => {
      totalTax += Number(c.get('taxAmount')?.value || 0);
      totalWithTax += Number(c.get('total')?.value || 0);
    });

    this.totalTaxAmount = Number(totalTax.toFixed(2));
    this.grandTotal = Number(totalWithTax.toFixed(2));
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
    const idx = this.items.length - 1;
    this.isProductLoading[idx] = false;
    this.setupFilter(idx);
    this.cdr.detectChanges();
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
          catchError(() => of([]))
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
    this.cdr.detectChanges();
  }

  loadSuppliers() {
    this.supplierService.getSuppliers().subscribe(data => this.suppliers = data);
    this.cdr.detectChanges();
  }

  loadAllPriceLists() {
    this.inventoryService.getPriceLists().subscribe(data => this.priceLists = data);
    this.cdr.detectChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  saveDraft() {
    const formValue = this.poForm.getRawValue();
    if (!this.notification.isValidDeliveryDate(formValue.poDate, formValue.expectedDeliveryDate)) {
      this.notification.showStatus(false, 'Expected Delivery Date cannot be earlier than PO Date.');
      return;
    }

    if (!formValue.items || formValue.items.length === 0) {
      this.notification.showStatus(false, 'Please add at least one product.');
      return;
    }

    if (this.poForm.invalid) {
      this.poForm.markAllAsTouched();
      this.notification.showStatus(false, 'Please fill all required fields correctly.');
      return;
    }

    this.isLoading = true;
    const currentUserId = localStorage.getItem('userId') || '00000000-0000-0000-0000-000000000000';

    const payload: any = {
      id: this.isEditMode ? Number(this.poId) : 0,
      supplierId: Number(formValue.supplierId),
      supplierName: this.suppliers.find(s => s.id === formValue.supplierId)?.name || '',
      priceListId: formValue.priceListId,
      poDate: DateHelper.toLocalISOString(formValue.poDate),
      expectedDeliveryDate: DateHelper.toLocalISOString(formValue.expectedDeliveryDate),
      remarks: formValue.remarks || '',
      poNumber: formValue.PoNumber,
      createdBy: currentUserId,
      totalTax: Number(this.totalTaxAmount || 0),
      grandTotal: Number(this.grandTotal || 0),
      subTotal: Number((this.grandTotal - this.totalTaxAmount).toFixed(2)) || 0,
      status: 'Draft',
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

    const request$ = this.isEditMode
      ? this.poService.update(this.poId, payload)
      : this.inventoryService.savePoDraft(payload);

    request$.subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res) {
          if (this.isEditMode && this.currentStatus === 'Rejected') {
            this.inventoryService.updatePOStatus(this.poId, 'Draft').subscribe();
          }
          this.notification.showStatus(true, this.isEditMode ? 'Updated Successfully' : 'Saved Successfully');
          this.router.navigate(['/app/inventory/polist']);
          this.cdr.detectChanges();
        }
      },
      error: (err: any) => {
        this.isLoading = false;
        this.notification.showStatus(false, err.error?.message || 'Server connection error');
      }
    });
  }
}