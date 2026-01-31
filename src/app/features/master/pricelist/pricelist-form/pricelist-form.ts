import { ChangeDetectorRef, Component, EventEmitter, inject, Input, OnInit, Output, OnChanges, SimpleChanges } from '@angular/core';
import { Validators, FormBuilder, ReactiveFormsModule, FormGroup, FormArray, FormControl } from '@angular/forms';
import { PriceListService } from '../service/pricelist.service';
import { ProductService } from '../../product/service/product.service';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../../../shared/material/material/material-module';

import { ActivatedRoute, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, finalize, tap } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { StatusDialogComponent } from '../../../../shared/components/status-dialog-component/status-dialog-component';

@Component({
  selector: 'app-pricelist-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MaterialModule],
  templateUrl: './pricelist-form.html',
  styleUrl: './pricelist-form.scss',
})
export class PricelistForm implements OnInit, OnChanges {
  priceListForm!: FormGroup;
  filteredProducts: any[][] = [];
  loadingRowIndex: number | null = null;

  applicableGroups = [
    { label: 'All', value: 'ALL' },
    { label: 'Wholesale', value: 'WHOLESALE' },
    { label: 'Retail', value: 'RETAIL' },
    { label: 'Dealer', value: 'DEALER' },
    { label: 'Distributor', value: 'DISTRIBUTOR' },
    { label: 'Project / Contractor', value: 'PROJECT' }
  ];

  private productService = inject(ProductService);
  private priceListService = inject(PriceListService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);
  loading: boolean = false;

  @Input() editId: string | null = null;
  @Output() actionComplete = new EventEmitter<any>();

