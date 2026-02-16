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
                    this.ledgerData = data;
                    if (data && data.ledger) {
                        this.dataSource.data = data.ledger;
                        // Calculate current balance (assuming last entry has latest balance or sum)
                        // In this API, the ledger is ordered by date descending, so the first record is the latest
                        if (data.ledger.length > 0) {
                            this.currentBalance = data.ledger[0].balance;
                        } else {
                            this.currentBalance = 0;
                        }
                    } else {
                        this.dataSource.data = [];
                        this.currentBalance = 0;
                    }
                },
                error: (err) => {
                    console.error('Error fetching ledger:', err);
                    alert('Failed to fetch ledger. Please check Supplier ID.');
                    this.ledgerData = null;
                    this.dataSource.data = [];
                }
            });
        }
    }
}
