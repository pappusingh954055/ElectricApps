import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MaterialModule } from '../../../shared/material/material/material-module';
import { Router, ActivatedRoute } from '@angular/router';
import { MatDialogRef } from '@angular/material/dialog';
import { customerService } from './customer.service';


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
  readonly dialogRef = inject(MatDialogRef<CustomerComponent>, { optional: true });
  private readonly cdr = inject(ChangeDetectorRef);

  // ⚠ keeping same service name as you used
  private readonly customerService = inject(customerService);

  isEdit = false;
  loading = false;

  customerForm = this.fb.group({
    customerName: ['', Validators.required],
    customerType: ['Retail', Validators.required],
    phone: ['', Validators.required],
    email: [''],
    gst: [''],
    creditLimit: [0],
    billingAddress: ['', Validators.required],
    shippingAddress: [''],
    customerStatus: ['']
  });

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit = true;
      // Future: load customer by id
    }
  }

  // ================= SAVE =================
  onSave() {
    if (this.customerForm.invalid) {
      this.customerForm.markAllAsTouched();
      return;
    }
    const currentUserId = localStorage.getItem('email') || '';
    this.loading = true;
    this.cdr.detectChanges();
    const payload = {
      customerName: this.customerForm.value.customerName,
      customerType: this.customerForm.value.customerType,
      phone: this.customerForm.value.phone,
      email: this.customerForm.value.email,
      gstNumber: this.customerForm.value.gst,
      creditLimit: this.customerForm.value.creditLimit,
      billingAddress: this.customerForm.value.billingAddress,
      shippingAddress: this.customerForm.value.shippingAddress,
      customerStatus: this.customerForm.value.customerStatus,
      createdBy: currentUserId
    };

    this.customerService
      .addCustomer(payload)
      .subscribe((res: any) => {

        this.loading = false;
        this.cdr.detectChanges();

        // Close popup with data
        if (this.dialogRef) {
          this.dialogRef.close({
            id: res.id,
            ...payload
          });
        } else {

        }

      }, (err) => {

        console.error('Customer save failed', err);
        this.loading = false;
        this.cdr.detectChanges();
      });
  }


  // ================= CANCEL =================
  cancel() {
    if (this.dialogRef) {
      this.dialogRef.close();
    } else {
      this.router.navigate(['/app/master/customers']);
    }
  }

}
