import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, FormArray } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MaterialModule } from '../../../shared/material/material/material-module';

@Component({
  selector: 'app-po-form',
  imports: [CommonModule, ReactiveFormsModule, MaterialModule],
  templateUrl: './po-form.html',
  styleUrl: './po-form.scss',
})
export class PoForm {
private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  activeRow: number | null = null;

  suppliers = ['ABC Electronics', 'XYZ Traders'];

  categories: Record<string, string[]> = {
    Electronics: ['Laptop', 'Mobile'],
    Accessories: ['Mouse', 'Keyboard']
  };

  poForm = this.fb.group({
    poDate: [new Date(), Validators.required],
    supplier: ['', Validators.required],
    items: this.fb.array([]),
    discount: [0],
    tax: [18],
    netTotal: [{ value: 0, disabled: true }]
  });

  constructor() {
    this.addItem();
  }

  /* =========================
     FORM ARRAY
     ========================= */

  get items(): FormArray {
    return this.poForm.get('items') as FormArray;
  }

  createItem() {
    return this.fb.group({
      category: ['', Validators.required],
      product: ['', Validators.required],
      qty: [1, [Validators.required, Validators.min(1)]],
      rate: [0, [Validators.required, Validators.min(0)]],
      amount: [{ value: 0, disabled: true }]
    });
  }

  addItem(): void {
    this.items.push(this.createItem());
  }

  removeItem(index: number): void {
    this.items.removeAt(index);
    this.calculateTotal();
  }

  /* =========================
     CATEGORY CHANGE
     ========================= */

  onCategoryChange(index: number): void {
    const row = this.items.at(index);
    row.get('product')?.reset();
  }

  /* =========================
     RATE FOCUS / BLUR (NEW)
     ========================= */

  onRateFocus(index: number, event: FocusEvent): void {
    this.activeRow = index;

    const input = event.target as HTMLInputElement;
    setTimeout(() => input.select(), 0);
  }

  onRateBlur(index: number): void {
    this.activeRow = null;

    const row = this.items.at(index);
    const qty = row.get('qty')?.value ?? 0;
    let rate = row.get('rate')?.value ?? 0;

    if (rate < 0) rate = 0;

    row.get('rate')?.setValue(rate, { emitEvent: false });
    row.get('amount')?.setValue(qty * rate, { emitEvent: false });

    this.calculateTotal();
  }

  /* =========================
     CALCULATIONS
     ========================= */

  updateAmount(index: number): void {
    const row = this.items.at(index);
    const qty = row.get('qty')?.value ?? 0;
    const rate = row.get('rate')?.value ?? 0;

    row.get('amount')?.setValue(qty * rate, { emitEvent: false });
    this.calculateTotal();
  }

  calculateTotal(): void {
    const subTotal = this.items.controls.reduce(
      (sum, row) => sum + (row.get('amount')?.value ?? 0),
      0
    );

    const discount = this.poForm.get('discount')?.value ?? 0;
    const taxRate = this.poForm.get('tax')?.value ?? 0;

    const taxable = subTotal - discount;
    const net = taxable + (taxable * taxRate / 100);

    this.poForm.get('netTotal')?.setValue(net);
  }

  /* =========================
     SAVE
     ========================= */

  save(): void {
    if (this.poForm.invalid) return;

    console.log('PURCHASE ORDER:', this.poForm.getRawValue());
    this.router.navigate(['/app/purchase-orders']);
  }
}
