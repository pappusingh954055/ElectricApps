import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnInit, ViewChild } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { MaterialModule } from '../../../../shared/material/material/material-module';
import { PurchaseReturnService } from '../services/purchase-return.service';
import { FormsModule } from '@angular/forms';
import { PurchaseReturnView } from '../purchase-return-view/purchase-return-view';
import { MatDialog } from '@angular/material/dialog';
import { CompanyService } from '../../../company/services/company.service';
import { CompanyProfileDto } from '../../../company/model/company.model';
import { environment } from '../../../../enviornments/environment';

@Component({
  selector: 'app-purchase-return-list',
  standalone: true,
  imports: [CommonModule, MaterialModule, FormsModule],
  providers: [DatePipe, CurrencyPipe],
  templateUrl: './purchase-return-list.html',
  styleUrl: './purchase-return-list.scss',
})
export class PurchaseReturnList implements OnInit {
  private prService = inject(PurchaseReturnService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private companyService = inject(CompanyService);
  private datePipe = inject(DatePipe);
  private currencyPipe = inject(CurrencyPipe);

  companyInfo: CompanyProfileDto | null = null;

  dataSource = new MatTableDataSource<any>();
  displayedColumns: string[] = ['returnNumber', 'returnDate', 'supplierName', 'grnRef', 'totalAmount', 'status', 'actions'];

  // Separate Loading States [cite: 2026-02-04]
  isTableLoading = true;
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
    this.loadCompanyProfile();
  }

