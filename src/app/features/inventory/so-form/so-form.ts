import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MaterialModule } from '../../../shared/material/material/material-module';
import { Observable, of } from 'rxjs';
import { startWith, map } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { CustomerComponent } from '../../master/customer-component/customer-component';

@Component({
  selector: 'app-so-form',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, MaterialModule],
  templateUrl: './so-form.html',
  styleUrl: './so-form.scss',
})
export class SoForm implements OnInit {
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  private dialog = inject(MatDialog);

  soForm!: FormGroup;
  isLoading = false;
  filteredProducts: Observable<any[]>[] = [];

  // Totals
  subTotal = 0;
  totalTaxAmount = 0;
  grandTotal = 0;
  totalTax: number = 0;
  // Mock Data
  products = [
    { id: 1, name: 'Laptop', unit: 'PCS', rate: 50000, currentStock: 10, gst: 18 },
    { id: 2, name: 'Mouse', unit: 'PCS', rate: 500, currentStock: 50, gst: 12 }
  ];
  customers = [{ id: 1, name: 'Walking Customer' }, { id: 2, name: 'ABC Solutions' }];

  ngOnInit(): void {
    this.initForm();
    this.addRow();
  }

  initForm() {
    this.soForm = this.fb.group({
      customerId: [null, [Validators.required]],
      soDate: [new Date(), Validators.required],
      expectedDeliveryDate: [null],
      remarks: [''],
      items: this.fb.array([])
    });
  }

  get items(): FormArray {
    return this.soForm.get('items') as FormArray;
  }

  addRow(): void {
    const row = this.fb.group({
      productSearch: ['', Validators.required],
      productId: [null, Validators.required],
      qty: [1, [Validators.required, Validators.min(1)]],
      unit: [{ value: '', disabled: true }],
      rate: [0, [Validators.required, Validators.min(1)]],
      discountPercent: [0],
      gstPercent: [0],
      taxAmount: [0], // For internal calculation
      total: [{ value: 0, disabled: true }]
    });

    this.items.push(row);
    this.setupFilter(this.items.length - 1);
  }

  setupFilter(index: number): void {
    const control = this.items.at(index).get('productSearch');
    if (control) {
      this.filteredProducts[index] = control.valueChanges.pipe(
        startWith(''),
        map(v => typeof v === 'string' ? v : v?.name),
        map(name => name ? this.products.filter(p => p.name.toLowerCase().includes(name.toLowerCase())) : this.products.slice())
      );
    }
  }

  displayProductFn(p: any): string { return p?.name || ''; }

  onProductChange(index: number, event: any): void {
    const p = event.option.value;
    if (p) {
      this.items.at(index).patchValue({
        productId: p.id,
        unit: p.unit,
        price: p.price,
        gstPercent: p.gst || 0
      });
      this.updateTotal(index);
    }
  }

  updateTotal(index: number): void {
    const row = this.items.at(index);
    const qty = +row.get('qty')?.value || 0;
    const price = +row.get('price')?.value || 0;
    const disc = +row.get('discountPercent')?.value || 0;
    const gst = +row.get('gstPercent')?.value || 0;

    const amount = qty * price;
    const taxable = amount - (amount * (disc / 100));
    const tax = taxable * (gst / 100);
    const total = taxable + tax;

    row.patchValue({
      taxAmount: tax,
      total: total.toFixed(2)
    }, { emitEvent: false });

    this.calculateGrandTotal();
  }

  calculateGrandTotal(): void {
    let sub = 0; let tax = 0; let grand = 0;

    this.items.controls.forEach(c => {
      const rowTotal = +c.get('total')?.value || 0;
      const rowTax = +c.get('taxAmount')?.value || 0;
      grand += rowTotal;
      tax += rowTax;
    });

    this.grandTotal = grand;
    this.totalTaxAmount = tax;
    this.subTotal = grand - tax;
    this.cdr.detectChanges();
  }

  removeItem(index: number): void {
    if (this.items.length > 1) {
      this.items.removeAt(index);
      this.calculateGrandTotal();
    }
  }

  saveOrder(status: string) {
    if (this.soForm.invalid) return alert('Invalid Form');
    console.log('Final SO Payload:', { ...this.soForm.getRawValue(), status, grandTotal: this.grandTotal });
  }

  openAddCustomerDialog() {
    const dialogRef = this.dialog.open(CustomerComponent, {
      width: '90vw',
      maxWidth: '600px',
      disableClose: false,
      autoFocus: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Add the new customer to the list
        const newCustomer = {
          id: this.customers.length + 1,
          name: result.customerName
        };
        this.customers.push(newCustomer);

        // Auto-select the newly added customer
        this.soForm.patchValue({ customerId: newCustomer.id });
        this.cdr.detectChanges();
      }
    });
  }
}