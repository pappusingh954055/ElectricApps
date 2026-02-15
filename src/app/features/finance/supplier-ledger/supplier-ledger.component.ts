import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FinanceService } from '../service/finance.service';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-supplier-ledger',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './supplier-ledger.component.html',
    styleUrl: './supplier-ledger.component.scss'
})
export class SupplierLedgerComponent implements OnInit {
    supplierId: number = 0;
    ledgerData: any = null;

    constructor(private financeService: FinanceService) { }

    ngOnInit(): void { }

    loadLedger() {
        if (this.supplierId > 0) {
            this.financeService.getSupplierLedger(this.supplierId).subscribe(data => {
                this.ledgerData = data;
            });
        }
    }
}
