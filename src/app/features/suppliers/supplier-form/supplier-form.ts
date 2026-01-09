import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MaterialModule } from '../../../shared/material/material/material-module';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-supplier-form',
  imports: [CommonModule, MaterialModule, ReactiveFormsModule],
  templateUrl: './supplier-form.html',
  styleUrl: './supplier-form.scss',
})
export class SupplierForm {
  private fb = inject(FormBuilder);
  readonly router = inject(Router);
  readonly route = inject(ActivatedRoute);

  isEdit = false;

  categories = ['Electronics', 'Accessories', 'Appliances'];

  supplierForm = this.fb.group({
    supplierName: ['', Validators.required],
    contactPerson: [''],
    phone: ['', Validators.required],
    email: [''],
    gst: [''],
    address: [''],
    categories: [[]],
    status: ['Active']
  });

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit = true;
      // Later → load supplier by id
    }
  }

  save() {
    if (this.supplierForm.invalid) return;

    console.log('SUPPLIER:', this.supplierForm.value);
    this.router.navigate(['/app/suppliers']);
  }
}
