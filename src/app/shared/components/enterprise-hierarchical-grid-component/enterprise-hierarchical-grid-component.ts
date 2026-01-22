import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, PageEvent, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, Sort, MatSortModule } from '@angular/material/sort';
import { CdkDragDrop, moveItemInArray, DragDropModule } from '@angular/cdk/drag-drop';
import { GridColumn } from '../../../shared/models/grid-column.model'
import { MaterialModule } from '../../material/material/material-module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-enterprise-hierarchical-grid',
  standalone: true,
  imports: [CommonModule, MaterialModule, DragDropModule, MatTableModule, MatSortModule, MatPaginatorModule, ReactiveFormsModule, FormsModule],
  templateUrl: './enterprise-hierarchical-grid-component.html',
  styleUrl: './enterprise-hierarchical-grid-component.scss'
})
export class EnterpriseHierarchicalGridComponent implements OnInit {
  @Input() columns: GridColumn[] = [];
  @Input() dataSource = new MatTableDataSource<any>();
  @Input() childColumns: GridColumn[] = [];
  @Input() childDataField: string = 'items';
  
  // Server-side inputs
  @Input() totalRecords: number = 0;
  @Input() pageSize: number = 25;
  
  // Events to notify parent to fetch data
  @Output() onGridStateChange = new EventEmitter<any>();

  expandedElement: any | null = null;
  currentPage: number = 0;
  sortField: string = '';
  sortDirection: string = '';

  constructor(private cdr: ChangeDetectorRef) { }

  ngOnInit() {
    // Note: No filterPredicate needed for server-side logic
  }

  get displayedColumns(): string[] {
    return this.columns.filter(c => c.visible !== false).map(c => c.field);
  }

  // Master Sorting logic (Server-side trigger)
  onSortChange(sort: Sort) {
    this.sortField = sort.active;
    this.sortDirection = sort.direction;
    this.triggerDataLoad();
  }

  // Pagination logic (Server-side trigger)
  onPageChange(event: PageEvent) {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.triggerDataLoad();
  }

  // Filter trigger
  applyFilter() {
    this.currentPage = 0; // Reset to page 1 on search
    this.triggerDataLoad();
  }

  // Central function to emit current state to parent component
  triggerDataLoad() {
    const state = {
      pageIndex: this.currentPage,
      pageSize: this.pageSize,
      sortField: this.sortField,
      sortOrder: this.sortDirection,
      filters: this.columns
        .filter(c => c.filterValue && c.filterValue.trim() !== '')
        .map(c => ({ field: c.field, value: c.filterValue }))
    };
    this.onGridStateChange.emit(state);
  }

  clearAllFilters() {
    this.columns.forEach(col => col.filterValue = '');
    this.applyFilter();
  }

  hasActiveFilters(): boolean {
    return this.columns.some(col => col.filterValue && col.filterValue.trim().length > 0);
  }

  // --- UI Interactions (Local only) ---
  
  drop(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.columns, event.previousIndex, event.currentIndex);
  }

  toggleRow(element: any) {
    this.expandedElement = this.expandedElement === element ? null : element;
    this.cdr.detectChanges();
  }

  onResize(column: GridColumn, event: MouseEvent) {
    if (!column.isResizable) return;
    const startX = event.pageX;
    const startWidth = column.width || 150;

    const mouseMoveHandler = (moveEvent: MouseEvent) => {
      const newWidth = startWidth + (moveEvent.pageX - startX);
      column.width = newWidth > 80 ? newWidth : 80;
      this.cdr.detectChanges();
    };

    const mouseUpHandler = () => {
      document.removeEventListener('mousemove', mouseMoveHandler);
      document.removeEventListener('mouseup', mouseUpHandler);
    };

    document.addEventListener('mousemove', mouseMoveHandler);
    document.addEventListener('mouseup', mouseUpHandler);
  }

  toggleColumn(column: GridColumn) {
    column.visible = !column.visible;
    this.cdr.detectChanges();
  }

  // --- Child Table Logic (Local filtering for child data) ---

  applyChildFilter(element: any, col: GridColumn) {
    if (!element._originalItems) {
      element._originalItems = [...element[this.childDataField]];
    }
    const filterValue = col.filterValue?.toLowerCase();
    if (!filterValue) {
      element[this.childDataField] = [...element._originalItems];
    } else {
      element[this.childDataField] = element._originalItems.filter((item: any) =>
        item[col.field]?.toString().toLowerCase().includes(filterValue)
      );
    }
  }

  hasActiveChildFilters(): boolean {
    return this.childColumns.some(c => c.filterValue && c.filterValue.trim() !== '');
  }

  clearChildFilters(element: any) {
    this.childColumns.forEach(c => c.filterValue = '');
    if (element._originalItems) {
      element[this.childDataField] = [...element._originalItems];
    }
  }

  dropChild(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.childColumns, event.previousIndex, event.currentIndex);
    this.cdr.detectChanges();
  }
}