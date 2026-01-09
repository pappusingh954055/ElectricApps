import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, FormArray } from '@angular/forms';
import { Router } from '@angular/router';
import { MaterialModule } from '../../../shared/material/material/material-module';

@Component({
  selector: 'app-so-form',
  imports: [CommonModule, ReactiveFormsModule, MaterialModule],
  templateUrl: './so-form.html',
  styleUrl: './so-form.scss',
})
export class SoForm {
  private fb = inject(FormBuilder);

  soForm = this.fb.group({
    customerName: [''],
    customerPhone: [''],
    invoiceNo: [1],
    invoiceDate: [new Date()],
    items: this.fb.array([]),   // ✅ MUST EXIST
    grossSubTotal: [0],
    netTotal: [0],
    total: [0],
    received: [0],
    fullyReceived: [false],
    youSaved: [0]
  });



  constructor() {
    this.addItem();
  }

  /* ---------- FORM ARRAY ---------- */

  get items(): FormArray {
    return this.soForm.get('items') as FormArray;
  }

  createItem() {
    return this.fb.group({
      category: [''],
      name: [''],
      qty: [1],
      price: [0],
      discount: [0],
      tax: ['NONE'],
      amount: [0],
      _discountAmount: [0] // 👈 hidden field
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

    const qty = +row.get('qty')!.value || 0;
    const price = +row.get('price')!.value || 0;
    const discountPercent = +row.get('discount')!.value || 0;

    const gross = qty * price;
    const discountAmount = (gross * discountPercent) / 100;
    const netAmount = gross - discountAmount;

    row.patchValue(
      {
        amount: netAmount,
        _discountAmount: discountAmount // internal use
      },
      { emitEvent: false }
    );

    this.calculate();
  }


  calculate(): void {
    let grossSubTotal = 0;
    let totalDiscount = 0;

    this.items.controls.forEach(row => {
      const qty = +row.get('qty')!.value || 0;
      const price = +row.get('price')!.value || 0;
      const discountPercent = +row.get('discount')!.value || 0;

      const gross = qty * price;
      const discountAmt = (gross * discountPercent) / 100;
      const net = gross - discountAmt;

      grossSubTotal += gross;
      totalDiscount += discountAmt;

      row.patchValue(
        {
          amount: net,
          _discountAmount: discountAmt
        },
        { emitEvent: false }
      );
    });

    const netTotal = grossSubTotal - totalDiscount;
    const fullyReceived = this.soForm.get('fullyReceived')!.value;

    this.soForm.patchValue(
      {
        grossSubTotal,
        youSaved: totalDiscount,
        netTotal,
        received: fullyReceived ? netTotal : 0
      },
      { emitEvent: false }
    );
  }



  save(): void {
    console.log('INVOICE DATA:', this.soForm.value);
  }

  onFullyReceivedChange(checked: boolean): void {
    const netTotal = this.soForm.get('netTotal')!.value || 0;

    this.soForm.patchValue(
      {
        fullyReceived: checked,
        received: checked ? netTotal : 0
      },
      { emitEvent: false }
    );
  }
  get balance(): number {
    const netTotal = this.soForm.get('netTotal')?.value;
    const received = this.soForm.get('received')?.value;

    return (netTotal ?? 0) - (received ?? 0);
  }
  categories = ['Electronics', 'Accessories'];

  categoryItems: Record<string, string[]> = {
    Electronics: ['Laptop', 'Mobile', 'TV'],
    Accessories: ['Mouse', 'Keyboard', 'Charger']
  };

  onCategoryChange(index: number): void {
    const row = this.items.at(index);
    row.patchValue({ name: '' }); // reset item
  }

  onPriceFocus(index: number): void {
    const control = this.items.at(index)?.get('price');
    if (!control) return;

    if (control.value === 0) {
      control.setValue(null);
    }
  }

  onPriceBlur(index: number): void {
    const control = this.items.at(index)?.get('price');
    if (!control) return;

    if (control.value == null || control.value === '') {
      control.setValue(0);
    }

    this.update(index);
  }

  onDiscountFocus(index: number): void {
    const control = this.items.at(index)?.get('discount');
    if (!control) return;

    if (control.value === 0) {
      control.setValue(null);
    }
  }

  onDiscountBlur(index: number): void {
    const control = this.items.at(index)?.get('discount');
    if (!control) return;

    if (control.value == null || control.value === '') {
      control.setValue(0);
    }

    this.update(index);
  }

}
