import { ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { InventoryService } from '../service/inventory.service';

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

  constructor(
    public dialogRef: MatDialogRef<GrnPrintDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { grnNo: string },
    private inventoryService: InventoryService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.fetchPrintData();
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

    WindowPrt.document.write(`
      <html>
        <head>
          <title>Print GRN - ${this.grnData.grnNumber}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; color: #333; }
            .print-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .company-info h1 { margin: 0; color: #1a56db; font-size: 24px; }
            .grn-title { text-align: right; }
            .grn-title h2 { margin: 0; color: #374151; font-size: 20px; }
            .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 30px; }
            .detail-section h3 { font-size: 14px; text-transform: uppercase; color: #6b7280; margin-bottom: 10px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; }
            .detail-row { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 13px; }
            .detail-label { font-weight: 600; color: #4b5563; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background: #f9fafb; border: 1px solid #e5e7eb; padding: 10px; text-align: left; font-size: 12px; text-transform: uppercase; color: #4b5563; }
            td { border: 1px solid #e5e7eb; padding: 10px; font-size: 13px; }
            .totals-section { margin-top: 30px; display: flex; justify-content: flex-end; }
            .totals-table { width: 250px; }
            .total-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f3f4f6; }
            .total-row.grand-total { border-bottom: none; font-weight: 800; font-size: 16px; color: #1a56db; margin-top: 10px; }
            @media print {
              body { padding: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body onload="window.print();window.close()">
          ${printContent.innerHTML}
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
