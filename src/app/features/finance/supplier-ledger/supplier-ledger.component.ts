import { Component, ViewChild, AfterViewInit, OnInit, OnDestroy, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute } from '@angular/router';
import { FinanceService } from '../service/finance.service';
import { MaterialModule } from '../../../shared/material/material/material-module';
import { LoadingService } from '../../../core/services/loading.service';
import { SupplierService, Supplier } from '../../inventory/service/supplier.service';
import { Observable, Subscription } from 'rxjs';
import { map, startWith, finalize } from 'rxjs/operators';


@Component({
    selector: 'app-supplier-ledger',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule, MaterialModule],
    templateUrl: './supplier-ledger.component.html',
    styleUrl: './supplier-ledger.component.scss'
})
export class SupplierLedgerComponent implements OnInit, AfterViewInit, OnDestroy {

    supplierControl = new FormControl('');
    filteredSuppliers!: Observable<Supplier[]>;
    suppliers: Supplier[] = [];

    supplierId: number | null = null;
    ledgerData: any = null;
    displayedColumns: string[] = ['transactionDate', 'transactionType', 'referenceId', 'description', 'debit', 'credit', 'balance'];
    dataSource = new MatTableDataSource<any>([]);
    currentBalance: number = 0;
    isDashboardLoading: boolean = true;
    private isFirstLoad: boolean = true;
    private routeSub!: Subscription;


    @ViewChild(MatPaginator) paginator!: MatPaginator;
    @ViewChild(MatSort) sort!: MatSort;

    constructor(
        private financeService: FinanceService,
        private loadingService: LoadingService,
        private supplierService: SupplierService,
        private route: ActivatedRoute,
        private cdr: ChangeDetectorRef
    ) {
    }

    ngOnInit() {
        this.isDashboardLoading = true;
        this.isFirstLoad = true;
        this.loadingService.setLoading(true);

        this.loadSuppliers();

        this.filteredSuppliers = this.supplierControl.valueChanges.pipe(
            startWith(''),
            map(value => {
                if (typeof value === 'string') return value;
                return (value as any)?.name || '';
            }),
            map(name => name ? this._filter(name) : this.suppliers.slice())
        );

        // Safety timeout
        setTimeout(() => {
            if (this.isDashboardLoading) {
                this.isDashboardLoading = false;
                this.isFirstLoad = false;
                this.loadingService.setLoading(false);
                this.cdr.detectChanges();
            }
        }, 10000);
    }

    private _filter(name: string): Supplier[] {
        const filterValue = name.toLowerCase();
        return this.suppliers.filter(supplier =>
            (supplier.name && supplier.name.toLowerCase().includes(filterValue)) ||
            (supplier.id && supplier.id.toString().includes(filterValue))
        );
    }

    displayFn(supplier: Supplier): string {
        return supplier && supplier.name ? `${supplier.name} (#${supplier.id})` : '';
    }

    loadSuppliers() {
        this.supplierService.getSuppliers().subscribe(data => {
            this.suppliers = data;

            // Check query params after lookups are loaded
            this.routeSub = this.route.queryParams.subscribe(params => {
                const sid = params['supplierId'];
                if (sid) {
                    this.supplierId = Number(sid);
                    this.preselectSupplier(this.supplierId);
                    this.loadLedger();
                    return; // loadLedger handles loader
                }

                // If no supplier in route, stop loader
                if (this.isFirstLoad) {
                    this.isFirstLoad = false;
                    this.isDashboardLoading = false;
                    this.loadingService.setLoading(false);
                    this.cdr.detectChanges();
                }
            });

            this.cdr.detectChanges();
        });
    }

    onSupplierSelected(event: any) {
        const supplier = event.option.value as Supplier;
        this.supplierId = supplier.id!;
        this.loadLedger();
    }

    preselectSupplier(id: number) {
        const supplier = this.suppliers.find(s => s.id === id);
        if (supplier) {
            this.supplierControl.setValue(supplier as any);
        }
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
            this.financeService.getSupplierLedger(this.supplierId).subscribe({
                next: (result: any) => {
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

                    if (this.isFirstLoad) {
                        this.isFirstLoad = false;
                        this.isDashboardLoading = false;
                        this.loadingService.setLoading(false);
                    }
                    this.cdr.detectChanges();
                },
                error: (err) => {
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

                    if (this.isFirstLoad) {
                        this.isFirstLoad = false;
                        this.isDashboardLoading = false;
                        this.loadingService.setLoading(false);
                    }
                    this.cdr.detectChanges();
                }
            });
        }
    }

}
