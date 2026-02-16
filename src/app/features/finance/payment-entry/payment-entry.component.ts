import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FinanceService } from '../service/finance.service';
import { MaterialModule } from '../../../shared/material/material/material-module';

@Component({
  selector: 'app-payment-entry',
  standalone: true,
  imports: [CommonModule, FormsModule, MaterialModule], // Including MaterialModule for UI components
  templateUrl: './payment-entry.component.html',
  styleUrl: './payment-entry.component.scss' // SCSS support
})
export class PaymentEntryComponent {
  payment: any = {
    supplierId: null,
    amount: null,
    paymentMode: 'Cash',
    referenceNumber: '',
    paymentDate: new Date(),
    remarks: '',
    createdBy: 'Admin'
  };

  constructor(private financeService: FinanceService) { }

  savePayment() {
    if (!this.payment.supplierId || !this.payment.amount) return;


    const payload = { ...this.payment, paymentDate: this.payment.paymentDate instanceof Date ? this.payment.paymentDate.toISOString() : this.payment.paymentDate };

    this.financeService.recordSupplierPayment(payload).subscribe({
      next: (res) => {
    
        alert('Payment Recorded Successfully!');
        this.resetForm();
      },
      error: (err) => {
        console.error(err);
        alert('Failed to record payment.');
      }
    });
  }

  resetForm() {
    this.payment = {
      supplierId: null,
      amount: null,
      paymentMode: 'Cash',
      referenceNumber: '',
      paymentDate: new Date(),
      remarks: '',
      createdBy: 'Admin'
    };
  }
}
