import { Component, ViewChild, AfterViewInit, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { FinanceService } from '../service/finance.service';
import { MaterialModule } from '../../../shared/material/material/material-module';
import { customerService } from '../../master/customer-component/customer.service';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { StatusDialogComponent } from '../../../shared/components/status-dialog-component/status-dialog-component';
import { ActivatedRoute, Router } from '@angular/router';
import { LoadingService } from '../../../core/services/loading.service';
import { ChangeDetectorRef } from '@angular/core';

@Component({
    selector: 'app-customer-ledger',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule, MaterialModule],
    templateUrl: './customer-ledger.component.html',
    styleUrl: './customer-ledger.component.scss'
})
export class CustomerLedgerComponent implements OnInit, AfterViewInit {
    customerControl = new FormControl('');
    filteredCustomers!: Observable<any[]>;
    customers: any[] = [];

    customerId: number | null = null;
    ledgerData: any = null;
    displayedColumns: string[] = ['transactionDate', 'transactionType', 'referenceId', 'description', 'debit', 'credit', 'balance'];
    dataSource = new MatTableDataSource<any>([]);
    currentBalance: number = 0;
    isLoading: boolean = false;
    isDashboardLoading: boolean = true;
    private isFirstLoad: boolean = true;

    // Server-side State
    totalCount = 0;
    pageSize = 10;
    pageNumber = 1;
    sortBy = 'TransactionDate';
    sortOrder = 'desc';

    filters = {
        startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        endDate: new Date(),
        type: '',
        reference: ''
    };

    @ViewChild(MatPaginator) paginator!: MatPaginator;
    @ViewChild(MatSort) sort!: MatSort;

    constructor(
        private financeService: FinanceService,
        private customerService: customerService,
        private dialog: MatDialog,
        private route: ActivatedRoute,
        private router: Router,
        private loadingService: LoadingService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit() {
        this.isDashboardLoading = true;
        this.isFirstLoad = true;
        this.loadingService.setLoading(true);

        this.loadCustomers();
        this.filteredCustomers = this.customerControl.valueChanges.pipe(
            startWith(''),
            map(value => {
                const name = typeof value === 'string' ? value : (value as any)?.name;
                return name ? this._filter(name as string) : this.customers.slice();
            }),
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

    ngAfterViewInit() {
        // Handled via onSortChange and onPageChange
    }

    onPageChange(event: any) {
        this.pageNumber = event.pageIndex + 1;
        this.pageSize = event.pageSize;
        this.loadLedger();
    }

    onSortChange(event: any) {
        this.sortBy = event.active || 'TransactionDate';
        this.sortOrder = event.direction || 'desc';
        this.pageNumber = 1;
        if (this.paginator) this.paginator.pageIndex = 0;
        this.loadLedger();
    }

    updateReport() {
        this.pageNumber = 1;
        if (this.paginator) this.paginator.pageIndex = 0;
        this.loadLedger();
    }

    clearFilter(column: string) {
        if (column === 'type') this.filters.type = '';
        if (column === 'reference') this.filters.reference = '';
        this.updateReport();
    }

    private _filter(name: string): any[] {
        const filterValue = name.toLowerCase();
        return this.customers.filter(customer =>
            (customer.name as string).toLowerCase().includes(filterValue) ||
            customer.id.toString().includes(filterValue)
        );
    }

    displayFn(customer: any): string {
        return customer && customer.name ? `${customer.name} (#${customer.id})` : '';
    }

    loadCustomers() {
        this.customerService.getCustomersLookup().subscribe((data: any) => {
            this.customers = Array.isArray(data) ? data : [];

            // Param check after load
            this.route.queryParams.subscribe(params => {
                if (params['customerId']) {
                    const id = Number(params['customerId']);
                    const customer = this.customers.find(c => c.id === id);
                    if (customer) {
                        this.customerControl.setValue(customer);
                        this.customerId = id;
                        this.loadLedger();
                        return; // loadLedger will handle stopping the loader
                    }
                }

                // If no customer to load, stop the loader here
                if (this.isFirstLoad) {
                    this.isFirstLoad = false;
                    this.isDashboardLoading = false;
                    this.loadingService.setLoading(false);
                    this.cdr.detectChanges();
                }
            });
        });
    }

    handleEnterKey() {
        if (this.customerId) {
            this.loadLedger();
        }
    }

    onCustomerSelected(event: any) {
        const customer = event.option.value;
        this.customerId = customer.id;
        this.loadLedger();
    }

    loadLedger() {
        if (this.customerId && this.customerId > 0) {
            this.isLoading = true;

            const request = {
                customerId: this.customerId,
                pageNumber: this.pageNumber,
                pageSize: this.pageSize,
                sortBy: this.sortBy,
                sortOrder: this.sortOrder,
                startDate: this.filters.startDate.toISOString(),
                endDate: this.filters.endDate.toISOString(),
                typeFilter: this.filters.type,
                referenceFilter: this.filters.reference,
                searchTerm: ''
            };

            this.financeService.getCustomerLedger(request).subscribe({
                next: (data: any) => {
                    this.isLoading = false;
                    this.ledgerData = data;
                    if (data && data.ledger) {
                        this.dataSource.data = data.ledger.items || [];
                        this.totalCount = data.ledger.totalCount || 0;
                        this.currentBalance = data.currentBalance || 0;
                    } else {
                        this.dataSource.data = [];
                        this.currentBalance = 0;
                        this.totalCount = 0;
                    }

                    if (this.isFirstLoad) {
                        this.isFirstLoad = false;
                        this.isDashboardLoading = false;
                        this.loadingService.setLoading(false);
                    }
                    this.cdr.detectChanges();
                },
                error: (err) => {
                    this.isLoading = false;
                    console.error('Error fetching ledger:', err);
                    this.ledgerData = null;
                    this.dataSource.data = [];
                    this.totalCount = 0;

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
    goToReceipt() {
        if (!this.customerId) return;
        this.router.navigate(['/app/finance/customers/receipt'], {
            queryParams: {
                customerId: this.customerId,
                amount: this.currentBalance
            }
        });
    }
}
