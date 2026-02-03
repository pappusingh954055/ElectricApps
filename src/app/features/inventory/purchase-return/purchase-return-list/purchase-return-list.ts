import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { MaterialModule } from '../../../../shared/material/material/material-module';

@Component({
  selector: 'app-purchase-return-list',
  imports: [CommonModule, MaterialModule],
  templateUrl: './purchase-return-list.html',
  styleUrl: './purchase-return-list.scss',
})
export class PurchaseReturnList implements OnInit {
  dataSource = new MatTableDataSource<any>();
  displayedColumns: string[] = ['returnNumber', 'returnDate', 'supplierName', 'grnRef', 'totalAmount', 'status', 'actions'];

  totalRecords = 0; // Paginator fix ke liye
  searchKey: string = "";
  isLoading = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private router: Router, private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.loadReturns();
  }

  loadReturns() {
    this.isLoading = true;
    const pageIndex = this.paginator ? this.paginator.pageIndex + 1 : 1;
    const pageSize = this.paginator ? this.paginator.pageSize : 10;
    const sortField = this.sort ? this.sort.active : 'returnDate';
    const sortDir = this.sort ? this.sort.direction : 'desc';

    // Abhi ke liye service call simulate kar rahe hain, baad mein API connect karenge
    console.log(`Loading Returns: Page ${pageIndex}, Size ${pageSize}, Search: ${this.searchKey}`);

    // Yahan aapka service call aayega jo (data, totalCount) return karega
    this.isLoading = false;
  }

  applySearch(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.searchKey = filterValue.trim().toLowerCase();
    this.paginator.pageIndex = 0;
    this.loadReturns();
  }

  navigateToCreate() {
    this.router.navigate(['/app/inventory/purchase-return/add']);
  }
}