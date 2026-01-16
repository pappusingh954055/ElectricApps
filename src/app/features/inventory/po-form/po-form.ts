import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { MaterialModule } from '../../../shared/material/material/material-module';

@Component({
  selector: 'app-po-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MaterialModule],
  templateUrl: './po-form.html',
  styleUrl: './po-form.scss',
})
export class PoForm implements OnInit {

  private fb = inject(FormBuilder);

  suppliers = [{ id: 1, name: 'ABC Traders' }];

  products = [
    { id: 1, name: 'Laptop', unit: 'PCS', price: 50000 },
    { id: 2, name: 'Mouse', unit: 'PCS', price: 500 }
  ];

  poForm!: FormGroup;

  itemCols = ['product', 'qty', 'unit', 'price', 'total', 'actions'];

  ngOnInit(): void {
    this.poForm = this.fb.nonNullable.group({
      supplierId: [0, Validators.required],
      date: [new Date(), Validators.required],
      PoNumber:['',[Validators.required]],
      items: this.fb.nonNullable.array([])
    });

    // 🔑 MUST ADD FIRST ROW
    this.addRow();
  }

  // 🔹 FormArray getter
  get items(): FormArray {
    return this.poForm.get('items') as FormArray;
  }

  // 🔹 Create empty row
  private createItem(): FormGroup {
    return this.fb.nonNullable.group({
      productId: [0, Validators.required],
      productName: [''],
      qty: [1, [Validators.required, Validators.min(1)]],
      unit: [''],
      price: [0],
      total: [0]
    });
  }

  // 🔹 Add new row
  addRow(): void {
    this.items.push(
      this.fb.nonNullable.group({
        productId: [0, Validators.required],
        qty: [1, [Validators.required, Validators.min(1)]],
        unit: [''],
        price: [0],
        discountPercent: [0],
        gstPercent: [0],
        total: [0]
      })
    );
  }


  // 🔹 Remove row
  removeItem(index: number): void {
    this.items.removeAt(index);
  }

  // 🔹 Product change (per row)
  onProductChange(index: number): void {
    const row = this.items.at(index);
    const productId = Number(row.get('productId')!.value);

    if (!productId) return;

    // duplicate check
    const duplicate = this.items.controls.some((c, i) =>
      i !== index && c.get('productId')!.value === productId
    );

    if (duplicate) {
      alert('Product already exists');
      row.get('productId')!.setValue(0);
      return;
    }

    const product = this.products.find(p => p.id === productId);
    if (!product) return;

    row.patchValue({
      productName: product.name,
      unit: product.unit,
      price: product.price
    });

    this.updateTotal(index);
  }

  // 🔹 Qty / price change
  updateTotal(index: number): void {
    const row = this.items.at(index);

    const qty = Number(row.get('qty')?.value) || 0;
    const price = Number(row.get('price')?.value) || 0;
    const disc = Number(row.get('discountPercent')?.value) || 0;
    const gst = Number(row.get('gstPercent')?.value) || 0;

    let amount = qty * price;

    if (disc > 0) amount -= (amount * disc) / 100;
    if (gst > 0) amount += (amount * gst) / 100;

    row.patchValue({ total: Math.round(amount) }, { emitEvent: false });
  }


  // 🔹 Grand total
  get grandTotal(): number {
    return this.items.controls.reduce(
      (sum, r) => sum + (r.get('total')?.value || 0),
      0
    );
  }

  savePo(): void {
    if (this.poForm.invalid || this.items.length === 0) {
      alert('Supplier and at least one item required');
      return;
    }

    console.log('FINAL PO PAYLOAD', this.poForm.value);
  }

  addRowFromKeyboard(index: number, event: Event): void {
    event.preventDefault();

    const row = this.items.at(index);
    if (!row || row.invalid) return;

    this.addRow();

    // focus product in new row
    setTimeout(() => {
      const selects = document.querySelectorAll('mat-select');
      const last = selects[selects.length - 1] as HTMLElement;
      last?.focus();
    });
  }


}
