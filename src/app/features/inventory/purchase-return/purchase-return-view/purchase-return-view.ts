import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { Component, Inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { MaterialModule } from '../../../../shared/material/material/material-module';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CompanyService } from '../../../company/services/company.service';
import { CompanyProfileDto } from '../../../company/model/company.model';
import { environment } from '../../../../enviornments/environment';

@Component({
  selector: 'app-purchase-return-view',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  providers: [DatePipe, CurrencyPipe],
  templateUrl: './purchase-return-view.html',
  styleUrl: './purchase-return-view.scss',
})
export class PurchaseReturnView implements OnInit {
  companyInfo: CompanyProfileDto | null = null;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private companyService: CompanyService,
    private cdr: ChangeDetectorRef,
    private datePipe: DatePipe,
    private currencyPipe: CurrencyPipe
  ) {
    console.log('dada', data);
  }

  ngOnInit(): void {
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

  print() {
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
    const returnDate = this.datePipe.transform(this.data.returnDate, 'dd MMM yyyy');
    const subTotal = this.currencyPipe.transform(this.data.subTotal || 0, 'INR');
    const taxAmount = this.currencyPipe.transform(this.data.taxAmount || 0, 'INR');
    const grandTotal = this.currencyPipe.transform(this.data.grandTotal || 0, 'INR');

    // Build items table rows
    const itemsRows = this.data.items.map((item: any, index: number) => `
        <tr>
            <td style="text-align: center;">${index + 1}</td>
            <td>${item.productName}</td>
            <td style="text-align: center;">${item.returnQty}</td>
            <td style="text-align: right;">${this.currencyPipe.transform(item.rate, 'INR')}</td>
            <td style="text-align: center;">${item.discountPercent}%</td>
            <td style="text-align: center;">${item.gstPercent}%</td>
            <td style="text-align: right;">${this.currencyPipe.transform(item.totalAmount, 'INR')}</td>
        </tr>
    `).join('');

    const grnRef = this.data.items[0]?.grnRef || 'N/A';

    const WindowPrt = window.open('', '', 'left=0,top=0,width=900,height=900,toolbar=0,scrollbars=0,status=0');
    if (!WindowPrt) return;

    WindowPrt.document.write(`
        <html>
            <head>
                <title>Print Return - ${this.data.returnNumber}</title>
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
                         <h2>PURCHASE RETURN</h2>
                         <p>#${this.data.returnNumber}</p>
                    </div>
                </div>

                <div class="info-card">
                  <div class="info-group">
                    <label>Supplier Name</label>
                    <div class="value">${this.data.supplierName}</div>
                  </div>
                  <div class="info-group">
                    <label>Return Date</label>
                    <div class="value">${returnDate}</div>
                  </div>
                  <div class="info-group">
                    <label>Status</label>
                    <div class="value">${this.data.status}</div>
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
                            <th style="text-align: center;">Return Qty</th>
                            <th style="text-align: right;">Rate</th>
                        <th style="text-align: center;">Disc (%)</th>
                        <th style="text-align: center;">Tax (%)</th>
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
    WindowPrt.document.close();
  }
}
