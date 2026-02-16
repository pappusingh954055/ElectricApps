import { Component, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { FinanceService } from '../service/finance.service';
import { MaterialModule } from '../../../shared/material/material/material-module';

@Component({
    selector: 'app-customer-ledger',
    standalone: true,
    imports: [CommonModule, FormsModule, MaterialModule],
    templateUrl: './customer-ledger.component.html',
    styleUrl: './customer-ledger.component.scss'
})
export class CustomerLedgerComponent implements AfterViewInit {
    customerId: number | null = null;
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
        if (this.customerId && this.customerId > 0) {
            this.financeService.getCustomerLedger(this.customerId).subscribe({
                next: (data) => {
                    this.ledgerData = data;
                    if (data && data.ledger) {
                        this.dataSource.data = data.ledger;
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
                    alert('Failed to fetch ledger. Please check Customer ID.');
                    this.ledgerData = null;
                    this.dataSource.data = [];
                }
            });
        }
    }
}
