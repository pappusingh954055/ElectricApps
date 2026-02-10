import { ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { InventoryService } from '../service/inventory.service';
import { CompanyService } from '../../company/services/company.service';
import { CompanyProfileDto } from '../../company/model/company.model';
import { environment } from '../../../enviornments/environment';

@Component({
  selector: 'app-grn-print-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatDividerModule, MatProgressSpinnerModule],
  templateUrl: './grn-print-dialog.component.html',
  styleUrls: ['./grn-print-dialog.component.scss']
})
export class GrnPrintDialogComponent implements OnInit {
  grnData: any;
  loading = true;
  companyInfo: CompanyProfileDto | null = null;

  constructor(
    public dialogRef: MatDialogRef<GrnPrintDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { grnNo: string },
    private inventoryService: InventoryService,
    private companyService: CompanyService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.fetchPrintData();
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

  fetchPrintData(): void {
    this.inventoryService.getGrnPrintData(this.data.grnNo).subscribe({
      next: (res: any) => {
        this.grnData = res;
        console.log('GRN Print Data:', this.grnData);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Error fetching GRN print data:', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  print(): void {
    const printContent = document.getElementById('printable-area');
    if (!printContent) return;

    const WindowPrt = window.open('', '', 'left=0,top=0,width=900,height=900,toolbar=0,scrollbars=0,status=0');
    if (!WindowPrt) return;

    const companyName = this.companyInfo?.name || 'Electric Inventory System';
    const logoUrl = this.companyInfo?.logoUrl ? this.getImgUrl(this.companyInfo.logoUrl) : '';

    // Construct Address String safely
    let addressStr = '';
    if (this.companyInfo?.address) {
      const addr = this.companyInfo.address;
      addressStr = `${addr.addressLine1}, ${addr.addressLine2 ? addr.addressLine2 + ', ' : ''}${addr.city}, ${addr.state} - ${addr.pinCode}`;
    }

    const contactInfo = `Contact: ${this.companyInfo?.primaryPhone || ''} | Email: ${this.companyInfo?.primaryEmail || ''}`;

    WindowPrt.document.write(`
      <html>
        <head>
          <title>Print GRN - ${this.grnData.grnNumber}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; color: #333; }
            .print-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .company-info-wrapper { display: flex; align-items: center; gap: 15px; }
            .company-logo { width: 80px; height: 80px; object-fit: contain; margin-right: 15px; }
            .company-info h1 { margin: 0; color: #1a56db; font-size: 24px; }
            .company-info p { margin: 2px 0; font-size: 14px; color: #4b5563; }
            
            .grn-title { text-align: right; }
            .grn-title h2 { margin: 0; color: #374151; font-size: 20px; }
            
            .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 30px; }
            .detail-section h3 { font-size: 14px; text-transform: uppercase; color: #6b7280; margin-bottom: 10px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; }
            .detail-row { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 13px; }
            .detail-label { font-weight: 600; color: #4b5563; }
            
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background: #f9fafb; border: 1px solid #e5e7eb; padding: 10px; text-align: left; font-size: 12px; text-transform: uppercase; color: #4b5563; }
            td { border: 1px solid #e5e7eb; padding: 10px; font-size: 13px; }
            .text-right { text-align: right; }
            
            .totals-section { margin-top: 30px; display: flex; justify-content: flex-end; }
            .totals-table { width: 250px; }
            .total-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f3f4f6; }
            .total-row.grand-total { border-bottom: none; font-weight: 800; font-size: 16px; color: #1a56db; margin-top: 10px; }
            
            .print-footer { margin-top: 50px; display: flex; justify-content: space-between; }
            .signature { text-align: center; width: 200px; }
            .sig-line { border-top: 1px solid #333; margin-bottom: 5px; }
            
            @media print {
              body { padding: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body onload="window.print();window.close()">
           <div class="print-header">
            <div class="company-info-wrapper">
                ${logoUrl ? `<img src="${logoUrl}" class="company-logo" alt="Logo">` : ''}
                <div class="company-info">
                  <h1>${companyName}</h1>
                  <p>${addressStr}</p>
                  <p>${contactInfo}</p>
                </div>
            </div>
            <div class="grn-title">
              <h2>GOODS RECEIVED NOTE</h2>
              <div class="detail-row">
                <span class="detail-label">GRN No:</span>
                <span>${this.grnData.grnNumber}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Date:</span>
                <span>${new Date(this.grnData.receivedDate).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          ${printContent.innerHTML.split('<div class="print-header">')[1]} 
          
          <!-- Note: We are reusing the innerHTML but replacing the header part essentially. 
               However, a cleaner way is to reconstruct the body or just inject the data. 
               Since printContent.innerHTML has the static header from the view (which is now dynamic in view),
               we can actually just use printContent.innerHTML directly IF the view has rendered correctly.
               But constructing it here ensures the print view is perfect regardless of screen view state.
               Let's trust the screen view for the body table content but use our header.
           -->
        </body>
      </html>
    `);
    WindowPrt.document.close();
    WindowPrt.focus();
  }

  close(): void {
    this.dialogRef.close();
  }
}
