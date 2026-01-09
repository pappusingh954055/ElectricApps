import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../../../shared/material/material/material-module';
import { Router } from '@angular/router';

@Component({
  selector: 'app-customer-list',
  imports: [CommonModule, ReactiveFormsModule, MaterialModule],
  templateUrl: './customer-list.html',
  styleUrl: './customer-list.scss',
})
export class CustomerList {
  private router = inject(Router);

  customers = [
    { id: 1, name: 'Rahul Sharma', phone: '9876543210', type: 'Retail', status: 'Active' },
    { id: 2, name: 'TechWorld Pvt Ltd', phone: '9123456789', type: 'Wholesale', status: 'Inactive' }
  ];

  addCustomer() {
    this.router.navigate(['/app/masters/customers/add']);
  }

  editCustomer(id: number) {
    this.router.navigate(['/app/masters/customers/edit', id]);
  }
}
