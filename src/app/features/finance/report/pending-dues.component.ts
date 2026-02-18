import { Component, ViewChild, AfterViewInit, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { FinanceService } from '../service/finance.service';
import { MaterialModule } from '../../../shared/material/material/material-module';
import { LoadingService } from '../../../core/services/loading.service';
import { SupplierService, Supplier } from '../../inventory/service/supplier.service';
import { Observable } from 'rxjs';
import { finalize, map, startWith, tap } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { PaymentReportComponent } from './payment-report.component';

export interface DuesData {
    supplierId?: number;
    SupplierId?: number;
    supplierName?: string;
    SupplierName?: string;
    pendingAmount?: number;
    PendingAmount?: number;
    status?: string;
    Status?: string;
    dueDate?: string | Date;
    DueDate?: string | Date;
}

@Component({
    selector: 'app-pending-dues',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule, MaterialModule],
    templateUrl: './pending-dues.component.html',
    styleUrl: './pending-dues.component.scss'
})
export class PendingDuesComponent implements AfterViewInit, OnInit {
    searchControl = new FormControl('');
    filteredOptions!: Observable<any[]>;
    allDues: any[] = [];
    suppliers: Supplier[] = [];

    displayedColumns: string[] = ['supplierId', 'supplierName', 'pendingAmount', 'dueDate', 'status', 'actions'];
    dataSource = new MatTableDataSource<any>([]);
    isLoading = false;
    isDashboardLoading = true;
    private isFirstLoad = true;

    errorMessage = '';
    totalPendingAmount = 0;
    overdueAmount = 0;
    overdueCount = 0;

    @ViewChild(MatPaginator) paginator!: MatPaginator;
    @ViewChild(MatSort) sort!: MatSort;

    constructor(
        private financeService: FinanceService,
        private loadingService: LoadingService,
        private supplierService: SupplierService,
        private router: Router,
        private dialog: MatDialog,
        private cdr: ChangeDetectorRef
    ) {
        this.loadSuppliers();
    }

    loadSuppliers() {
        this.supplierService.getSuppliers().subscribe(data => {
            this.suppliers = data;
        });
    }

    ngOnInit() {
        this.isDashboardLoading = true;
        this.isFirstLoad = true;
        this.loadingService.setLoading(true);

        this.loadPendingDues();

        // Custom filter predicate for table
        this.dataSource.filterPredicate = (data: any, filter: string) => {
            const name = (data.supplierName || '').toLowerCase();
            const id = (data.supplierId || '').toString().toLowerCase();
            const filterValue = filter.toLowerCase();
            return name.includes(filterValue) || id.includes(filterValue);
        };

        // Setup Autocomplete (Searching from ALL suppliers)
        this.filteredOptions = this.searchControl.valueChanges.pipe(
            startWith(''),
            tap(value => {
                const val = value as any;
                const searchStr = typeof value === 'string' ? value : (val?.name || '');
                this.applyFilter(searchStr);
            }),
            map(value => {
                const searchVal = value as any;
                const filterValue = typeof value === 'string' ? value.toLowerCase() : (searchVal?.name || '').toLowerCase();
                return this.suppliers.filter(supplier => {
                    const name = supplier.name || '';
                    const id = supplier.id || '';
                    return name.toLowerCase().includes(filterValue) || id.toString().includes(filterValue);
                });
            })
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

    displayFn(supplier: any): string {
        if (!supplier) return '';
        const name = supplier.name || supplier.supplierName || '';
        const id = supplier.id || supplier.supplierId || '';
        return name ? `${name} (#${id})` : '';
    }

    get searchDisplayText(): string {
        const value = this.searchControl.value as any;
        if (!value) return '';
        return typeof value === 'string' ? value : (value?.name || value?.supplierName || '');
    }

    ngAfterViewInit() {
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
    }

    private updateLoading(status: boolean) {
        this.isLoading = status;
        this.loadingService.setLoading(status);
    }

    loadPendingDues() {
        this.updateLoading(true);
        this.errorMessage = '';

        this.financeService.getPendingDues().pipe(
            finalize(() => {
                this.updateLoading(false);
                if (this.isFirstLoad) {
                    this.isFirstLoad = false;
                    this.isDashboardLoading = false;
                    this.loadingService.setLoading(false);
                    this.cdr.detectChanges();
                }
            })
        ).subscribe({
            next: (data: any[]) => {
                this.allDues = data || [];
                this.dataSource.data = [...this.allDues];

                // Calculate summaries
                const today = new Date();
                this.totalPendingAmount = this.allDues.reduce((sum, item) => sum + (item.pendingAmount || 0), 0);
                this.overdueAmount = this.allDues
                    .filter(item => new Date(item.dueDate) < today && (item.pendingAmount || 0) > 0)
                    .reduce((sum, item) => sum + (item.pendingAmount || 0), 0);
                this.overdueCount = this.allDues
                    .filter(item => new Date(item.dueDate) < today && (item.pendingAmount || 0) > 0)
                    .length;

                if (this.dataSource.data.length === 0) {
                    console.log('No pending dues found');
                }
            },
            error: (err) => {
                console.error('Error fetching pending dues:', err);
                this.errorMessage = 'Failed to load pending dues. Please check your connection.';
                this.allDues = [];
                this.dataSource.data = [];
            }
        });
    }

    onOptionSelected(event: any) {
        const supplier = event.option.value;
        const name = supplier.name || supplier.supplierName || '';
        this.applyFilter(name);
    }

    applyFilter(value: string) {
        this.dataSource.filter = value.trim().toLowerCase();
        if (this.dataSource.paginator) {
            this.dataSource.paginator.firstPage();
        }
    }

    makePayment(element: any) {
        this.router.navigate(['/app/finance/suppliers/payment'], {
            queryParams: {
                supplierId: element.supplierId,
                amount: element.pendingAmount,
                currentDue: element.pendingAmount
            }
        });
    }

    viewLedger(supplierId: number) {
        this.router.navigate(['/app/finance/suppliers/ledger'], {
            queryParams: { supplierId }
        });
    }

    viewPaymentHistory(supplierId?: number) {
        const id = supplierId || (this.searchControl.value as any)?.supplierId || (this.searchControl.value as any)?.id;

        this.dialog.open(PaymentReportComponent, {
            width: '90vw',
            maxWidth: '1200px',
            maxHeight: '90vh',
            data: { supplierId: id },
            disableClose: true,
            panelClass: 'professional-dialog'
        });
    }

    clearSearch() {
        this.searchControl.setValue('');
        this.applyFilter('');
    }
}
