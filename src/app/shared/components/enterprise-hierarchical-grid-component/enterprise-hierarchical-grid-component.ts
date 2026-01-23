import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, PageEvent, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, Sort, MatSortModule } from '@angular/material/sort';
import { CdkDragDrop, moveItemInArray, DragDropModule } from '@angular/cdk/drag-drop';
import { GridColumn } from '../../../shared/models/grid-column.model';
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
  @Input() isLoading: boolean = false;

  @Input() totalRecords: number = 0;
  @Input() pageSize: number = 10;

  @Output() onGridStateChange = new EventEmitter<any>();

  @ViewChild(MatSort) sort!: MatSort;

  expandedElement: any | null = null;
  currentPage: number = 0;
  sortField: string = '';
  sortDirection: 'asc' | 'desc' | '' = '';

  // --- NEW: Date Range Properties ---
  fromDate: string = '';
  toDate: string = '';

  constructor(private cdr: ChangeDetectorRef) { }

  ngOnInit() {
    this.dataSource.sort = null;
  }

  get displayedColumns(): string[] {
    return this.columns.filter(c => c.visible !== false).map(c => c.field);
  }

  // --- NEW: Date Filter Logic ---
  applyDateFilter() {
    this.currentPage = 0; // Reset pagination on filter change
    this.triggerDataLoad();
  }

  onSortChange(sort: Sort) {
    this.sortField = sort.active;
    this.sortDirection = sort.direction as 'asc' | 'desc' | '';
    this.currentPage = 0;
    this.triggerDataLoad();
  }

  onPageChange(event: PageEvent) {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.triggerDataLoad();
  }

  applyFilter() {
    this.currentPage = 0;
    this.triggerDataLoad();
  }

  triggerDataLoad() {
    const state = {
      pageIndex: this.currentPage,
      pageSize: this.pageSize,
      sortField: this.sortField,
      sortOrder: this.sortDirection,
      // --- UPDATED: Passing Dates to Backend ---
      fromDate: this.fromDate,
      toDate: this.toDate,
      filters: this.columns
        .filter(c => c.filterValue && c.filterValue.trim() !== '')
        .map(c => ({ field: c.field, value: c.filterValue }))
    };
    this.onGridStateChange.emit(state);
  }

  // --- UI Handlers ---
  clearAllFilters() {
    // Clear both column filters AND date range
    this.columns.forEach(col => col.filterValue = '');
    this.fromDate = '';
    this.toDate = '';
    this.applyFilter();
  }

  hasActiveFilters(): boolean {
    // UPDATED: Clear button tab dikhega jab column filter ho YA date selected ho
    const hasColumnFilters = this.columns.some(col => col.filterValue && col.filterValue.trim().length > 0);
    const hasDateFilters = !!(this.fromDate || this.toDate);
    return hasColumnFilters || hasDateFilters;
  }

  // ... (Baki saara logic same rahega: drop, toggleRow, onResize, etc.) ...

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

  // Aapki component class ke andar ye method hona chahiye:

  applyChildFilter(element: any, column: any) {
    // 1. Pehle pure data ka reference lein
    const originalData = element.originalChildData || [...element[this.childDataField]];

    // 2. Original data ko save karke rakhein agar pehli baar filter ho raha hai
    if (!element.originalChildData) {
      element.originalChildData = originalData;
    }

    const filterValue = column.filterValue?.toLowerCase().trim();

    if (!filterValue) {
      // Agar filter empty hai toh original data wapas le aayein
      element[this.childDataField] = element.originalChildData;
    } else {
      // Filter logic: sirf wahi rows dikhayein jo match karti hain
      element[this.childDataField] = element.originalChildData.filter((row: any) => {
        const cellValue = String(row[column.field]).toLowerCase();
        return cellValue.includes(filterValue);
      });
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

  onChildSortChange(sort: Sort, element: any) {
    const data = [...element[this.childDataField]];
    if (!sort.active || sort.direction === '') {
      element[this.childDataField] = data;
      return;
    }

    element[this.childDataField] = data.sort((a, b) => {
      const isAsc = sort.direction === 'asc';
      return this.compare(a[sort.active], b[sort.active], isAsc);
    });
  }

  compare(a: number | string, b: number | string, isAsc: boolean) {
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
  }

  createNewPo() { }

  onResizeChild(col: any, event: MouseEvent) {
    event.preventDefault();
    const startX = event.pageX;
    const startWidth = col.width || 120;
    const onMouseMove = (e: MouseEvent) => {
      const movement = e.pageX - startX;
      col.width = Math.max(60, startWidth + movement);
    };
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }
  sortChildDir: boolean = true;
  currentChildSortField: string = '';

  sortChild(field: string, element: any) {
    this.currentChildSortField = field;
    this.sortChildDir = !this.sortChildDir;
    const data = element[this.childDataField];
    data.sort((a: any, b: any) => {
      const valA = a[field];
      const valB = b[field];
      return this.sortChildDir ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
    });
  }

}