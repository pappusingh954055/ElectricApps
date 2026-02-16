import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../shared/material/material/material-module';
import { FinanceService } from '../service/finance.service';

@Component({
    selector: 'app-receipt-entry',
    standalone: true,
    imports: [CommonModule, FormsModule, MaterialModule],
    templateUrl: './receipt-entry.component.html',
    styleUrl: './receipt-entry.component.scss'
})
export class ReceiptEntryComponent {
    receipt: any = {
        customerId: null,
        amount: null,
        paymentMode: 'Cash',
        referenceNumber: '',
        paymentDate: new Date(),
        remarks: '',
        createdBy: 'Admin'
    };

    constructor(private financeService: FinanceService) { }

    saveReceipt() {
        if (!this.receipt.customerId || !this.receipt.amount) return;

        const payload = {
            ...this.receipt,
            paymentDate: this.receipt.paymentDate instanceof Date ? this.receipt.paymentDate.toISOString() : this.receipt.paymentDate
        };

        this.financeService.recordCustomerReceipt(payload).subscribe({
            next: (res) => {
                alert('Receipt Recorded Successfully!');
                this.resetForm();
            },
            error: (err) => {
                console.error(err);
                alert('Failed to record receipt.');
            }
        });
    }

    resetForm() {
        this.receipt = {
            customerId: null,
            amount: null,
            paymentMode: 'Cash',
            referenceNumber: '',
            paymentDate: new Date(),
            remarks: '',
            createdBy: 'Admin'
        };
    }
}
