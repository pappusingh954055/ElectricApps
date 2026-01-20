import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MaterialModule } from '../../../shared/material/material/material-module';
import { MatDialog } from '@angular/material/dialog';
import { SupplierModalComponent } from '../supplier-modal/supplier-modal';
import { Supplier, SupplierService } from '../service/supplier.service';
import { InventoryService } from '../service/inventory.service';
import { Observable, of, Subject } from 'rxjs';
import { map, debounceTime, distinctUntilChanged, switchMap, tap, finalize, takeUntil } from 'rxjs/operators';
import { Router } from '@angular/router';
import { StatusDialogComponent } from '../../../shared/components/status-dialog-component/status-dialog-component';

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
  private destroy$ = new Subject<void>();
  private router = inject(Router);

  isPriceListAutoSelected: boolean = false;

  filteredProducts: Observable<any[]>[] = [];
  suppliers: Supplier[] = [];
  priceLists: any[] = []; // NEW: Price list array
  isLoading = false;
  grandTotal: number = 0;
  totalTaxAmount: number = 0; // NEW: Summary calculation
  poForm!: FormGroup;
  loading: boolean = false; 
  
  // Mock products (In real app, fetch from inventoryService)
  products = [
    { id: 1, name: 'Laptop', unit: 'PCS', price: 50000, sku: 'L-001' },
    { id: 2, name: 'Mouse', unit: 'PCS', price: 500, sku: 'M-005' },
    { id: 3, name: 'Keyboard', unit: 'PCS', price: 1200, sku: 'K-002' },
    { id: 4, name: 'Monitor', unit: 'PCS', price: 8500, sku: 'MON-10' }
  ];

  ngOnInit(): void {
    this.initForm();
    this.loadNextPoNumber();
    this.loadSuppliers();
    this.loadAllPriceLists(); // NEW
    this.addRow();
  }

  initForm(): void {
    this.poForm = this.fb.nonNullable.group({
      supplierId: [0, [Validators.required, Validators.min(1)]],
      priceListId: [null], // NEW: PriceList link
      poDate: [new Date(), Validators.required],
      expectedDeliveryDate: [null],
      referenceNumber: [''],
      PoNumber: [{ value: '', disabled: true }, Validators.required],
      remarks: [''],
      items: this.fb.nonNullable.array([])
    });
  }

  get items(): FormArray {
    return this.poForm.get('items') as FormArray;
  }

  // UPDATED: Logic to fetch price list when supplier is selected
  onSupplierChange(supplierId: number): void {
    this.supplierService.getSupplierById(supplierId).subscribe(supplier => {
      if (supplier && supplier.defaultPriceListId) {
        this.poForm.patchValue({ priceListId: supplier.defaultPriceListId });
        // Refresh existing rows if any
        this.refreshAllPrices();
      }
    });
  }

  addRow(): void {
    const row = this.fb.nonNullable.group({
      productSearch: ['', Validators.required],
      productId: [0, Validators.required],
      qty: [1, [Validators.required, Validators.min(1)]],
      unit: [{ value: '', disabled: true }],
      price: [0, [Validators.required, Validators.min(0)]],
      discountPercent: [0, [Validators.min(0), Validators.max(100)]],
      gstPercent: [0, [Validators.min(0), Validators.max(100)]],
      taxAmount: [{ value: 0, disabled: true }], // NEW
      total: [{ value: 0, disabled: true }]
    });

    this.items.push(row);
    const index = this.items.length - 1;
    this.setupFilter(index);
    this.cdr.detectChanges();
  }

  private setupFilter(index: number): void {
    const row = this.items.at(index);
    this.filteredProducts[index] = row.get('productSearch')!.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      tap(() => this.isLoading = true),
      switchMap(value => {
        const searchStr = typeof value === 'string' ? value : value?.name;
        if (!searchStr || searchStr.length < 1) {
          this.isLoading = false;
          return of([]);
        }
        return of(this._filter(searchStr)).pipe(
          finalize(() => this.isLoading = false)
        );
      }),
      takeUntil(this.destroy$)
    );
  }

  private _filter(name: string): any[] {
    const filterValue = name.toLowerCase();
    return this.products.filter(p =>
      p.name.toLowerCase().includes(filterValue) ||
      p.sku.toLowerCase().includes(filterValue)
    );
  }

  // UPDATED: Logic to fetch price from selected PriceList
  onProductChange(index: number, event: any): void {
    const product = event.option.value;
    const row = this.items.at(index);
    const priceListId = this.poForm.get('priceListId')?.value;

    const isDuplicate = this.items.controls.some((c, i) =>
      i !== index && c.get('productId')?.value === product.id
    );

    if (isDuplicate) {
      alert('Product already added!');
      row.get('productSearch')?.setValue('');
      return;
    }

    // Default Patch
    row.patchValue({
      productId: product.id,
      productSearch: product.name,
      unit: product.unit,
      price: product.price
    });

    // If PriceList is active, get specific rate
    if (priceListId) {
      this.inventoryService.getPriceListRate(priceListId, product.id).subscribe(res => {
        if (res) {
          row.patchValue({
            price: res.price,
            discountPercent: res.discountPercent || 0
          });
          this.updateTotal(index);
        }
      });
    } else {
      this.updateTotal(index);
    }
    this.focusInput(index, 'qty');
  }

  // UPDATED: Logic for GST and Discount calculation
  updateTotal(index: number) {
    const row = this.items.at(index);
    const qty = row.get('qty')?.value || 0;
    const price = row.get('price')?.value || 0;
    const disc = row.get('discountPercent')?.value || 0;
    const gst = row.get('gstPercent')?.value || 0;

    const amountAfterDisc = (qty * price) * (1 - disc / 100);
    const taxAmt = amountAfterDisc * (gst / 100);
    const finalTotal = amountAfterDisc + taxAmt;

    row.get('taxAmount')?.setValue(taxAmt.toFixed(2));
    row.get('total')?.setValue(finalTotal.toFixed(2));
    this.calculateGrandTotal();
  }

  calculateGrandTotal() {
    this.grandTotal = 0;
    this.totalTaxAmount = 0;
    this.items.controls.forEach(control => {
      const total = Number(control.get('total')?.value || 0);
      const tax = Number(control.get('taxAmount')?.value || 0);
      this.grandTotal += total;
      this.totalTaxAmount += tax;
    });
  }

  private refreshAllPrices() {
    this.items.controls.forEach((_, i) => {
      const productId = this.items.at(i).get('productId')?.value;
      if (productId) {
         // Trigger individual row update logic here if needed
      }
    });
  }

  addRowFromKeyboard(index: number, event: any): void {
    if (event.key === 'Enter') {
      const row = this.items.at(index);
      if (row.valid) {
        this.addRow();
        setTimeout(() => this.focusInput(this.items.length - 1, 'productSearch'), 50);
      }
    }
  }

  private focusInput(index: number, controlName: string) {
    setTimeout(() => {
        const inputs = document.querySelectorAll(`input[formControlName="${controlName}"]`);
        (inputs[index] as HTMLElement)?.focus();
    }, 10);
  }

  displayProductFn(product: any): string {
    return product?.name ? product.name : (typeof product === 'string' ? product : '');
  }

  removeItem(index: number): void {
    if (this.items.length > 1) {
      this.items.removeAt(index);
      this.filteredProducts.splice(index, 1);
      this.calculateGrandTotal();
    }
  }

  savePo(): void {
    if (this.poForm.invalid) {
      this.poForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.cdr.detectChanges();

    const rawData = this.poForm.getRawValue();
    const payload = {
      ...rawData,
      supplierId: Number(rawData.supplierId),
      items: rawData.items.map((item: any) => ({
        ...item,
        qty: Number(item.qty),
        price: Number(item.price),
        total: Number(item.total)
      }))
    };

    this.inventoryService.createPurchaseOrder(payload).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.cdr.detectChanges();
        this.showStatusModal('Success', 'Purchase Order created successfully!', 'success');
        this.router.navigate(['/app/inventory/po-list']);
      },
      error: (err) => {
        this.isLoading = false;
        this.cdr.detectChanges();
        this.showStatusModal('Error', err.error?.message || 'Failed to save PO', 'error');
      }
    });
  }

  private showStatusModal(title: string, message: string, type: 'success' | 'error') {
    this.dialog.open(StatusDialogComponent, {
      width: '400px',
      data: { title, message, type }
    });
  }

  loadNextPoNumber() {
    this.inventoryService.getNextPoNumber().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => this.poForm.patchValue({ PoNumber: res.poNumber }),
      error: (err) => console.error('PO Number Error:', err)
    });
  }

  loadSuppliers() {
    this.supplierService.getSuppliers().pipe(takeUntil(this.destroy$)).subscribe({
      next: (data) => this.suppliers = data,
      error: (err) => console.error('Suppliers Error:', err)
    });
  }

  loadAllPriceLists() {
    this.inventoryService.getPriceLists().pipe(takeUntil(this.destroy$)).subscribe(data => {
      this.priceLists = data;
    });
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

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}