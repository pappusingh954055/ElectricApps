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
// Animation imports for smooth expansion
import { animate, state, style, transition, trigger } from '@angular/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-current-stock-component',
  standalone: true,
  imports: [MaterialModule, CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './current-stock-component.html',
  styleUrl: './current-stock-component.scss',
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class CurrentStockComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['select', 'productName', 'totalReceived', 'totalRejected', 'availableStock', 'unitRate', 'actions'];
  stockDataSource = new MatTableDataSource<any>([]);

  selectedProductIds: number[] = [];
  expandedElement: any | null;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  resultsLength = 0;
  isLoadingResults = true;
  lowStockCount: number = 0;
  totalInventoryValue: number = 0;
  searchValue: string = '';
  lastpurchaseOrderId!: number;

  searchTerm: string = '';
  startDate: Date | null = null;
  endDate: Date | null = null;

  constructor(private inventoryService: InventoryService, private router: Router,
    private cdr: ChangeDetectorRef) { }

  selection = new SelectionModel<any>(true, []);

  ngOnInit() { }

  ngAfterViewInit() {
    this.sort.sortChange.subscribe(() => (this.paginator.pageIndex = 0));

    // Initializing data stream with filters
    setTimeout(() => {
      merge(this.sort.sortChange, this.paginator.page)
        .pipe(
          startWith({}),
          switchMap(() => {
            return this.fetchDataStream();
          }),
          map(data => {
            this.isLoadingResults = false;
            if (!data) return [];
            this.resultsLength = data.totalCount;
            return data.items;
          })
        ).subscribe(items => {
          this.handleDataUpdate(items);
        });
    }, 0);
  }

  // Helper to fetch data using all current filters
  private fetchDataStream() {
    this.isLoadingResults = true;
    this.cdr.detectChanges();
    return this.inventoryService.getCurrentStock(
      this.sort.active,
      this.sort.direction,
      this.paginator.pageIndex,
      this.paginator.pageSize,
      this.searchValue, // Current Global Search
      this.startDate,   // New Date Filter
      this.endDate      // New Date Filter
    ).pipe(
      catchError(() => {
        this.isLoadingResults = false;
        return of(null);
      })
    );
  }

  // Unified data handler to keep code clean
  private handleDataUpdate(items: any) {
    if (items) {
      if (items.length > 0) {
        this.lastpurchaseOrderId = items[0].lastPurchaseOrderId;
      }
      const mappedData = items.map((item: any) => ({
        productId: item.productId,
        productName: item.productName,
        totalReceived: item.totalReceived,
        totalRejected: item.totalRejected,
        availableStock: item.availableStock,
        unit: item.unit,
        lastRate: item.lastRate,
        minStockLevel: item.minStockLevel,
        history: item.history
      }));
      this.stockDataSource.data = mappedData;
      this.updateSummary(mappedData);
    }
    this.cdr.detectChanges();
  }

  // Triggered from HTML Apply Button
  applyDateFilter() {
    this.paginator.pageIndex = 0;
    this.fetchDataStream().subscribe(data => {
      if (data) {
        this.resultsLength = data.totalCount;
        this.handleDataUpdate(data.items);
      }
    });
  }

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

  onCheckboxChange(productId: number, event: any) {
    if (event.checked) {
      this.selectedProductIds.push(productId);
    } else {
      this.selectedProductIds = this.selectedProductIds.filter(id => id !== productId);
    }
  }

  exportSelected() {
    const selectedIds = this.selection.selected.map(row => row.productId);
    if (selectedIds.length === 0) {
      console.warn("No items selected for export");
      return;
    }
    this.inventoryService.downloadStockReport(selectedIds).subscribe({
      next: (blob) => {
        const objectUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = objectUrl;
        const dateStr = new Date().toISOString().split('T')[0];
        a.download = `Stock_Report_${dateStr}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(objectUrl);
      },
      error: (err) => {
        console.error("Download failed:", err);
      }
    });
  }
}