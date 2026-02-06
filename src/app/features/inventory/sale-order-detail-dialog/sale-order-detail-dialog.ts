import { Component, Inject, OnInit } from '@angular/core';
import { MaterialModule } from '../../../shared/material/material/material-module';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-sale-order-detail-dialog',
  imports: [MaterialModule, CommonModule],
  templateUrl: './sale-order-detail-dialog.html',
  styleUrl: './sale-order-detail-dialog.scss',
})
export class SaleOrderDetailDialog implements OnInit   {
  constructor(
    public dialogRef: MatDialogRef<SaleOrderDetailDialog>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  onConfirm() {
    this.dialogRef.close('CONFIRM_ACTION');
  }
  ngOnInit(): void {
    console.log('dialog data',this.data); 
  } 
}