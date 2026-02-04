import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnInit, ViewChild } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { MaterialModule } from '../../../../shared/material/material/material-module';
import { PurchaseReturnService } from '../services/purchase-return.service';
import { PRPrintComponent } from '../prprint-component/prprint-component';
import { FormsModule } from '@angular/forms';
import { PurchaseReturnView } from '../purchase-return-view/purchase-return-view';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-purchase-return-list',
  standalone: true,
  imports: [CommonModule, MaterialModule, PRPrintComponent, FormsModule],
  templateUrl: './purchase-return-list.html',
  styleUrl: './purchase-return-list.scss',
})
export class PurchaseReturnList implements OnInit {
  private prService = inject(PurchaseReturnService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  dataSource = new MatTableDataSource<any>();
  displayedColumns: string[] = ['returnNumber', 'returnDate', 'supplierName', 'grnRef', 'totalAmount', 'status', 'actions'];

  // Separate Loading States [cite: 2026-02-04]
  isTableLoading = false;
  isExportLoading = false;

  selectedReturn: any;
  searchKey: string = "";
  fromDate: Date | null = null;
  toDate: Date | null = null;

  totalRecords = 0;
  pageSize = 10;
  pageIndex = 0;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  private dialog = inject(MatDialog);

  ngOnInit(): void {
    this.loadReturns();
  }

  loadReturns() {
    this.isTableLoading = true; // Table specific loader [cite: 2026-02-04]

    const start = this.fromDate ? this.fromDate.toISOString() : undefined;
    const end = this.toDate ? this.toDate.toISOString() : undefined;

    this.prService.getPurchaseReturns(this.searchKey, this.pageIndex, this.pageSize, start, end).subscribe({
      next: (res) => {
        this.dataSource.data = res.data || res.items;
        console.log('Purchase Return List Data:', this.dataSource.data);
        this.totalRecords = res.total || res.totalCount;
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
    this.router.navigate(['/app/inventory/purchase-return/add']);
  }

  viewDetails(row: any) {
    this.isTableLoading = true;
    this.prService.getPurchaseReturnById(row.id).subscribe({
      next: (res) => {
        console.log('popupdata', res);
        this.isTableLoading = false;
        this.dialog.open(PurchaseReturnView, {
          width: '800px',
          data: res
        });
        this.cdr.detectChanges();
      },
      error: () => {
        this.isTableLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  printReturn(row: any) {
    this.isTableLoading = true;
    this.prService.getPurchaseReturnById(row.id).subscribe({
      next: (res) => {
        this.selectedReturn = res;
        this.isTableLoading = false;
        this.cdr.detectChanges();

        setTimeout(() => {
          this.executePrint();
        }, 500);
      },
      error: (err) => {
        this.isTableLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private executePrint() {
    const printContents = document.getElementById('print-area')?.innerHTML;
    if (!printContents) return;

    const printWindow = window.open('', '_blank', 'top=0,left=0,height=1000,width=1000');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Debit Note - ${this.selectedReturn.returnNumber}</title>
            <style>
              .debit-note-container { padding: 20px; font-family: sans-serif; }
              .header { display: flex; justify-content: space-between; margin-bottom: 20px; }
              .print-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              .print-table th, .print-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              .text-end { text-align: right; }
              .grand-total { font-weight: bold; font-size: 1.2em; }
            </style>
          </head>
          <body onload="window.print();window.close()">${printContents}</body>
        </html>
      `);
      printWindow.document.close();
    }
  }

  exportToExcel() {
    this.isExportLoading = true; // Button specific loader [cite: 2026-02-04]
    const start = this.fromDate ? this.fromDate.toISOString() : undefined;
    const end = this.toDate ? this.toDate.toISOString() : undefined;

    this.prService.downloadExcel(start, end).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `PurchaseReturns_${new Date().toISOString().split('T')[0]}.xlsx`;
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