  isEditMode = false;
  showError = false;
  constructor(private fb: FormBuilder, private dialog: MatDialog) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['editId'] && !changes['editId'].firstChange) {
      const id = changes['editId'].currentValue;
      if (id) {
        this.loadPriceList(id);
      } else {
        this.isEditMode = false;
        this.priceListForm.reset();
        this.initForm();
        this.addItemRow();
      }
    }
  }

  ngOnInit(): void {
    this.initForm();

    // Check mapping: Pehle Input check karein (Drawer ke liye), phir URL params
    const id = this.editId || this.route.snapshot.params['id'];

    if (id) {
      this.loadPriceList(id);
    } else {
      // FIX: Sirf naye entry ke waqt ek row add hogi
      this.addItemRow();
    }

    // Price Type change listener
    this.priceListForm.get('priceType')?.valueChanges.subscribe(type => {
      this.updateAllRates(type);
    });

    // NOTE: Yahan se extra addItemRow() aur duplicate subscription hata diye gaye hain taaki double row na aaye.
  }

  initForm() {
    this.priceListForm = this.fb.group({
      name: ['', Validators.required],
      priceType: ['SALES', Validators.required],
      code: ['', Validators.required],
      applicableGroup: ['ALL'],
      currency: ['INR'],
      description: [''],
      validFrom: [new Date(), Validators.required],
      validTo: [null],
      isActive: [true],
      priceListItems: this.fb.array([])
    });
  }

  get items(): FormArray {
    return this.priceListForm.get('priceListItems') as FormArray;
  }

  updateAllRates(type: string) {
    this.items.controls.forEach((control) => {
      const product = control.get('productSearch')?.value;
      if (product && typeof product === 'object') {
        const newRate = type === 'SALES' ? (product.mrp || 0) : (product.basePurchasePrice || 0);
        control.get('rate')?.setValue(newRate);
      }
    });
    this.cdr.detectChanges();
  }

  addItemRow() {
    const index = this.items.length;
    const itemRow = this.fb.group({
      productId: [null, Validators.required],
      productSearch: ['', Validators.required],
      unit: [''],
      discountPercent: [0, [Validators.min(0), Validators.max(100)]],
      rate: [0, [Validators.required, Validators.min(0)]],
      minQty: [1, [Validators.required, Validators.min(1)]],
      maxQty: [999999, Validators.required]
    });

    this.items.push(itemRow);
    this.setupSearch(index);
    this.cdr.detectChanges();
  }

  setupSearch(index: number) {
    const row = this.items.at(index);
    row.get('productSearch')?.valueChanges.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      tap(value => {
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          row.patchValue({
            rate: 0,
            unit: '-',
            productId: null
          }, { emitEvent: false });
          this.loadingRowIndex = null;
        } else if (typeof value === 'string' && value.length >= 2) {
          this.loadingRowIndex = index;
        }
      }),
      switchMap(value => {
        if (typeof value !== 'string' || value.length < 2) {
          return of([]);
        }
        return this.productService.searchProducts(value).pipe(
          finalize(() => this.loadingRowIndex = null)
        );
      })
    ).subscribe(res => {
      this.filteredProducts[index] = res;
      this.cdr.detectChanges();
    });
  }

  onProductSelect(event: any, index: number) {
    console.log('onProductSelect triggered', event);
    const selectedProduct = event.option.value;

    // 1. Duplicate Product Check
    const isDuplicate = this.items.controls.some((control, i) => {
      return i !== index && control.get('productId')?.value === selectedProduct.id;
    });

    if (isDuplicate) {
      this.dialog.open(StatusDialogComponent, {
        width: '350px',
        data: {
          isSuccess: false,
          message: `Duplicate Product! "${selectedProduct.name}" is already added to the list.`
        }
      });

      // Reset current row
      this.items.at(index).patchValue({
        productId: null,
        productSearch: '',
        unit: '-',
        rate: 0
      });
      return;
    }

    // 2. Logic for Default Rate based on Price Type
    const priceType = this.priceListForm.get('priceType')?.value;
    const defaultRate = priceType === 'SALES' ? (selectedProduct.mrp || 0) : (selectedProduct.basePurchasePrice || 0);

    // 3. Patch Values (Checking for unit or uomName)
    // NOTE: Agar selectedProduct.unit undefined hai to check karein product object mein key kya hai
    this.items.at(index).patchValue({
      productId: selectedProduct.id,
      productSearch: selectedProduct, // Important: Autocomplete ke liye object hi pass karein agar displayWith hai
      unit: selectedProduct.unit || selectedProduct.uomName || selectedProduct.uom || '-',
      rate: defaultRate
    }, { emitEvent: false }); // Circular loop se bachne ke liye

    // 4. Force UI Update
    setTimeout(() => {
      this.cdr.markForCheck();
      this.cdr.detectChanges();
    }, 0);
  }

  displayFn(product: any): string {
    return product ? (typeof product === 'string' ? product : product.name) : '';
  }

  removeItem(index: number) {
    if (this.items.length > 1) {
      this.items.removeAt(index);
      this.filteredProducts.splice(index, 1);
      this.cdr.detectChanges();
    }
  }

  get name(): FormControl { return this.priceListForm.get('name') as FormControl; }
  get showNameError(): boolean { return this.showError && this.name.invalid; }

  onSave() {
    this.showError = true;
    this.priceListForm.markAllAsTouched();
    if (this.priceListForm.invalid) return;

    this.loading = true;
    const rawValues = this.priceListForm.getRawValue();
    const currentUserId = localStorage.getItem('userId') || '00000000-0000-0000-0000-000000000000';

    const currentId = this.editId || this.route.snapshot.params['id'];

    const finalPayload = {
      ...rawValues,
      id: currentId || undefined,
      remarks: rawValues.description, // Map description back to remarks for backend
      validFrom: new Date(rawValues.validFrom).toISOString(),
      validTo: rawValues.validTo ? new Date(rawValues.validTo).toISOString() : null,
      createdBy: currentUserId,
      priceListItems: rawValues.priceListItems.map((item: any) => ({
        
        ...item,
        productSearch: undefined
      }))
    };

    const request$ = currentId
      ? this.priceListService.updatePriceList(currentId, finalPayload)
      : this.priceListService.createPriceList(finalPayload);

    request$.pipe(
      finalize(() => { this.loading = false; this.cdr.detectChanges(); })
    ).subscribe({
      next: () => {
        this.dialog.open(StatusDialogComponent, {
          width: '350px',
          data: {
            isSuccess: true,
            message: currentId ? 'Price List updated successfully!' : 'Price List saved successfully!'
          }
        }).afterClosed().subscribe(() => {
          this.actionComplete.emit(true);
          if (!this.editId) this.router.navigate(['/app/master/pricelist']);
        });
      },
      error: (err) => {
        this.dialog.open(StatusDialogComponent, {
          width: '350px',
          data: { isSuccess: false, message: err.error?.message || 'Error occurred while saving.' }
        });
      }
    });
  }

  onCancel() {
    this.actionComplete.emit(false);
    if (!this.editId) this.router.navigate(['/app/master/pricelist']);
  }

  onFieldFocus(event: FocusEvent, fieldType: string) {
    (event.target as HTMLInputElement).select();
  }

  handleFocus(index: number, fieldName: string) {
    const control = this.items.at(index).get(fieldName);
    if (control && control.value === 0) control.setValue(null, { emitEvent: false });
  }

  handleBlur(index: number, fieldName: string) {
    const control = this.items.at(index).get(fieldName);
    if (control && (control.value === null || control.value === '')) control.setValue(0, { emitEvent: false });
    this.cdr.detectChanges();
  }

  loadPriceList(id: string) {
    this.loading = true;
    this.isEditMode = true;
    this.priceListService.getPriceListById(id).pipe(
      finalize(() => { this.loading = false; this.cdr.detectChanges(); })
    ).subscribe(data => {
      this.priceListForm.patchValue({
        name: data.name,
        priceType: data.priceType,
        code: data.code,
        applicableGroup: data.applicableGroup,
        currency: data.currency,
        description: data.remarks, // Map remarks from backend to description
        validFrom: new Date(data.validFrom),
        validTo: data.validTo ? new Date(data.validTo) : null,
        isActive: data.isActive
      });

      const itemsArray = this.items;
      itemsArray.clear();

      const listData = data.items || data.priceListItems || [];

      listData.forEach((item: any, index: number) => {
        console.log('item', item);
        const row = this.fb.group({
          productId: [item.productId, Validators.required],
          productSearch: [item.productName || '', Validators.required],
          unit: [{ value: item.unit || '-', disabled: true }],
          discountPercent: [item.discountPercent || 0],
          rate: [item.rate, [Validators.required, Validators.min(0.01)]],
          minQty: [item.minQty || 1],
          maxQty: [item.maxQty || 999999]
        });
        itemsArray.push(row);
        this.setupSearch(index);
      });

      if (listData.length === 0) {
        this.addItemRow();
      }
    });
  }

}