import { Component, OnInit } from '@angular/core';
import { MaterialModule } from '../../../shared/material/material/material-module';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { EnterpriseHierarchicalGridComponent } from '../../../shared/components/enterprise-hierarchical-grid-component/enterprise-hierarchical-grid-component';
import { MatTableDataSource } from '@angular/material/table';
import { GridColumn } from '../../../shared/models/grid-column.model'; // Apna path check karein

@Component({
  selector: 'app-po-list',
  standalone: true,
  imports: [MaterialModule, ReactiveFormsModule, CommonModule, RouterLink, EnterpriseHierarchicalGridComponent],
  providers: [CurrencyPipe, DatePipe],
  templateUrl: './po-list.html',
  styleUrl: './po-list.scss',
})
export class PoList implements OnInit {
  
  // PO Master Columns Configuration
  poColumns: GridColumn[] = [
    { field: 'poNumber', header: 'PO No.', width: 150, visible: true, isResizable: true, align: 'left', isFilterable: true },
    { field: 'vendorName', header: 'Vendor', width: 250, visible: true, isResizable: true, align: 'left' , isFilterable: true},
    { field: 'poDate', header: 'Date', width: 150, visible: true, align: 'center', isFilterable: true, cell: (row) => new Date(row.poDate).toLocaleDateString() },
    { field: 'totalAmount', header: 'Total Amount', width: 180, visible: true, align: 'right', isResizable: true, type: 'currency', isFilterable: true },
    { field: 'status', header: 'Status', width: 120, visible: true, align: 'center', isFilterable: true }
  ];

  // PO Items (Child) Columns Configuration
  itemColumns: GridColumn[] = [
    { field: 'itemCode', header: 'Item Code', width: 150, align: 'left', isFilterable: true },
    { field: 'description', header: 'Description', width: 300, align: 'left' , isFilterable: true},
    { field: 'quantity', header: 'Qty', width: 100, align: 'right', isFilterable: true },
    { field: 'unitPrice', header: 'Price', width: 120, align: 'right', isFilterable: true, type: 'currency' },
    { field: 'lineTotal', header: 'Line Total', width: 150, isFilterable: true, align: 'right', cell: (row) => (row.quantity * row.unitPrice).toFixed(2) }
  ];

  dataSource = new MatTableDataSource<any>();

  ngOnInit() {
    // Dummy Data for Testing
    this.dataSource.data = [
      {
        id: 101,
        poNumber: 'PO-2026-001',
        vendorName: 'Electric Solutions Ltd',
        poDate: '2026-01-20',
        totalAmount: 4500.00,
        status: 'Open',
        purchaseOrderItems: [ // childDataField name
          { itemCode: 'CABLE-01', description: 'Copper Wire 10m', quantity: 10, unitPrice: 200 },
          { itemCode: 'SWITCH-05', description: 'Industrial Switch', quantity: 5, unitPrice: 500 }
        ]
      },
      {
        id: 102,
        poNumber: 'PO-2026-002',
        vendorName: 'Tata Power Spares',
        poDate: '2026-01-22',
        totalAmount: 1200.00,
        status: 'Pending',
        purchaseOrderItems: [
          { itemCode: 'FUSE-10', description: 'Ceramic Fuse 10A', quantity: 100, unitPrice: 12 }
        ]
      }
    ];
  }
}