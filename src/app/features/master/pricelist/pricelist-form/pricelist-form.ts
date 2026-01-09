import { Component, inject } from '@angular/core';
import { Validators, FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { PriceListService } from '../service/pricelist.service';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../../../shared/material/material/material-module';

@Component({
  selector: 'app-pricelist-form',
  imports: [CommonModule, ReactiveFormsModule, MaterialModule],
  templateUrl: './pricelist-form.html',
  styleUrl: './pricelist-form.scss',
})
export class PricelistForm {

  readonly fb = inject(FormBuilder);

  readonly service = inject(PriceListService);

  form = this.fb.group({
    name: ['', Validators.required],
    type: ['PURCHASE', Validators.required],
    effectiveFrom: [new Date(), Validators.required],
    description: [''],
    isActive: [true]
  });



  save() {
    if (this.form.invalid) return;
    this.service.addPriceList(this.form.value as any);
  }
}