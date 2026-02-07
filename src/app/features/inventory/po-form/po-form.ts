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
  isEditMode: boolean = false;
  private refillData: any = null;

  constructor() {
    // Redirection se aane wala data pakadne ke liye
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
      this.poId = id;
      this.isEditMode = true;
      this.loadPODetails(id);
    } else if (this.refillData) {
      // Dashboard redirection wala case
      this.isEditMode = false;
      this.loadNextPoNumber();
      this.addRefillRow(this.refillData);
    } else {
      this.isEditMode = false;
      this.loadNextPoNumber();
      this.addRow();
    }
  }

  // NAYA METHOD: Dashboard data ko row mein convert karne ke liye
  private addRefillRow(data: any) {
    const index = this.items.length;
    const row = this.fb.group({
      productSearch: [data.productName, Validators.required],
      productId: [data.productId, Validators.required],
      qty: [data.suggestedQty || 10, [Validators.required, Validators.min(1)]],
      unit: [{ value: data.unit || 'PCS', disabled: false }], 
      price: [data.rate || 0, [Validators.required, Validators.min(1)]],
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

    // Auto-rate fetch logic if Price List exists
    const pListId = this.poForm.get('priceListId')?.value;
    if (pListId && data.productId) {
      this.inventoryService.getProductRate(data.productId, pListId).subscribe({
        next: (res: any) => {
          if (res) {
            row.patchValue({
              price: res.recommendedRate || res.rate,
              gstPercent: res.gstPercent || data.gstPercent,
              unit: res.unit || data.unit
            });
          }
          this.updateTotal(index);
        },
        error: () => {
          this.updateTotal(index);
        }
      });
    } else {
      this.updateTotal(index);
    }
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
          remarks: res.remarks || ''
        });
        const itemsArray = this.items;
        itemsArray.clear();
        if (res.items) {
          res.items.forEach((item: any, idx: number) => this.addEditRow(item, idx));
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
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
      remarks: ['', Validators.required],
      items: this.fb.array([])
    });
  }

  addEditRow(item: any, index: number): void {
    const row = this.fb.group({
      productSearch: [item.productName, Validators.required],
      productId: [item.productId, Validators.required],
      qty: [item.qty, [Validators.required, Validators.min(1)]],
      unit: [item.unit || 'PCS', Validators.required],
      price: [item.rate, [Validators.required, Validators.min(1)]],
      discountPercent: [item.discountPercent || 0],
      gstPercent: [item.gstPercent || 0],
      taxAmount: [{ value: item.taxAmount, disabled: true }],
      total: [{ value: item.total, disabled: true }],
      id: [item.id || 0]
    });
    this.items.push(row);
    this.setupFilter(index);
    this.updateTotal(index);
  }

  get items(): FormArray {
    return this.poForm.get('items') as FormArray;
  }

  onSupplierChange(supplierId: number): void {
    if (!supplierId) return;
    this.supplierService.getSupplierById(supplierId).subscribe((res: any) => {
      if (res.defaultpricelistId) {
        this.poForm.get('priceListId')?.setValue(res.defaultpricelistId);
        this.isPriceListAutoSelected = true;
        this.refreshAllItemRates(res.defaultpricelistId);
      }
      this.cdr.detectChanges();
    });
  }

  refreshAllItemRates(priceListId: string) {
    this.items.controls.forEach((control, index) => {
      const prodId = control.get('productId')?.value;
      if (prodId && priceListId) {
        this.poService.getProductRate(prodId, priceListId).subscribe({
          next: (res: any) => {
            if (res) {
              control.patchValue({ price: res.recommendedRate || res.rate, gstPercent: res.gstPercent });
            }
            this.updateTotal(index);
          },
          error: () => this.updateTotal(index)
        });
      }
    });
  }

  onProductChange(index: number, event: any): void {
    const product = event.option.value;
    const row = this.items.at(index);
    const priceListId = this.poForm.get('priceListId')?.value;

    if (!product) return;

    const isDuplicate = this.items.controls.some((ctrl, i) => i !== index && ctrl.get('productId')?.value === product.id);
    if (isDuplicate) {
      this.notification.showStatus(false, `Product already added.`);
      row.patchValue({ productId: null, productSearch: '' });
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

    if (product.id && priceListId) {
      this.inventoryService.getProductRate(product.id, priceListId).subscribe({
        next: (res: any) => {
          if (res) {
            row.patchValue({ price: res.recommendedRate || res.rate, gstPercent: res.gstPercent });
          }
          this.updateTotal(index);
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
    const taxableAmount = amount - (amount * discPercent / 100);
    const taxAmt = (taxableAmount * gstPercent) / 100;
    const rowTotal = taxableAmount + taxAmt;

    row.patchValue({ taxAmount: taxAmt.toFixed(2), total: rowTotal.toFixed(2) }, { emitEvent: false });
    this.calculateGrandTotal();
  }

  calculateGrandTotal(): void {
    let totalTax = 0, totalWithTax = 0;
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
      unit: ['PCS', Validators.required],
      price: [0, [Validators.required, Validators.min(1)]],
      discountPercent: [0],
      gstPercent: [0],
      taxAmount: [{ value: 0, disabled: true }],
      total: [{ value: 0, disabled: true }],
      id: [0]
    });
    this.items.push(row);
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
          finalize(() => this.isProductLoading[index] = false),
          catchError(() => of([]))
        );
      }),
      takeUntil(this.destroy$)
    );
  }

  displayProductFn(p: any): string { return p?.name || (typeof p === 'string' ? p : ''); }

  removeItem(index: number): void {
    if (this.items.length > 1) {
      this.items.removeAt(index);
      this.calculateGrandTotal();
    }
  }

  openSupplierModal() {
    this.dialog.open(SupplierModalComponent, { width: '500px' }).afterClosed().subscribe(res => {
      if (res) {
        this.suppliers.push(res);
        this.poForm.patchValue({ supplierId: res.id });
        this.onSupplierChange(res.id);
      }
    });
  }

  loadNextPoNumber() { this.inventoryService.getNextPoNumber().subscribe(res => this.poForm.patchValue({ PoNumber: res.poNumber })); }
  loadSuppliers() { this.supplierService.getSuppliers().subscribe(data => this.suppliers = data); }
  loadAllPriceLists() { this.inventoryService.getPriceLists().subscribe(data => this.priceLists = data); }
  ngOnDestroy() { this.destroy$.next(); this.destroy$.complete(); }

  saveDraft() {
    const formValue = this.poForm.getRawValue();

    if (formValue.expectedDeliveryDate) {
      const poDate = new Date(formValue.poDate);
      const deliveryDate = new Date(formValue.expectedDeliveryDate);
      poDate.setHours(0, 0, 0, 0);
      deliveryDate.setHours(0, 0, 0, 0);

      if (deliveryDate < poDate) {
        this.notification.showStatus(false, 'Expected Delivery Date must be greater than or equal to PO Date.');
        return;
      }
    }

    const hasZeroPrice = formValue.items.some((item: any) => Number(item.price) <= 0);

    if (this.poForm.invalid || hasZeroPrice) {
      this.notification.showStatus(false, hasZeroPrice ? 'Rate must be greater than 0.' : 'Please fill all required fields.');
      return;
    }

    const supplier = this.suppliers.find(s => s.id === Number(formValue.supplierId));
    const userId = localStorage.getItem('email') || 'System User';
    this.isLoading = true;
    const payload: any = {
      id: this.isEditMode ? Number(this.poId) : 0,
      supplierId: Number(formValue.supplierId),
      supplierName: supplier ? supplier.name : 'Unknown',
      priceListId: formValue.priceListId,
      poDate: DateHelper.toLocalISOString(formValue.poDate),
      poNumber: formValue.PoNumber,
      remarks: formValue.remarks || 'No remarks provided',
      createdBy: userId,
      grandTotal: this.grandTotal,
      status: 'Draft',
      items: formValue.items.map((item: any) => ({
        productId: item.productId,
        qty: Number(item.qty),
        unit: item.unit || 'PCS',
        rate: Number(item.price),
        gstPercent: Number(item.gstPercent),
        discountPercent: Number(item.discountPercent),
        taxAmount: Number(item.taxAmount),
        total: Number(item.total)
      }))
    };

    const request$ = this.isEditMode ? this.poService.update(this.poId, payload) : this.inventoryService.savePoDraft(payload);
    request$.subscribe({
      next: () => {
        this.isLoading = false;
        this.notification.showStatus(true, 'PO Saved Successfully');
        this.router.navigate(['/app/inventory/polist']);
      },
      error: (err) => {
        this.isLoading = false;
        this.notification.showStatus(false, err.error?.message || 'Error saving PO.');
      }
    });
  }
}