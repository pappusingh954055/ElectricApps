import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MaterialModule } from '../../../shared/material/material/material-module';

@Component({
  selector: 'app-so-form',
  imports: [ReactiveFormsModule, CommonModule, MaterialModule],
  templateUrl: './so-form.html',
  styleUrl: './so-form.scss',
})
export class SoForm implements OnInit {

  soForm!: FormGroup;

  products = [
    { id: 1, name: 'Laptop', unit: 'PCS', price: 50000 },
    { id: 2, name: 'Mouse', unit: 'PCS', price: 500 }
  ];

  constructor(private fb: FormBuilder) { }

  ngOnInit(): void {
    this.soForm = this.fb.group({
      customerId: [null, Validators.required],
      date: [new Date(), Validators.required],
      items: this.fb.array([])
    });

    // add first row by default
    this.addRow();
  }

  // ---------- FormArray getter ----------
  get items(): FormArray {
    return this.soForm.get('items') as FormArray;
  }

  // ---------- Create Row ----------
  createItem(): FormGroup {
    return this.fb.group({
      productId: [null, Validators.required],
      qty: [1, [Validators.required, Validators.min(1)]],
      unit: [''],
      price: [0],
      discountPercent: [0],
      gstPercent: [0],
      total: [0]
    });
  }

  // ---------- Add Row ----------
  addRow(): void {
    this.items.push(this.createItem());
  }

  // ---------- Remove Row ----------
  removeItem(index: number): void {
    this.items.removeAt(index);
  }

  // ---------- Product Change ----------
  onProductChange(index: number): void {
    const row = this.items.at(index);
    const productId = row.get('productId')?.value;

    const product = this.products.find(p => p.id === productId);
    if (!product) return;

    row.patchValue({
      unit: product.unit,
      price: product.price
    });

    this.updateTotal(index);
  }

  // ---------- Total Calculation ----------
  updateTotal(index: number): void {
    const row = this.items.at(index);

    const qty = +row.get('qty')!.value;
    const price = +row.get('price')!.value;
    const disc = +row.get('discountPercent')!.value;
    const gst = +row.get('gstPercent')!.value;

    let amount = qty * price;
    amount -= amount * (disc / 100);
    amount += amount * (gst / 100);

    row.get('total')?.setValue(Math.round(amount), { emitEvent: false });
  }

  // ---------- Grand Total ----------
  get grandTotal(): number {
    return this.items.controls.reduce(
      (sum, c) => sum + (+c.get('total')!.value || 0),
      0
    );
  }

  SaveDraft(): void {
    if (this.soForm.invalid || this.items.length === 0) {
      alert('Customer and at least one item required');
      return;
    }

    console.log('FINAL SO PAYLOAD', this.soForm.value);
  }
  SaveSo() { }
}
