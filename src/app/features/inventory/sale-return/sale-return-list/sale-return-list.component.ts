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
import { LoadingService } from '../../../../core/services/loading.service';
import { GatePassService } from '../../gate-pass/services/gate-pass.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
    selector: 'app-sale-return-list',
    standalone: true,
    imports: [CommonModule, MaterialModule, FormsModule],
    templateUrl: './sale-return-list.component.html',
    styleUrl: './sale-return-list.component.scss',
})
export class SaleReturnListComponent implements OnInit {
    private srService = inject(SaleReturnService);
    private gatePassService = inject(GatePassService);
    private router = inject(Router);
    private cdr = inject(ChangeDetectorRef);
    private dialog = inject(MatDialog);

    dataSource = new MatTableDataSource<any>();
    displayedColumns: string[] = ['returnNumber', 'gatePassNo', 'returnDate', 'customerName', 'soRef', 'totalAmount', 'status', 'actions'];

    isTableLoading = true;
    isDashboardLoading: boolean = true;
    private isFirstLoad: boolean = true;
    private loadingService = inject(LoadingService);
    isExportLoading = false;

    searchKey: string = "";
    fromDate: Date | null = null;
    toDate: Date | null = null;

    // Active Filter State for Widgets
    activeStatus: string = "";

    totalRecords = 0;
    pageSize = 10;
    pageIndex = 0;

    sortField = 'ReturnDate';
    sortOrder = 'desc';

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

    summaryData: any = {
        totalReturnsToday: 0,
        totalRefundValue: 0,
        stockRefilledPcs: 0,
        confirmedReturns: 0
    };

    @ViewChild(MatPaginator) paginator!: MatPaginator;
    @ViewChild(MatSort) sort!: MatSort;

    ngOnInit(): void {
        // Global loader ON
        this.isDashboardLoading = true;
        this.isFirstLoad = true;
        this.loadingService.setLoading(true);
        this.cdr.detectChanges();

        this.loadDashboardSummary();
        this.loadReturns();

        // Safety timeout - force stop loader after 10 seconds
        setTimeout(() => {
            if (this.isDashboardLoading) {
                console.warn('[SaleReturnList] Force stopping loader after 10s timeout');
                this.isDashboardLoading = false;
                this.isFirstLoad = false;
                this.loadingService.setLoading(false);
                this.cdr.detectChanges();
            }
        }, 10000);
    }

    loadDashboardSummary() {
        this.srService.getDashboardSummary().subscribe({
            next: (data) => {
                this.summaryData = data;
                this.cdr.detectChanges();
            },
            error: (err) => console.error("Summary load failed", err)
        });
    }


    filterByStatus(status: string) {
        this.activeStatus = this.activeStatus === status ? '' : status;
        this.pageIndex = 0;
        this.loadReturns();
    }

    private calculateStats(items: any[]) {
        if (!items || items.length === 0) {
            this.stats = { todayCount: 0, totalRefund: 0, itemsReturned: 0, confirmedReturns: 0 };
            return;
        }

        const todayStr = new Date().toDateString();

        this.stats.todayCount = items.filter(x => new Date(x.returnDate).toDateString() === todayStr).length;
        this.stats.totalRefund = items.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);
        this.stats.confirmedReturns = items.filter(x => x.status?.toUpperCase() === 'CONFIRMED').length;
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

        forkJoin({
            returns: this.srService.getSaleReturns(
                this.searchKey,
                this.pageIndex,
                this.pageSize,
                this.sortField,
                this.sortOrder,
                this.fromDate || undefined,
                this.toDate || undefined,
                this.activeStatus
            ),
            gatePasses: this.gatePassService.getGatePassesPaged({ pageSize: 150, sortField: 'CreatedAt', sortOrder: 'desc' }).pipe(catchError(() => of({ data: [] })))
        }).subscribe({
            next: (res: any) => {
                const returnData = res.returns;
                const gatePasses = res.gatePasses?.data || [];

                // 🚛 Match Returns with Gate Passes & Fix Timezone
                const processedItems = returnData.items.map((item: any) => {
                    // Fix Date to UTC if it doesn't have timezone info
                    if (item.returnDate && !item.returnDate.includes('Z')) {
                        item.returnDate = item.returnDate + 'Z';
                    }

                    // Match by RefNo (ReturnNumber)
                    const matchingPass = gatePasses.find((gp: any) => gp.referenceNo === item.returnNumber);
                    if (matchingPass) {
                        item.gatePassNo = matchingPass.passNo;
                    }
                    return item;
                });

                this.dataSource.data = processedItems;
                this.totalRecords = returnData.totalCount;
                this.calculateStats(returnData.items);
                this.isTableLoading = false;

                if (this.isFirstLoad) {
                    this.isFirstLoad = false;
                    this.isDashboardLoading = false;
                    this.loadingService.setLoading(false);
                }
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error("Error loading returns", err);
                this.isTableLoading = false;
                if (this.isFirstLoad) {
                    this.isFirstLoad = false;
                    this.isDashboardLoading = false;
                    this.loadingService.setLoading(false);
                }
                this.cdr.detectChanges();
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
        this.activeStatus = ''; // Search karne par status filter clear kar dein
        this.pageIndex = 0;
        this.loadReturns();
    }

    navigateToCreate() {
        this.router.navigate(['/app/inventory/sale-return/add']);
    }

    createInwardGatePass(row: any) {
        this.router.navigate(['/app/inventory/gate-pass/inward'], {
            queryParams: {
                type: 'sale-return',
                refNo: row.returnNumber,
                refId: row.saleReturnHeaderId || row.id,
                partyName: row.customerName,
                qty: row.totalQty || 1
            }
        });
    }

    viewCreditNote(row: any) {
        const id = row.saleReturnHeaderId;
        this.isTableLoading = true;
        this.srService.getPrintData(id).subscribe({
            next: (res) => {
                this.isTableLoading = false;
                const modalData = { ...res, saleReturnHeaderId: id };
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
        if (!returnId) return;

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