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
    displayedColumns: string[] = ['customerId', 'customerName', 'totalAmount', 'pendingAmount', 'status', 'dueDate', 'actions'];
    dataSource = new MatTableDataSource<OutstandingData>([]);
    isDashboardLoading: boolean = true;
    private isFirstLoad: boolean = true;

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

        this.loadOutstandingData();
        this.loadCustomers();

        // Autocomplete filtering
        this.filteredCustomers = this.searchControl.valueChanges.pipe(
            startWith(''),
            map(value => {
                const name = typeof value === 'string' ? value : value?.name;
                return name ? this._filter(name) : this.customers.slice();
            })
        );

        // Custom filter predicate
        this.dataSource.filterPredicate = (data, filter) => {
            const searchStr = filter.toLowerCase();
            return data.customerName.toLowerCase().includes(searchStr) ||
                data.customerId.toString().includes(searchStr);
        };

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
        this.dataSource.filter = value.trim().toLowerCase();
        if (this.dataSource.paginator) {
            this.dataSource.paginator.firstPage();
        }
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
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
    }

    loadOutstandingData() {
        this.financeService.getOutstandingTracker().subscribe({
            next: (data) => {
                this.dataSource.data = data;
                if (this.isFirstLoad) {
                    this.isFirstLoad = false;
                    this.isDashboardLoading = false;
                    this.loadingService.setLoading(false);
                }
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('Error fetching outstanding tracker:', err);
                this.dialog.open(StatusDialogComponent, {
                    data: {
                        isSuccess: false,
                        message: 'Failed to load outstanding data. Please check your connection.',
                        status: 'error'
                    }
                });
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
