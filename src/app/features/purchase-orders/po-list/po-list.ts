import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../../../shared/material/material/material-module';
import { Router } from '@angular/router';

@Component({
  selector: 'app-po-list',
  imports: [CommonModule, ReactiveFormsModule, MaterialModule],
  templateUrl: './po-list.html',
  styleUrl: './po-list.scss',
})
export class PoList {
readonly router = inject(Router);

  purchaseOrders = [
    { id: 1, poNo: 'PO-001', supplier: 'ABC Electronics', total: 45000, status: 'Approved' },
    { id: 2, poNo: 'PO-002', supplier: 'XYZ Traders', total: 22000, status: 'Draft' }
  ];

  addPO() {
    this.router.navigate(['/app/purchase-orders/add']);
  }

  editPO(id: number) {
    this.router.navigate(['/app/purchase-orders/edit', id]);
  }
  printPO(id: number) {
  window.open(`/app/purchase-orders/print/${id}`, '_blank');
}

}
