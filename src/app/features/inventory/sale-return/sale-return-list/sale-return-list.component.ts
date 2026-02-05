import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { MaterialModule } from '../../../../shared/material/material/material-module';
import { SaleReturnService } from '../services/sale-return.service';
import { CreditNoteViewComponent } from '../credit-note-view/credit-note-view.component';
import { MatDialog } from '@angular/material/dialog';

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

    @ViewChild(MatPaginator) paginator!: MatPaginator;
    @ViewChild(MatSort) sort!: MatSort;

    ngOnInit(): void {
        this.loadReturns();
    }

    loadReturns() {
        this.isTableLoading = true;

        const start = this.fromDate ? this.fromDate.toISOString() : undefined;
        const end = this.toDate ? this.toDate.toISOString() : undefined;
        const sortField = this.sort?.active || 'ReturnDate';
        const sortOrder = this.sort?.direction || 'desc';

        this.srService.getSaleReturns(
            this.searchKey,
            this.pageIndex,
            this.pageSize,
            start,
            end,
            sortField,
            sortOrder
        ).subscribe({
            next: (res) => {
                this.dataSource.data = res.items || [];
                this.totalRecords = res.totalCount || 0;
                this.isTableLoading = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error("Load Error:", err);
                this.isTableLoading = false;
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
        this.pageIndex = 0;
        this.loadReturns();
    }

    navigateToCreate() {
        this.router.navigate(['/app/inventory/sale-return/add']);
    }

    viewCreditNote(row: any) {
        // Navigate to view or open dialog
        this.router.navigate(['/app/inventory/sale-return/credit-note', row.id]);
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
