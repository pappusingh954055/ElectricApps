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
import { SelectionModel } from '@angular/cdk/collections';

@Component({
  selector: 'app-current-stock-component',
  standalone: true,
  imports: [MaterialModule, CommonModule],
  templateUrl: './current-stock-component.html',
  styleUrl: './current-stock-component.scss',
})
export class CurrentStockComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['select','productName', 'totalReceived', 'availableStock', 'unitRate', 'actions'];
  stockDataSource = new MatTableDataSource<any>([]);


  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  resultsLength = 0; // Total count from backend
  isLoadingResults = true;
  lowStockCount: number = 0;
  totalInventoryValue: number = 0;
  searchValue: string = '';
  lastpurchaseOrderId!: number;
  constructor(private inventoryService: InventoryService, private router: Router) { }

  selection = new SelectionModel<any>(true, []);

  ngOnInit() {

  }

  ngAfterViewInit() {
    this.sort.sortChange.subscribe(() => (this.paginator.pageIndex = 0));
    merge(this.sort.sortChange, this.paginator.page)
      .pipe(
        startWith({}),
        switchMap(() => {
          this.isLoadingResults = true;
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
          if (!data) return [];
          this.resultsLength = data.totalCount;
          return data.items;
        })
      ).subscribe(items => {
        if (items) {
          if (items.length > 0) {
            this.lastpurchaseOrderId = items[0].lastPurchaseOrderId;
            console.log('items', items);
          }
          const mappedData = items.map((item: any) => ({
    
            productName: item.productName,
            totalQty: item.totalReceived,
            unit: item.unit,
            lastRate: item.lastRate
          }));

          this.stockDataSource.data = mappedData;
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
    this.paginator.pageIndex = 0;
    this.sort.sortChange.emit();
  }

  navigateToPO() {
    this.router.navigate(['/app/inventory/polist/add']).then(success => {
      if (!success) console.error("Navigation failed!");
    });
  }

  onRefillNow(item: any) {
    this.router.navigate(['/app/inventory/polist/add'], {
      state: {
        refillData: {
          productId: item.productId,
          productName: item.productName,
          unit: item.unit || 'PCS',
          rate: item.lastRate || 0,
          suggestedQty: 10,
          lastpurchaseOrderId: this.lastpurchaseOrderId
        }
      }
    });
  }

  // Checkbox functions
  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.stockDataSource.data.length;
    return numSelected === numRows;
  }

  masterToggle() {
    this.isAllSelected() ?
      this.selection.clear() :
      this.stockDataSource.data.forEach(row => this.selection.select(row));
  }

  onBulkRefill() {
    if (!this.selection.hasValue()) return;

    const refillItems = this.selection.selected.map(item => ({
      productId: item.productId,
      productName: item.productName,
      lastRate: item.lastRate,
      unit: item.unit,
      lastPurchaseOrderId: item.lastPurchaseOrderId
    }));

    this.router.navigate(['/app/inventory/polist/add'], {
      state: { refillItems: refillItems }
    });
  }
  
}