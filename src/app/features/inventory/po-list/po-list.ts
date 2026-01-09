import { Component } from '@angular/core';
import { MaterialModule } from '../../../shared/material/material/material-module';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-po-list',
  imports: [MaterialModule, ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './po-list.html',
  styleUrl: './po-list.scss',
})
export class PoList {
 cols = ['poNo', 'supplier', 'date', 'total', 'actions'];

  pos = [
    { id: 1, poNo: 'PO-001', supplierName: 'ABC Traders', date: new Date(), total: 12000 }
  ];
}
