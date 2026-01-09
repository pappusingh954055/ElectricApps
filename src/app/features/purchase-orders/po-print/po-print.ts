import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-po-print',
  imports: [CommonModule],
  templateUrl: './po-print.html',
  styleUrl: './po-print.scss',
})
export class PoPrint {
po = {
    poNo: '2024/PO-12',
    poDate: '27-04-2024',

    company: {
      name: 'Thendral Supermarket',
      address: 'No 23/2, SBI Colony, Ragavendra Nagar, Chennai - 600124',
      gst: '33APFSDZ1ZV',
      email: 'purchase-team@thendral.com',
      phone: '+91-7869825463'
    },

    vendor: {
      name: 'SM Traders',
      address: '43, Kambar Street, Chennai - 600453',
      gst: '33AACCEPV51ZH',
      code: 'VNDR-104',
      phone: '+91-9345678123',
      email: 'purchase-sm@gmail.com'
    },

    requisitioner: 'Manoj Kumar, Purchase Executive',
    shipVia: 'Road by truck',
    fob: 'On destination',
    shippingTerms: 'Free shipping to destination',

    items: [
      { code: 105, name: 'Surf Excel 5 kg', hsn: '34019011', qty: 20, unit: 'nos', rate: 600, tax: 5, amount: 12600 },
      { code: 109, name: 'Rin 1 kg', hsn: '34019011', qty: 25, unit: 'nos', rate: 85, tax: 5, amount: 2231 }
    ],

    total: 22141,
    discount: 141,
    grandTotal: 22000
  };
}
