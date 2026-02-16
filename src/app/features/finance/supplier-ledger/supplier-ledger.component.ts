import { Component, ViewChild, AfterViewInit, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute } from '@angular/router';
import { FinanceService } from '../service/finance.service';
import { MaterialModule } from '../../../shared/material/material/material-module';
import { LoadingService } from '../../../core/services/loading.service';
import { Subscription } from 'rxjs';


@Component({
    selector: 'app-supplier-ledger',
    standalone: true,
    imports: [CommonModule, FormsModule, MaterialModule],
    templateUrl: './supplier-ledger.component.html',
    styleUrl: './supplier-ledger.component.scss'
})
export class SupplierLedgerComponent implements OnInit, AfterViewInit, OnDestroy {

    supplierId: number | null = null;
    ledgerData: any = null;
    displayedColumns: string[] = ['transactionDate', 'transactionType', 'referenceId', 'description', 'debit', 'credit', 'balance'];
    dataSource = new MatTableDataSource<any>([]);
    currentBalance: number = 0;
    private routeSub!: Subscription;


    @ViewChild(MatPaginator) paginator!: MatPaginator;
    @ViewChild(MatSort) sort!: MatSort;

    constructor(
        private financeService: FinanceService,
        private loadingService: LoadingService,
        private route: ActivatedRoute
    ) { }

    ngOnInit() {
        this.routeSub = this.route.queryParams.subscribe(params => {
            const sid = params['supplierId'];
            if (sid) {
                this.supplierId = Number(sid);
                this.loadLedger();
            }
        });
    }

    ngOnDestroy() {
        if (this.routeSub) this.routeSub.unsubscribe();
    }


    private updateLoading(delta: number) {
        this.loadingService.setLoading(delta > 0);
    }

    ngAfterViewInit() {
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
    }

    loadLedger() {
        if (this.supplierId && this.supplierId > 0) {
            this.updateLoading(1);
            this.financeService.getSupplierLedger(this.supplierId).subscribe({
                next: (result: any) => {
                    this.updateLoading(-1);
                    // The API returns SupplierLedgerResultDto { supplierName: string, ledger: SupplierLedger[] }
                    if (result && result.ledger && Array.isArray(result.ledger)) {
                        this.ledgerData = result;
                        this.dataSource.data = result.ledger;

                        // The ledger is ordered by date descending, first record has latest balance
                        if (result.ledger.length > 0) {
                            this.currentBalance = result.ledger[0].balance || 0;
                        } else {
                            this.currentBalance = 0;
                        }
                    } else {
                        // Handle case where result might be an array directly (fallback)
                        const dataArray = Array.isArray(result) ? result : (result?.ledger || []);
                        this.ledgerData = {
                            supplierName: result?.supplierName || 'Unknown Supplier',
                            ledger: dataArray
                        };
                        this.dataSource.data = dataArray;
                        this.currentBalance = dataArray.length > 0 ? dataArray[0].balance : 0;
                    }
                },
                error: (err) => {
                    this.updateLoading(-1);
                    console.error('Error fetching ledger:', err);

                    if (err.status === 404) {
                        this.ledgerData = { supplierName: 'Not Found', ledger: [] };
                        this.dataSource.data = [];
                        this.currentBalance = 0;
                    } else {
                        this.ledgerData = null;
                        this.dataSource.data = [];
                        alert('Failed to fetch ledger. Please check Supplier ID.');
                    }
                }
            });
        }
    }

}
