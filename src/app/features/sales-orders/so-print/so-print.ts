import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-so-print',
  imports: [CommonModule],
  templateUrl: './so-print.html',
  styleUrl: './so-print.scss',
})
export class SoPrint {
  // 🔹 Mock data (replace with API call using route :id later)
  so = {
    soNo: 'SO-2024-015',
    soDate: '05-05-2024',
    status: 'Approved',

    company: {
      name: 'ElectroMax Solutions Pvt Ltd',
      address: '2nd Floor, Tech Park, Bengaluru - 560102',
      gst: '29AABCE1234F1Z5',
      phone: '+91 98765 43210',
      email: 'sales@electromax.com'
    },

    customer: {
      name: 'TechWorld Pvt Ltd',
      address: 'No 44, Industrial Area, Chennai - 600032',
      gst: '33AACCT9876P1Z8',
      phone: '+91 91234 56789',
      email: 'accounts@techworld.com'
    },

    paymentTerms: 'Credit – 30 Days',
    deliveryTerms: 'Door Delivery',
    salesperson: 'Ramesh Kumar',

    items: [
      { code: 'PRD-101', name: 'Laptop – Dell i5', hsn: '84713010', qty: 5, unit: 'Nos', rate: 52000, tax: 18, amount: 306800 },
      { code: 'PRD-205', name: 'Wireless Mouse', hsn: '84716060', qty: 10, unit: 'Nos', rate: 850, tax: 18, amount: 10030 }
    ],

    subTotal: 316830,
    discount: 6830,
    taxAmount: 55800,
    grandTotal: 365800
  };
}
