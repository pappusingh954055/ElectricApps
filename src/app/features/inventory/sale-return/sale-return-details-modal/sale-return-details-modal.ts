import { CommonModule } from '@angular/common';
import { Component, inject, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MaterialModule } from '../../../../shared/material/material/material-module';
import { SaleReturnService } from '../services/sale-return.service';

@Component({
  selector: 'app-sale-return-details-modal',
  imports: [CommonModule, MaterialModule],
  templateUrl: './sale-return-details-modal.html',
  styleUrl: './sale-return-details-modal.scss',
})
export class SaleReturnDetailsModal implements OnInit {

  private srService = inject(SaleReturnService);
  isPrinting = false;
  constructor(
    public dialogRef: MatDialogRef<SaleReturnDetailsModal>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  onClose(): void {
    this.dialogRef.close();
  }

  ngOnInit(): void {
    console.log('datas', this.data);
  }

  printPDF() {

    const id = this.data.saleReturnHeaderId;

    if (!id) {
      console.log("Current Data Object:", this.data);
      return;
    }

    this.isPrinting = true;
    this.srService.printCreditNote(id).subscribe({
      next: (blob: Blob) => {
        const fileURL = URL.createObjectURL(blob);
        window.open(fileURL, '_blank');
        this.isPrinting = false;
        setTimeout(() => URL.revokeObjectURL(fileURL), 100);
      },
      error: (err) => {
        console.error("Print Error:", err);
        this.isPrinting = false;
      }
    });
  }
}