  loadCompanyProfile(): void {
    this.companyService.getCompanyProfile().subscribe({
      next: (res) => {
        this.companyInfo = res;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error fetching company profile:', err)
    });
  }

  getImgUrl(url: string | null | undefined): string {
    if (!url) return '';
    if (url.startsWith('data:image') || url.startsWith('http')) {
      return url;
    }
    const cleanUrl = url.startsWith('/') ? url.substring(1) : url;
    return `${environment.CompanyRootUrl}/${cleanUrl}`;
  }

  loadReturns() {
    this.isTableLoading = true;

    const start = this.fromDate ? this.fromDate.toISOString() : undefined;
    const end = this.toDate ? this.toDate.toISOString() : undefined;

    // IMPORTANT: sortField aur sortOrder pass karna zaruri hai [cite: 2026-02-04]
    const sortField = this.sort?.active || 'ReturnDate';
    const sortOrder = this.sort?.direction || 'desc';

    this.prService.getPurchaseReturns(
      this.searchKey,
      this.pageIndex,
      this.pageSize,
      start,
      end,
      sortField,
      sortOrder
    ).subscribe({
      next: (res) => {
        // Backend mapping match karein: res.items aur res.totalCount [cite: 2026-02-04]
        this.dataSource.data = res.items || [];
        this.totalRecords = res.totalCount || 0;

        console.log('Purchase Return List Data:', this.dataSource.data);
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
        this.executePrint();
      },
      error: (err) => {
        this.isTableLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private executePrint() {
    const companyName = this.companyInfo?.name || 'Electric Inventory System';
    const logoUrl = this.companyInfo?.logoUrl ? this.getImgUrl(this.companyInfo.logoUrl) : '';

    // Construct Address String safely
    let addressStr = '';
    if (this.companyInfo?.address) {
      const addr = this.companyInfo.address;
      addressStr = `${addr.addressLine1}, ${addr.addressLine2 ? addr.addressLine2 + ', ' : ''}${addr.city}, ${addr.state} - ${addr.pinCode}`;
    }

    const contactInfo = `Contact: ${this.companyInfo?.primaryPhone || ''} | Email: ${this.companyInfo?.primaryEmail || ''}`;

    // Format dates and currency
    const returnDate = this.datePipe.transform(this.selectedReturn.returnDate, 'dd MMM yyyy');
    const subTotal = this.currencyPipe.transform(this.selectedReturn.subTotal || 0, 'INR');
    const taxAmount = this.currencyPipe.transform(this.selectedReturn.taxAmount || 0, 'INR');
    const grandTotal = this.currencyPipe.transform(this.selectedReturn.grandTotal || 0, 'INR');

    // Build items table rows
    const itemsRows = (this.selectedReturn.items || []).map((item: any, index: number) => `
        <tr>
            <td style="text-align: center;">${index + 1}</td>
            <td>${item.productName}</td>
            <td style="text-align: center;">${item.returnQty}</td>
            <td style="text-align: right;">${this.currencyPipe.transform(item.rate, 'INR')}</td>
            <td style="text-align: right;">${this.currencyPipe.transform(item.totalAmount, 'INR')}</td>
        </tr>
    `).join('');

    const grnRef = this.selectedReturn.items && this.selectedReturn.items.length > 0 ? this.selectedReturn.items[0].grnRef || 'N/A' : 'N/A';

    const printWindow = window.open('', '_blank', 'top=0,left=0,height=1000,width=1000');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Debit Note - ${this.selectedReturn.returnNumber}</title>
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; color: #333; }
                .header { display: flex; justify-content: space-between; margin-bottom: 30px; border-bottom: 2px solid #eee; padding-bottom: 20px; }
                .logo-section { display: flex; align-items: center; gap: 15px; }
                .company-logo { width: 60px; height: 60px; object-fit: contain; }
                .company-name h1 { margin: 0; font-size: 24px; color: #1a56db; }
                .company-name p { margin: 2px 0; font-size: 12px; color: #666; }
                .doc-title h2 { margin: 0; color: #444; text-transform: uppercase; }

                .info-card { background: #f9f9f9; padding: 15px; border-radius: 8px; margin-bottom: 20px; display: flex; justify-content: space-between; flex-wrap: wrap; gap: 20px; }
                .info-group { display: flex; flex-direction: column; min-width: 150px; }
                .info-group label { font-size: 11px; color: #888; text-transform: uppercase; margin-bottom: 4px; }
                .info-group .value { font-weight: 600; font-size: 14px; }

                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th { background: #f1f5f9; padding: 10px; text-align: left; font-size: 12px; text-transform: uppercase; color: #555; }
                td { padding: 10px; border-bottom: 1px solid #eee; font-size: 13px; }
                
                .invoice-summary { margin-top: 30px; display: flex; flex-direction: column; align-items: flex-end; }
                .summary-row { display: flex; justify-content: space-between; width: 250px; padding: 5px 0; }
                .summary-row.grand-total { font-weight: bold; font-size: 16px; color: #1a56db; border-top: 1px solid #eee; margin-top: 10px; padding-top: 10px; }
                
                @media print {
                    .no-print { display: none; }
                    body { -webkit-print-color-adjust: exact; }
                }
            </style>
          </head>
          <body onload="window.print();window.close()">
             <div class="header">
                <div class="logo-section">
                    ${logoUrl ? `<img src="${logoUrl}" class="company-logo" alt="Logo">` : ''}
                    <div class="company-name">
                        <h1>${companyName}</h1>
                        <p>${addressStr}</p>
                        <p>${contactInfo}</p>
                    </div>
                </div>
                <div class="doc-title">
                     <h2>PURCHASE RETURN (DEBIT NOTE)</h2>
                     <p>#${this.selectedReturn.returnNumber}</p>
                </div>
            </div>

            <div class="info-card">
              <div class="info-group">
                <label>Supplier Name</label>
                <div class="value">${this.selectedReturn.supplierName}</div>
              </div>
              <div class="info-group">
                <label>Return Date</label>
                <div class="value">${returnDate}</div>
              </div>
              <div class="info-group">
                <label>Status</label>
                <div class="value">${this.selectedReturn.status}</div>
              </div>
              <div class="info-group">
                <label>GRN Reference</label>
                <div class="value">${grnRef}</div>
              </div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th style="text-align: center;">#</th>
                        <th>Product Description</th>
                        <th style="text-align: center;">Qty</th>
                        <th style="text-align: right;">Rate</th>
                        <th style="text-align: right;">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsRows}
                </tbody>
            </table>

            <div class="invoice-summary">
                <div class="summary-row">
                    <span class="label">Sub Total</span>
                    <span class="value">${subTotal}</span>
                </div>
                <div class="summary-row">
                    <span class="label">Total Tax</span>
                    <span class="value">${taxAmount}</span>
                </div>
                <div class="summary-row grand-total">
                    <span class="label">Grand Total</span>
                    <span class="value">${grandTotal}</span>
                </div>
            </div>
          </body>
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