import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MaterialModule } from '../../../shared/material/material/material-module';

@Component({
  selector: 'app-supplier-list',
  imports: [CommonModule, MaterialModule],
  templateUrl: './supplier-list.html',
  styleUrl: './supplier-list.scss',
})
export class SupplierList {
 private router = inject(Router);

  suppliers = [
    { id: 1, name: 'ABC Electronics', phone: '9876543210', status: 'Active' },
    { id: 2, name: 'XYZ Distributors', phone: '9123456780', status: 'Inactive' }
  ];

  addSupplier() {
    this.router.navigate(['/app/suppliers/add']);
  }

  editSupplier(id: number) {
    this.router.navigate(['/app/suppliers/edit', id]);
  }
}
