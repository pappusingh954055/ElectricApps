import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { MaterialModule } from '../../../../shared/material/material/material-module';
import { SaleReturnService } from '../services/sale-return.service';
import { MatDialog } from '@angular/material/dialog';
import { StatusDialogComponent } from '../../../../shared/components/status-dialog-component/status-dialog-component';


@Component({
    selector: 'app-sale-return-list',
    standalone: true,
    imports: [CommonModule, MaterialModule, FormsModule],
    templateUrl: './sale-return-list.component.html',
    styleUrl: './sale-return-list.component.scss',
})
export class SaleReturnListComponent implements OnInit {
    private srService = inject(SaleReturnService);
    private router = inject(Router);
    private cdr = inject(ChangeDetectorRef);
    private dialog = inject(MatDialog);

    dataSource = new MatTableDataSource<any>();
    displayedColumns: string[] = ['returnNumber', 'returnDate', 'customerName', 'soRef', 'totalAmount', 'status', 'actions'];

    isTableLoading = false;
    isExportLoading = false;

    searchKey: string = "";
    fromDate: Date | null = null;
    toDate: Date | null = null;

    totalRecords = 0;
    pageSize = 10;
    pageIndex = 0;

    // Sorting state initialized for backend sync [cite: 2026-02-05]
    sortField = 'ReturnDate';
    sortOrder = 'desc';

    // Existing column filters
    filterValues: any = {
        returnNumber: '',
        customerName: ''
    };

    @ViewChild(MatPaginator) paginator!: MatPaginator;
    @ViewChild(MatSort) sort!: MatSort;

    ngOnInit(): void {
        this.loadReturns();
    }

    // Existing: Apply column specific filter logic maintained
    applyColumnFilter(key: string, value: any) {
        this.filterValues[key] = value;
        const activeFilters = Object.values(this.filterValues).filter(v => v !== '');

        if (activeFilters.length > 0) {
            this.searchKey = activeFilters.join(' ');
        } else {
            this.searchKey = '';
        }

        this.pageIndex = 0;
        this.loadReturns();
    }

    clearColumnFilter(key: string) {
        this.filterValues[key] = '';
        this.applyColumnFilter(key, '');
    }

    // NEW: Handle Sort Change event from HTML [cite: 2026-02-05]
    onSortChange(sort: Sort) {
        this.sortField = sort.active;
        this.sortOrder = sort.direction || 'desc';
        this.loadReturns();
    }

    loadReturns() {
        this.isTableLoading = true; // Loader dikhane ke liye
        this.srService.getSaleReturns(
            this.searchKey,
            this.pageIndex,
            this.pageSize,
            this.sortField,
            this.sortOrder, 
            this.fromDate || undefined, 
            this.toDate || undefined 
        )
            .subscribe({
                next: (res) => {
                    console.log('resdata',res);
                    this.dataSource.data = res.items;
                    this.totalRecords = res.totalCount;
                    this.isTableLoading = false;
                    this.cdr.detectChanges(); // UI refresh ke liye
                },
                error: (err) => {
                    console.error("Error loading returns", err);
                    this.isTableLoading = false;
                }
            });
    }

    onPageChange(event: PageEvent) {
        this.pageIndex = event.pageIndex;
        this.pageSize = event.pageSize;
        this.loadReturns();
    }

    applySearch(event: Event) {
        const filterValue = (event.target as HTMLInputElement).value;
        this.searchKey = filterValue.trim().toLowerCase();
        this.pageIndex = 0;
        this.loadReturns();
    }

    navigateToCreate() {
        this.router.navigate(['/app/inventory/sale-return/add']);
    }

    viewCreditNote(row: any) {
        this.router.navigate(['/app/inventory/sale-return/details', row.id]);
    }

    // NEW: Print Functionality linked to Service [cite: 2026-02-05]
    printCreditNote(row: any) {
        const printUrl = `https://localhost:7052/api/SaleReturn/print/${row.id}`;
        window.open(printUrl, '_blank');
    }

    // NEW: Delete Draft Logic with Confirmation [cite: 2026-02-05]
    deleteReturn(row: any) {
        const dialogRef = this.dialog.open(StatusDialogComponent, {
            data: {
                title: 'Confirm Delete',
                message: `Are you sure you want to delete ${row.returnNumber}?`,
                isConfirm: true
            }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                // Triggering delete through existing service structure
                this.srService.deleteSaleReturn(row.id).subscribe(() => {
                    this.loadReturns();
                });
            }
        });
    }

    exportToExcel() {
        this.isExportLoading = true;
        const start = this.fromDate ? this.fromDate.toISOString() : undefined;
        const end = this.toDate ? this.toDate.toISOString() : undefined;

        this.srService.downloadExcel(start, end).subscribe({
            next: (blob: Blob) => {
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `SaleReturns_${new Date().toISOString().split('T')[0]}.xlsx`;
                link.click();
                window.URL.revokeObjectURL(url);
                this.isExportLoading = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                this.isExportLoading = false;
                this.cdr.detectChanges();
            }
        });
    }
}