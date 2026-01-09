import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MaterialModule } from '../../../shared/material/material/material-module';

@Component({
  selector: 'app-sales-invoice',
  imports: [CommonModule, ReactiveFormsModule, MaterialModule],
  templateUrl: './sales-invoice.html',
  styleUrl: './sales-invoice.scss',
})
export class SalesInvoice {
  private fb = inject(FormBuilder);

  invoiceForm = this.fb.group({
    customerName: ['', Validators.required],
    customerPhone: [''],
    invoiceNo: ['INV-001'],
    invoiceDate: [new Date()],
    items: this.fb.array([]),
    subTotal: [{ value: 0, disabled: true }],
    total: [{ value: 0, disabled: true }]
  });

  constructor() {
    this.addItem();
  }

  /* =========================
     FORM ARRAY
     ========================= */

  get items(): FormArray {
    return this.invoiceForm.get('items') as FormArray;
  }

  createItem() {
    return this.fb.group({
      name: ['', Validators.required],
      qty: [1, Validators.required],
      price: [0, Validators.required],
      discount: [0],
      amount: [{ value: 0, disabled: true }]
    });
  }

  addItem(): void {
    this.items.push(this.createItem());
  }

  removeItem(i: number): void {
    this.items.removeAt(i);
    this.calculate();
  }

  update(i: number): void {
    const row = this.items.at(i);
    const qty = row.get('qty')?.value ?? 0;
    const price = row.get('price')?.value ?? 0;
    const discount = row.get('discount')?.value ?? 0;

    const total = qty * price;
    const final = total - (total * discount / 100);

    row.get('amount')?.setValue(final, { emitEvent: false });
    this.calculate();
  }

  calculate(): void {
    const sub = this.items.controls.reduce(
      (sum, r) => sum + (r.get('amount')?.value ?? 0),
      0
    );

    this.invoiceForm.get('subTotal')?.setValue(sub);
    this.invoiceForm.get('total')?.setValue(sub);
  }
}
