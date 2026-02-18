import { Component, ViewChild, AfterViewInit, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, FormsModule } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MaterialModule } from '../../../shared/material/material/material-module';
import { FinanceService } from '../service/finance.service';
import { MatDialog } from '@angular/material/dialog';
import { StatusDialogComponent } from '../../../shared/components/status-dialog-component/status-dialog-component';
import { Router } from '@angular/router';
import { LoadingService } from '../../../core/services/loading.service';
import { customerService } from '../../master/customer-component/customer.service';
import { Observable, map, startWith } from 'rxjs';

export interface OutstandingData {
    customerId: number;
    customerName: string;
    totalAmount: number;
    pendingAmount: number;
    status: string;
    dueDate: string;
}

@Component({
    selector: 'app-outstanding-tracker',
    standalone: true,
    imports: [CommonModule, MaterialModule, ReactiveFormsModule, FormsModule],
    templateUrl: './outstanding-tracker.component.html',
    styleUrl: './outstanding-tracker.component.scss'
})
export class OutstandingTrackerComponent implements AfterViewInit, OnInit {
    displayedColumns: string[] = ['customerId', 'customerName', 'lastReferenceId', 'totalAmount', 'pendingAmount', 'status', 'dueDate', 'actions'];
    dataSource = new MatTableDataSource<OutstandingData>([]);
    isDashboardLoading: boolean = true;
    private isFirstLoad: boolean = true;
    isLoading: boolean = false;

    // Server-side State
    totalCount = 0;
    pageSize = 10;
    pageNumber = 1;
    sortBy = 'CustomerName';
    sortOrder = 'asc';
    totalOutstandingAmount = 0;
    overdueAmount = 0;
    overdueCount = 0;

    filters = {
        status: '',
        customerName: ''
    };

    // Search & Autocomplete
    searchControl = new FormControl<string | any>('');
    customers: any[] = [];
    filteredCustomers!: Observable<any[]>;

    private loadingService = inject(LoadingService);
    private cdr = inject(ChangeDetectorRef);
    private customerService = inject(customerService);

    @ViewChild(MatPaginator) paginator!: MatPaginator;
    @ViewChild(MatSort) sort!: MatSort;

    constructor(
        private financeService: FinanceService,
        private dialog: MatDialog,
        private router: Router
    ) { }

    ngOnInit() {
        this.isDashboardLoading = true;
        this.isFirstLoad = true;
        this.loadingService.setLoading(true);

        this.loadCustomers();

        // Autocomplete filtering (Local for lookup)
        this.filteredCustomers = this.searchControl.valueChanges.pipe(
            startWith(''),
            map(value => {
                const name = typeof value === 'string' ? value : value?.name;
                return name ? this._filter(name) : this.customers.slice();
            })
        );

        // Param check or initial load
        this.loadOutstandingData();

        // Safety timeout
        setTimeout(() => {
            if (this.isDashboardLoading) {
                this.isFirstLoad = false;
                this.isDashboardLoading = false;
                this.loadingService.setLoading(false);
                this.cdr.detectChanges();
            }
        }, 10000);
    }

    private _filter(value: string): any[] {
        const filterValue = value.toLowerCase();
        return this.customers.filter(c =>
            c.name.toLowerCase().includes(filterValue) ||
            c.id.toString().includes(filterValue)
        );
    }

    loadCustomers() {
        this.customerService.getCustomersLookup().subscribe(data => {
            this.customers = data || [];
        });
    }

    onCustomerSelected(event: any) {
        const customer = event.option.value;
        const searchName = customer.name || '';
        this.applyFilterValue(searchName);
    }

    handleKeyUp(event: KeyboardEvent) {
        if (event.key === 'Enter') {
            const value = this.searchControl.value;
            const searchStr = typeof value === 'string' ? value : (value?.name || '');
            this.applyFilterValue(searchStr);
        }
    }

    applyFilterValue(value: string) {
        this.pageNumber = 1;
        if (this.paginator) this.paginator.pageIndex = 0;
        this.loadOutstandingData();
    }

    onPageChange(event: any) {
        this.pageNumber = event.pageIndex + 1;
        this.pageSize = event.pageSize;
        this.loadOutstandingData();
    }

    onSortChange(event: any) {
        this.sortBy = event.active || 'CustomerName';
        this.sortOrder = event.direction || 'asc';
        this.updateReport();
    }

    updateReport() {
        this.pageNumber = 1;
        if (this.paginator) this.paginator.pageIndex = 0;
        this.loadOutstandingData();
    }

    clearFilter(column: string) {
        if (column === 'status') this.filters.status = '';
        if (column === 'customerName') this.filters.customerName = '';
        this.updateReport();
    }

    displayFn(customer: any): string {
        return customer && customer.name ? customer.name : '';
    }

    get searchDisplayText(): string {
        const value = this.searchControl.value;
        if (!value) return '';
        return typeof value === 'string' ? value : (value?.name || '');
    }

    ngAfterViewInit() {
        // Handled via onSortChange/onPageChange
    }

    loadOutstandingData() {
        this.isLoading = true;
        const value = this.searchControl.value;
        const searchTerm = typeof value === 'string' ? value : (value?.name || '');

        const request = {
            searchTerm: searchTerm,
            statusFilter: this.filters.status,
            customerNameFilter: this.filters.customerName,
            pageNumber: this.pageNumber,
            pageSize: this.pageSize,
            sortBy: this.sortBy,
            sortOrder: this.sortOrder
        };

        this.financeService.getOutstandingTracker(request).subscribe({
            next: (res: any) => {
                this.isLoading = false;
                if (res && res.items) {
                    this.dataSource.data = res.items.items || [];
                    this.totalCount = res.items.totalCount || 0;
                    this.totalOutstandingAmount = res.totalOutstandingAmount || 0;

                    // Simple heuristic for summary: count items in current page that are overdue
                    const today = new Date();
                    this.overdueAmount = (res.items.items || [])
                        .filter((item: any) => new Date(item.dueDate) < today && item.pendingAmount > 0)
                        .reduce((sum: number, item: any) => sum + item.pendingAmount, 0);

                    this.overdueCount = (res.items.items || [])
                        .filter((item: any) => new Date(item.dueDate) < today && item.pendingAmount > 0)
                        .length;
                } else {
                    this.dataSource.data = [];
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
                console.error('Error fetching outstanding tracker:', err);
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

    viewLedger(customerId: number) {
        this.router.navigate(['/app/finance/customers/ledger'], {
            queryParams: { customerId: customerId }
        });
    }

    recordPayment(customer: any) {
        this.router.navigate(['/app/finance/customers/receipt'], {
            queryParams: {
                customerId: customer.customerId,
                amount: customer.pendingAmount
            }
        });
    }

    applyFilter(event: Event) {
        const filterValue = (event.target as HTMLInputElement).value;
        this.applyFilterValue(filterValue);
    }

    clearSearch() {
        this.searchControl.setValue('');
        this.applyFilterValue('');
    }
}
