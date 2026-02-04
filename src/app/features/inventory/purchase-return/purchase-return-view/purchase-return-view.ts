import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MaterialModule } from '../../../../shared/material/material/material-module';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-purchase-return-view',
  imports: [CommonModule, MaterialModule],
  templateUrl: './purchase-return-view.html',
  styleUrl: './purchase-return-view.scss',
})
export class PurchaseReturnView {
  constructor(@Inject(MAT_DIALOG_DATA) public data: any) { 

    console.log('dada', data);
  }

  print() {
    window.print();
  }
}
