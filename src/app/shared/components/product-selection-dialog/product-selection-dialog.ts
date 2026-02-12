import { Component, inject, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../material/material/material-module';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ProductService } from '../../../features/master/product/service/product.service';
import { SelectionModel } from '@angular/cdk/collections';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { finalize, Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';

@Component({
  selector: 'app-product-selection-dialog',
  standalone: true,
  imports: [CommonModule, MaterialModule, FormsModule],
  template: `
    <div class="product-selection-container">
      <div class="dialog-header">
        <h2 class="title">Select Products</h2>
        <button class="header-close-btn" (click)="close()"><mat-icon>close</mat-icon></button>
      </div>

      <div class="search-bar">
        <mat-form-field appearance="outline" class="w-100 search-field" subscriptSizing="dynamic">
          <mat-label>Search by Name or SKU</mat-label>
          <input matInput [(ngModel)]="searchQuery" (input)="onSearchChange()" (keyup.enter)="loadProducts()" placeholder="Start typing to search...">
          <button mat-icon-button matSuffix (click)="loadProducts()" class="search-btn">
            <mat-icon>search</mat-icon>
          </button>
        </mat-form-field>
      </div>

      <div class="table-container" [class.loading]="isLoading">
        @if (isLoading) {
          <div class="loading-overlay">
            <mat-spinner diameter="40"></mat-spinner>
          </div>
        }

        <table mat-table [dataSource]="dataSource" class="product-table">
          <ng-container matColumnDef="select">
            <th mat-header-cell *matHeaderCellDef class="checkbox-col">
              <mat-checkbox (change)="$event ? masterToggle() : null"
                            [checked]="selection.hasValue() && isAllSelected()"
                            [indeterminate]="selection.hasValue() && !isAllSelected()">
              </mat-checkbox>
            </th>
            <td mat-cell *matCellDef="let row" class="checkbox-col">
              <mat-checkbox (click)="$event.stopPropagation()"
                            (change)="$event ? selection.toggle(row) : null"
                            [checked]="selection.isSelected(row)">
              </mat-checkbox>
            </td>
          </ng-container>

          <ng-container matColumnDef="sku">
            <th mat-header-cell *matHeaderCellDef> SKU </th>
            <td mat-cell *matCellDef="let row" class="sku-cell"> {{row.sku}} </td>
          </ng-container>

          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef> Product Name </th>
            <td mat-cell *matCellDef="let row" class="name-cell"> {{row.productName}} </td>
          </ng-container>

          <ng-container matColumnDef="category">
            <th mat-header-cell *matHeaderCellDef> Category </th>
            <td mat-cell *matCellDef="let row" class="cat-cell"> 
               <span class="category-badge">{{row.categoryName}}</span>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns; sticky: true"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;" (click)="selection.toggle(row)" [class.selected-row]="selection.isSelected(row)"></tr>
        </table>
      </div>

      <mat-paginator [length]="totalRecords"
                     [pageSize]="pageSize"
                     [pageSizeOptions]="[10, 20, 50]"
                     (page)="onPageChange($event)">
      </mat-paginator>

      <div class="dialog-footer">
        <div class="selection-info">
          <mat-icon class="info-icon">check_circle</mat-icon>
          <span class="count">{{selection.selected.length}}</span>
          <span class="text">products selected</span>
        </div>
        <div class="action-buttons">
          <button mat-raised-button class="back-btn" (click)="close()">
            <mat-icon>close</mat-icon> Cancel
          </button>
          <button mat-raised-button class="save-btn" [disabled]="selection.isEmpty()" (click)="addSelected()">
            <mat-icon>add_shopping_cart</mat-icon> Add Selected Products
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .product-selection-container {
      display: flex;
      flex-direction: column;
      max-height: 90vh;
      background: #ffffff;
      border-radius: 12px;
      overflow: hidden;
    }

    .dialog-header {
      padding: 16px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;

      .title {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 700;
        color: #1e293b;
        letter-spacing: -0.02em;
      }

      .header-close-btn {
        background: transparent;
        border: none;
        cursor: pointer;
        color: #94a3b8;
        width: 36px !important;
        height: 36px !important;
        padding: 0 !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        border-radius: 50% !important;

        mat-icon {
          font-size: 20px;
          width: 20px;
          height: 20px;
          line-height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        &:hover {
          color: #ef4444;
          background: #fef2f2;
        }
      }
    }

    .search-bar {
      padding: 12px 24px;
      background: #ffffff;

      .search-field {
        ::ng-deep .mat-mdc-text-field-wrapper {
          background-color: #f1f5f9 !important;
          border-radius: 10px !important;
        }
      }
    }

    .table-container {
      flex: 1;
      overflow: auto;
      min-height: 300px;
      position: relative;
      border-top: 1px solid #f1f5f9;
    }

    .loading-overlay {
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(255,255,255,0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10;
    }

    .product-table {
      width: 100%;
      th {
        background: #f8fafc !important;
        color: #64748b !important;
        font-weight: 600 !important;
        text-transform: uppercase;
        font-size: 0.75rem !important;
        letter-spacing: 0.05em;
        padding: 10px 16px !important;
      }
      td {
        padding: 10px 16px !important;
        color: #334155;
      }
    }

    .checkbox-col { width: 48px; }
    .sku-cell { font-weight: 600; color: #4f46e5; }
    .name-cell { font-weight: 500; }
    
    .category-badge {
      background: #f1f5f9;
      color: #475569;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .selected-row {
      background-color: #f5f3ff !important;
    }

    .dialog-footer {
      padding: 12px 24px;
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .selection-info {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #64748b;

      .info-icon {
        color: #10b981;
        font-size: 20px;
        width: 20px;
        height: 20px;
      }
      .count {
        font-weight: 700;
        color: #4f46e5;
        font-size: 1.1rem;
      }
      .text {
        font-size: 0.85rem;
        font-weight: 500;
      }
    }

    .action-buttons {
      display: flex;
      gap: 12px;
    }

    .save-btn {
      background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%) !important;
      color: white !important;
      box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3) !important;
      border-radius: 8px !important;
      font-weight: 600 !important;
      height: 40px !important;
      padding: 0 16px !important;
      transition: all 0.3s ease !important;
      border: none !important;
      mat-icon { margin-right: 6px; font-size: 18px; width: 18px; height: 18px; }
      &:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(79, 70, 229, 0.45) !important; }
      &:disabled { background: #e2e8f0 !important; color: #94a3b8 !important; box-shadow: none !important; cursor: not-allowed; }
    }

    .back-btn {
      color: #64748b !important;
      font-weight: 600 !important;
      border-radius: 8px !important;
      height: 40px !important;
      padding: 0 12px !important;
      mat-icon { margin-right: 4px; font-size: 18px; width: 18px; height: 18px; }
      &:hover { background-color: #f1f5f9 !important; color: #1e293b !important; }
    }

    ::ng-deep .mat-mdc-dialog-container { padding: 0 !important; border-radius: 12px !important; }
  `]
})
export class ProductSelectionDialogComponent implements OnInit, OnDestroy {
  private productService = inject(ProductService);
  private dialogRef = inject(MatDialogRef<ProductSelectionDialogComponent>);
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  displayedColumns: string[] = ['select', 'sku', 'name', 'category'];
  dataSource = new MatTableDataSource<any>([]);
  selection = new SelectionModel<any>(true, []);

  searchQuery: string = '';
  isLoading: boolean = false;
  totalRecords: number = 0;
  pageSize: number = 10;
  pageIndex: number = 0;

  ngOnInit() {
    this.loadProducts();

    // 🔍 Reactive Search Logic
    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.pageIndex = 0;
      this.loadProducts();
    });
  }

  onSearchChange() {
    this.searchSubject.next(this.searchQuery);
  }

  loadProducts() {
    this.isLoading = true;
    const request = {
      pageIndex: this.pageIndex, // 0-based
      pageNumber: this.pageIndex + 1, // 1-based
      pageSize: this.pageSize,
      search: this.searchQuery || '',
      filter: this.searchQuery || '', // fallback key
      term: this.searchQuery || '',   // another fallback key
      termSearch: this.searchQuery || '',
      searchTerm: this.searchQuery || '',
      sortBy: 'ProductName',
      sortDirection: 'asc' as 'asc' | 'desc'
    };

    this.productService.getPaged(request).pipe(
      finalize(() => this.isLoading = false),
      takeUntil(this.destroy$)
    ).subscribe(res => {
      this.dataSource.data = res.items || [];
      this.totalRecords = res.totalCount || 0;
    });
  }

  onPageChange(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadProducts();
  }

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows && numRows > 0;
  }

  masterToggle() {
    this.isAllSelected() ?
      this.selection.clear() :
      this.dataSource.data.forEach(row => this.selection.select(row));
  }

  addSelected() {
    this.dialogRef.close(this.selection.selected);
  }

  close() {
    this.dialogRef.close();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
