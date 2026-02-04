import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { MaterialModule } from '../../../../shared/material/material/material-module';
import { PurchaseReturnService } from '../services/purchase-return.service';
import { PRPrintComponent } from '../prprint-component/prprint-component';

@Component({
  selector: 'app-purchase-return-list',
  imports: [CommonModule, MaterialModule, PRPrintComponent],
  templateUrl: './purchase-return-list.html',
  styleUrl: './purchase-return-list.scss',
})
export class PurchaseReturnList implements OnInit {
  dataSource = new MatTableDataSource<any>();
  displayedColumns: string[] = ['returnNumber', 'returnDate', 'supplierName', 'grnRef', 'totalAmount', 'status', 'actions'];
  selectedReturn: any;
  totalRecords = 0;
  searchKey: string = "";
  isLoading = false;
  totalCount = 0;
  selectedReturnData: any;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private router: Router, private cdr: ChangeDetectorRef) { }

  private prService = inject(PurchaseReturnService);

  ngOnInit(): void {
    this.loadReturns();
  }

  loadReturns(event?: any) {
    this.isLoading = true;

    const pageIndex = event ? event.pageIndex : 0;
    const pageSize = event ? event.pageSize : 10;


    this.prService.getPurchaseReturns(this.searchKey, pageIndex, pageSize).subscribe({
      next: (res) => {
        this.dataSource.data = res.items;
        this.totalRecords = res.totalCount;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  applySearch(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.searchKey = filterValue.trim().toLowerCase();
    this.loadReturns();
  }

  navigateToCreate() {
    this.router.navigate(['/app/inventory/purchase-return/add']);
  }

  printReturn(row: any) {
    this.isLoading = true; 

    
    this.prService.getPurchaseReturnById(row.id).subscribe({
      next: (res) => {
       console.log(res)
        this.selectedReturn = res;

        this.isLoading = false;
       this.cdr.detectChanges();  
      
        setTimeout(() => {
          this.executePrint();
        }, 500);
      },
      error: (err) => {
        this.isLoading = false;
        console.error("Print Error:", err);
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
            /* Aapke design ki CSS yahan copy karein */
            .debit-note-container { padding: 20px; font-family: sans-serif; }
            .print-table { width: 100%; border-collapse: collapse; }
            .print-table th, .print-table td { border: 1px solid #ddd; padding: 8px; }
            .text-end { text-align: right; }
          </style>
        </head>
        <body onload="window.print();window.close()">${printContents}</body>
      </html>
    `);
      printWindow.document.close();
      this.cdr.detectChanges();
    }
  }
}