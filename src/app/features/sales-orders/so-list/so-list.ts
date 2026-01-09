import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MaterialModule } from '../../../shared/material/material/material-module';

@Component({
  selector: 'app-so-list',
  imports: [CommonModule, MaterialModule],
  templateUrl: './so-list.html',
  styleUrl: './so-list.scss',
})
export class SoList {
readonly router = inject(Router);

  // 🔹 Temporary mock data (replace with API later)
  salesOrders = [
    {
      id: 1,
      soNo: 'SO-001',
      customer: 'TechWorld Pvt Ltd',
      date: '2024-05-01',
      total: 85000,
      status: 'Draft'
    },
    {
      id: 2,
      soNo: 'SO-002',
      customer: 'Rahul Sharma',
      date: '2024-05-03',
      total: 22000,
      status: 'Approved'
    }
  ];

  addSalesOrder(): void {
    this.router.navigate(['/app/sales-orders/add']);
  }

  editSalesOrder(id: number): void {
    this.router.navigate(['/app/sales-orders/edit', id]);
  }

  printSalesOrder(id: number): void {
    window.open(`/app/sales-orders/print/${id}`, '_blank');
  }
}
