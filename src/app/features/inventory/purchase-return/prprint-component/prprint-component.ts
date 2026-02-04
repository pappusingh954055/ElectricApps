import { Component, inject, Input } from '@angular/core';
import { PurchaseReturnService } from '../services/purchase-return.service';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../../../shared/material/material/material-module';

@Component({
  selector: 'app-prprint-component',
  imports: [CommonModule, MaterialModule],
  templateUrl: './prprint-component.html',
  styleUrl: './prprint-component.scss',
})
export class PRPrintComponent {
  private prService = inject(PurchaseReturnService);
  isLoading = false;

  @Input() selectedReturn: any = null;
  get subTotal(): number {
    return this.selectedReturn?.items?.reduce((sum: number, item: any) => sum + ((item.returnQty || 0) * (item.rate || 0)), 0) || 0;
  }

  get gstAmount(): number {
    return this.selectedReturn?.gstAmount || 0;
  }

  get grandTotal(): number {
    return this.selectedReturn?.totalAmount || (this.subTotal + this.gstAmount);
  }
}
