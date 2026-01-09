import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MaterialModule } from '../../../shared/material/material/material-module';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-customer-component',
  imports: [CommonModule, ReactiveFormsModule, MaterialModule],
  templateUrl: './customer-component.html',
  styleUrl: './customer-component.scss',
})
export class CustomerComponent {
  readonly fb = inject(FormBuilder);
  readonly router = inject(Router);
  readonly route = inject(ActivatedRoute);

  isEdit = false;

  customerForm = this.fb.group({
    customerName: ['', Validators.required],
    customerType: ['Retail', Validators.required],
    phone: ['', Validators.required],
    email: [''],
    gst: [''],
    creditLimit: [0],
    billingAddress: ['', Validators.required],
    shippingAddress: [''],
    status: ['Active']
  });

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit = true;
      // Later → load customer by id
    }
  }

  save() {
    if (this.customerForm.invalid) return;

    console.log('CUSTOMER:', this.customerForm.value);
    this.router.navigate(['/app/master/customers']);
  }
}
