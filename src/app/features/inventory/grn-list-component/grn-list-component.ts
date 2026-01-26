import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { MaterialModule } from '../../../shared/material/material/material-module';
import { ReactiveFormsModule } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-grn-list-component',
  imports: [CommonModule, MaterialModule, ReactiveFormsModule, RouterLink],
  templateUrl: './grn-list-component.html',
  styleUrl: './grn-list-component.scss',
})
export class GrnListComponent implements OnInit {
  displayedColumns: string[] = ['grnNumber', 'poNumber', 'supplierName', 'receivedDate', 'status', 'actions'];
  dataSource = new MatTableDataSource<any>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private router: Router) { }

  ngOnInit(): void {
    this.loadGRNData();
  }

  // 1. Search Filter Logic [cite: 2026-01-22]
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  // 2. View PO Logic (Navigation to PO Details) [cite: 2026-01-22]
  viewPO(poId: number) {
    // Agar humein PO ki details dekhni ho toh [cite: 2026-01-22]
    this.router.navigate(['/app/inventory/purchase-order'], { queryParams: { id: poId, mode: 'view' } });
  }

  // 3. View GRN Details [cite: 2026-01-22]
  viewGRN(row: any) {
    this.router.navigate(['/app/inventory/grn-form'], { queryParams: { grnId: row.id, mode: 'view' } });
  }

  // Temporary Data for UI Testing [cite: 2026-01-22]
  loadGRNData() {
    const dummyData = [
      { id: 1, grnNumber: 'GRN/26-27/001', poId: 21, poNumber: 'PO/26-27/0018', supplierName: 'ABC Traders', receivedDate: new Date(), status: 'Completed' },
      { id: 2, grnNumber: 'GRN/26-27/002', poId: 22, poNumber: 'PO/26-27/0019', supplierName: 'XYZ Traders', receivedDate: new Date(), status: 'Partial' }
    ];
    this.dataSource = new MatTableDataSource(dummyData);
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  printGRN(grn: any) { }
}