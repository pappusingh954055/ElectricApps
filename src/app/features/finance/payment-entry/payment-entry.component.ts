import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FinanceService } from '../service/finance.service';

@Component({
    selector: 'app-payment-entry',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="container mt-4">
      <div class="card shadow">
        <div class="card-header bg-primary text-white">
          <h3><i class="fas fa-money-check-alt"></i> Payment Entry</h3>
        </div>
        <div class="card-body">
          <form (ngSubmit)="savePayment()">
            <div class="row">
              <div class="col-md-6 mb-3">
                <label>Supplier ID</label>
                <input type="number" [(ngModel)]="payment.supplierId" name="supplierId" class="form-control" required>
              </div>
              <div class="col-md-6 mb-3">
                <label>Amount (₹)</label>
                <input type="number" [(ngModel)]="payment.amount" name="amount" class="form-control" required>
              </div>
              <div class="col-md-6 mb-3">
                <label>Payment Mode</label>
                <select [(ngModel)]="payment.paymentMode" name="paymentMode" class="form-control">
                  <option value="Cash">Cash</option>
                  <option value="Bank">Bank Transfer</option>
                  <option value="Check">Check</option>
                </select>
              </div>
              <div class="col-md-6 mb-3">
                <label>Reference Number</label>
                <input type="text" [(ngModel)]="payment.referenceNumber" name="ref" class="form-control">
              </div>
              <div class="col-md-12 mb-3">
                <label>Remarks</label>
                <textarea [(ngModel)]="payment.remarks" name="remarks" class="form-control"></textarea>
              </div>
            </div>
            <button type="submit" class="btn btn-success w-100">Save Payment</button>
          </form>
        </div>
      </div>
    </div>
  `
})
export class PaymentEntryComponent {
    payment: any = {
        supplierId: null,
        amount: 0,
        paymentMode: 'Cash',
        paymentDate: new Date().toISOString(),
        createdBy: 'Admin'
    };

    constructor(private financeService: FinanceService) { }

    savePayment() {
        this.financeService.recordSupplierPayment(this.payment).subscribe(res => {
            alert('Payment Recorded Successfully!');
            this.payment = { supplierId: null, amount: 0, paymentMode: 'Cash', paymentDate: new Date().toISOString(), createdBy: 'Admin' };
        });
    }
}
