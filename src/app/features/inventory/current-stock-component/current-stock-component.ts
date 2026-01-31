import { Component, OnInit, ViewChild, AfterViewInit, ChangeDetectorRef } from '@angular/core';
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
// Animation imports for smooth expansion [cite: 2026-01-31]
import { animate, state, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-current-stock-component',
  standalone: true,
  imports: [MaterialModule, CommonModule],
  templateUrl: './current-stock-component.html',
  styleUrl: './current-stock-component.scss',
  // Added row expansion animation [cite: 2026-01-31]
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class CurrentStockComponent implements OnInit, AfterViewInit {
  // Column definitions kept as per your logic [cite: 2026-01-31]
  displayedColumns: string[] = ['select', 'productName', 'totalReceived', 'totalRejected', 'availableStock', 'unitRate', 'actions'];
  stockDataSource = new MatTableDataSource<any>([]);

  // State to track which row is expanded [cite: 2026-01-31]
  expandedElement: any | null;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  resultsLength = 0;
  isLoadingResults = true;
  lowStockCount: number = 0;
  totalInventoryValue: number = 0;
  searchValue: string = '';
  lastpurchaseOrderId!: number;

  constructor(private inventoryService: InventoryService, private router: Router,
    private cdr: ChangeDetectorRef) { }

  selection = new SelectionModel<any>(true, []);

  ngOnInit() { }

  ngAfterViewInit() {
    this.sort.sortChange.subscribe(() => (this.paginator.pageIndex = 0));
    setTimeout(() => {
      merge(this.sort.sortChange, this.paginator.page)
        .pipe(
          startWith({}),
          switchMap(() => {
            this.isLoadingResults = true;
            this.cdr.detectChanges();
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

            // Map including the new history from backend [cite: 2026-01-31]
            const mappedData = items.map((item: any) => ({
              productId: item.productId,
              productName: item.productName,
              totalReceived: item.totalReceived,
              totalRejected: item.totalRejected,
              availableStock: item.availableStock,
              unit: item.unit,
              lastRate: item.lastRate,
              minStockLevel: item.minStockLevel,
              history: item.history // Traceability data linked here [cite: 2026-01-31]
            }));
            this.cdr.detectChanges();
            this.stockDataSource.data = mappedData;
            this.updateSummary(mappedData);
          }
        });
    }, 0);
  }

  // Row toggle helper [cite: 2026-01-31]
  toggleRow(element: any) {
    this.expandedElement = (this.expandedElement === element) ? null : element;
    this.cdr.detectChanges();
  }

  updateSummary(data: any[]) {
    this.lowStockCount = data.filter(item => item.availableStock <= (item.minStockLevel || 10)).length;
    this.totalInventoryValue = data.reduce((acc, curr) => acc + (curr.availableStock * curr.lastRate), 0);
    this.cdr.detectChanges();
  }

  applyFilter(event: Event) {
    this.searchValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.paginator.pageIndex = 0;
    this.sort.sortChange.emit();
    this.cdr.detectChanges();
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

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.stockDataSource.data.length;
    return numSelected === numRows;
  }

  masterToggle() {
    this.isAllSelected() ?
      this.selection.clear() :
      this.stockDataSource.data.forEach(row => this.selection.select(row));
    this.cdr.detectChanges();
  }

  onBulkRefill() {
    if (!this.selection.hasValue()) return;

    const refillItems = this.selection.selected.map(item => ({
      productId: item.productId,
      productName: item.productName,
    }));
    this.cdr.detectChanges();

    this.router.navigate(['/app/inventory/polist/add'], {
      state: { refillItems: refillItems }
    });
  }
}