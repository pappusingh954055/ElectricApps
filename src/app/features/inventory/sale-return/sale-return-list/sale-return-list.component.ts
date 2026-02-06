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
import { SaleReturnDetailsModal } from '../sale-return-details-modal/sale-return-details-modal';


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

    sortField = 'ReturnDate';
    sortOrder = 'desc';

    // Analytics Widgets State [cite: 2026-02-06]
    stats = {
        todayCount: 0,
        totalRefund: 0,
        itemsReturned: 0,
        confirmedReturns: 0
    };

    filterValues: any = {
        returnNumber: '',
        customerName: ''
    };

    @ViewChild(MatPaginator) paginator!: MatPaginator;
    @ViewChild(MatSort) sort!: MatSort;

    ngOnInit(): void {
        this.loadReturns();
    }

    // New: Calculate Stats for Widgets [cite: 2026-02-06]
    private calculateStats(items: any[]) {
        if (!items || items.length === 0) {
            this.stats = { todayCount: 0, totalRefund: 0, itemsReturned: 0, confirmedReturns: 0 };
            return;
        }

        const todayStr = new Date().toDateString();

        // 1. Today's Returns Count
        this.stats.todayCount = items.filter(x => new Date(x.returnDate).toDateString() === todayStr).length;

        // 2. Total Refund Value mapping to totalAmount
        this.stats.totalRefund = items.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);

        // 3. Confirmed Returns count
        this.stats.confirmedReturns = items.filter(x => x.status?.toUpperCase() === 'CONFIRMED').length;

        // 4. Physical items returned back to stock
        // This sums up the total quantity across all return records
        this.stats.itemsReturned = items.reduce((acc, curr) => acc + (curr.totalQty || 0), 0);
    }

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

    onSortChange(sort: Sort) {
        this.sortField = sort.active;
        this.sortOrder = sort.direction || 'desc';
        this.loadReturns();
    }

    loadReturns() {
        this.isTableLoading = true;
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
                    console.log('resdata', res);
                    this.dataSource.data = res.items;
                    this.totalRecords = res.totalCount;

                    // Refresh widgets based on loaded data [cite: 2026-02-06]
                    this.calculateStats(res.items);

                    this.isTableLoading = false;
                    this.cdr.detectChanges();
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
        const id = row.saleReturnHeaderId;
        this.isTableLoading = true;
        this.srService.getPrintData(id).subscribe({
            next: (res) => {
                console.log('modal data', res);
                this.isTableLoading = false;

                const modalData = {
                    ...res,
                    saleReturnHeaderId: id
                };

                this.dialog.open(SaleReturnDetailsModal, {
                    width: '850px',
                    data: modalData,
                    panelClass: 'custom-modalbox'
                });

                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error("Popup data fetch failed", err);
                this.isTableLoading = false;
                this.cdr.detectChanges();
            }
        });
    }

    printCreditNote(row: any) {
        const returnId = row.saleReturnHeaderId;

        if (!returnId) {
            console.error("ID is missing! Check if 'saleReturnHeaderId' exists in row.");
            return;
        }

        this.isTableLoading = true;

        this.srService.printCreditNote(returnId).subscribe({
            next: (blob: Blob) => {
                const fileURL = URL.createObjectURL(blob);
                window.open(fileURL, '_blank');


                setTimeout(() => URL.revokeObjectURL(fileURL), 100);

                this.isTableLoading = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error("PDF generation failed", err);
                this.isTableLoading = false;
                this.cdr.detectChanges();
            }
        });
    }

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
                this.srService.deleteSaleReturn(row.id).subscribe(() => {
                    this.loadReturns();
                });
            }
        });
    }

    exportToExcel() {

        this.isExportLoading = true;
        this.cdr.detectChanges();


        const start = this.fromDate ? new Date(this.fromDate).toISOString() : undefined;
        const end = this.toDate ? new Date(this.toDate).toISOString() : undefined;


        this.srService.downloadExcel(start, end).subscribe({
            next: (blob: Blob) => {
                if (blob.size > 0) {

                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;


                    const fileName = `SaleReturns_${new Date().toISOString().split('T')[0]}.xlsx`;
                    link.download = fileName;


                    link.click();


                    window.URL.revokeObjectURL(url);
                } else {
                    console.warn("Bhai, Excel file khali (empty) hai!");
                }

                this.isExportLoading = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error("Excel Export Error:", err);
                this.isExportLoading = false;
                this.cdr.detectChanges();

            }
        });
    }
}