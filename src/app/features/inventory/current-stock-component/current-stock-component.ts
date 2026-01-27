import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { MaterialModule } from '../../../shared/material/material/material-module';
import { CommonModule } from '@angular/common';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { InventoryService } from '../service/inventory.service';
import { Router } from '@angular/router';
import { merge, of } from 'rxjs';
import { startWith, switchMap, map, catchError } from 'rxjs/operators';

@Component({
  selector: 'app-current-stock-component',
  standalone: true,
  imports: [MaterialModule, CommonModule],
  templateUrl: './current-stock-component.html',
  styleUrl: './current-stock-component.scss',
})
export class CurrentStockComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['productName', 'totalReceived', 'availableStock', 'unitRate'];
  stockDataSource = new MatTableDataSource<any>([]);

  // ViewChilds for server-side logic [cite: 2026-01-22]
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  resultsLength = 0; // Total count from backend
  isLoadingResults = true;
  lowStockCount: number = 0;
  totalInventoryValue: number = 0;
  searchValue: string = '';

  constructor(private inventoryService: InventoryService, private router: Router) { }

  ngOnInit() {

  }

  ngAfterViewInit() {
    // Jab bhi sorting badle, paginator ko wapas pehle page par le jayein
    this.sort.sortChange.subscribe(() => (this.paginator.pageIndex = 0));

    merge(this.sort.sortChange, this.paginator.page)
      .pipe(
        startWith({}),
        switchMap(() => {
          this.isLoadingResults = true;
          // Backend API call with dynamic params
          return this.inventoryService.getCurrentStock(
            this.sort.active,       // sortField
            this.sort.direction,    // sortOrder
            this.paginator.pageIndex,
            this.paginator.pageSize,
            this.searchValue
          ).pipe(
            catchError(() => {
              this.isLoadingResults = false;
              return of(null);
            })
          );
        }),
        map(data => {
          this.isLoadingResults = false;

          // Agar data null hai toh khali array return karein
          if (!data) return [];

          // Backend ke TotalCount ko paginator length mein assign karein
          this.resultsLength = data.totalCount;

          // Sirf items array return karein subscribe block ke liye
          return data.items;
        })
      ).subscribe(items => {
        if (items) {
          // Data mapping for table display
          const mappedData = items.map((item: any) => ({
            productName: item.productName,
            totalQty: item.totalReceived, // Aapke repository se 'totalReceived' hi aa raha hai
            unit: item.unit,
            lastRate: item.lastRate
          }));

          this.stockDataSource.data = mappedData;

          // Page summary update karein (Low stock alert aur total value)
          this.updateSummary(mappedData);
        }
      });
  }

  updateSummary(data: any[]) {
    this.lowStockCount = data.filter(item => item.totalQty < 10).length;
    this.totalInventoryValue = data.reduce((acc, curr) => acc + (curr.totalQty * curr.lastRate), 0);
  }

  applyFilter(event: Event) {
    this.searchValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.paginator.pageIndex = 0; // Search karte hi first page par jayein [cite: 2026-01-22]
    this.sort.sortChange.emit(); // Manually trigger update
  }

  navigateToPO() {
    this.router.navigate(['/app/inventory/polist/add']).then(success => {
      if (!success) console.error("Navigation failed!");
    });
  }
}