import { Component, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { FinanceService } from '../service/finance.service';
import { MaterialModule } from '../../../shared/material/material/material-module';

@Component({
    selector: 'app-supplier-ledger',
    standalone: true,
    imports: [CommonModule, FormsModule, MaterialModule],
    templateUrl: './supplier-ledger.component.html',
    styleUrl: './supplier-ledger.component.scss'
})
export class SupplierLedgerComponent implements AfterViewInit {
    supplierId: number | null = null;
    ledgerData: any = null;
    displayedColumns: string[] = ['transactionDate', 'transactionType', 'referenceId', 'description', 'debit', 'credit', 'balance'];
    dataSource = new MatTableDataSource<any>([]);
    currentBalance: number = 0;

    @ViewChild(MatPaginator) paginator!: MatPaginator;
    @ViewChild(MatSort) sort!: MatSort;

    constructor(private financeService: FinanceService) { }

    ngAfterViewInit() {
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
    }

    loadLedger() {
        if (this.supplierId && this.supplierId > 0) {
            this.financeService.getSupplierLedger(this.supplierId).subscribe({
                next: (data) => {
                    // Backend returns List<SupplierLedger> directly, not { ledger: [...] }
                    if (data && Array.isArray(data) && data.length > 0) {
                        this.ledgerData = data;
                        this.dataSource.data = data;

                        // The ledger is ordered by date descending, first record has latest balance
                        this.currentBalance = data[0].balance || 0;
                    } else {
                        // No ledger entries yet (new supplier or no transactions)
                        this.ledgerData = [];
                        this.dataSource.data = [];
                        this.currentBalance = 0;
                    }
                },
                error: (err) => {
                    console.error('Error fetching ledger:', err);

                    // If 404, it means no ledger exists yet (valid state for new supplier)
                    if (err.status === 404) {
                        this.ledgerData = [];
                        this.dataSource.data = [];
                        this.currentBalance = 0;
                    } else {
                        alert('Failed to fetch ledger. Please check Supplier ID or network connection.');
                        this.ledgerData = null;
                        this.dataSource.data = [];
                    }
                }
            });
        }
    }
}
