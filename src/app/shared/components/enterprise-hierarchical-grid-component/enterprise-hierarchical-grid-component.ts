import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, PageEvent, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, Sort, MatSortModule } from '@angular/material/sort';
import { CdkDragDrop, moveItemInArray, DragDropModule } from '@angular/cdk/drag-drop';
import { GridColumn } from '../../../shared/models/grid-column.model';
import { MaterialModule } from '../../material/material/material-module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AppSearchInput } from '../app-search-input/app-search-input';
import { Router } from '@angular/router';
import { SelectionModel } from '@angular/cdk/collections';

@Component({
  selector: 'app-enterprise-hierarchical-grid',
  standalone: true,
  imports: [CommonModule, MaterialModule, DragDropModule, MatTableModule, AppSearchInput, MatSortModule, MatPaginatorModule, ReactiveFormsModule, FormsModule],
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
  @Input() addNewLabel: string = 'New Record';
  @Input() addNewRoute: string = '';
  @Output() editRecord = new EventEmitter<any>();
  @Output() deleteRecord = new EventEmitter<any>();
  @Output() bulkDeleteRecords = new EventEmitter<any[]>();

  @Output() onGridStateChange = new EventEmitter<any>();
  @Output() onSelectionChange = new EventEmitter<any>();

  @Output() editChildRecord = new EventEmitter<any>();
  @Output() deleteChildRecord = new EventEmitter<any>();

  @ViewChild(MatSort) sort!: MatSort;
  sortChildDir: boolean = true;
  currentChildSortField: string = '';

  selection = new SelectionModel<any>(true, []);
  childSelection = new SelectionModel<any>(true, []);

  globalSearchQuery: string = '';
  expandedElement: any | null = null;
  currentPage: number = 0;
  sortField: string = 'poDate';
  sortDirection: 'asc' | 'desc' | '' = 'desc';
  fromDate: string = '';
  toDate: string = '';



  constructor(private cdr: ChangeDetectorRef, private router: Router) { }

  ngOnInit() {
    this.dataSource.sort = null;
    setTimeout(() => { this.triggerDataLoad(); }, 0);
  }

  get displayedColumns(): string[] {
    const dynamicCols = this.columns.filter(c => c.visible !== false).map(c => c.field);
    return ['select', ...dynamicCols]; // Fixes "Could not find column with id select"
  }

  // --- Checkbox Helpers (Types Fixed) ---
  isAllSelected(): boolean {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows && numRows > 0;
  }

  masterToggle(): void {
    this.isAllSelected() ? this.selection.clear() : this.dataSource.data.forEach((row: any) => this.selection.select(row));
    this.emitSelection();
  }

  isAllChildSelected(element: any): boolean {
    const items = element[this.childDataField] || [];
    return items.length > 0 && items.every((item: any) => this.childSelection.isSelected(item));
  }

  childMasterToggle(element: any): void {
    const items = element[this.childDataField] || [];
    if (this.isAllChildSelected(element)) {
      items.forEach((i: any) => this.childSelection.deselect(i));
    } else {
      items.forEach((i: any) => this.childSelection.select(i));
    }
    this.emitSelection();
  }

  emitSelection(): void {
    this.onSelectionChange.emit({
      parents: this.selection.selected,
      children: this.childSelection.selected
    });
  }

  // --- DRAG DROP FIXED FOR CHECKBOX OFFSET ---
  drop(event: CdkDragDrop<string[]>): void {
    if (event.previousIndex > 0 && event.currentIndex > 0) {
      moveItemInArray(this.columns, event.previousIndex - 1, event.currentIndex - 1);
    }
  }

  // --- REST OF YOUR ORIGINAL LOGIC (UNTOUCHED) ---
  onGlobalSearch(value: any) { this.globalSearchQuery = typeof value === 'string' ? value : value?.target?.value || ''; this.currentPage = 0; this.triggerDataLoad(); }
  applyDateFilter() { this.currentPage = 0; this.triggerDataLoad(); }
  onSortChange(sort: Sort) { this.sortField = sort.active; this.sortDirection = sort.direction as any; this.currentPage = 0; this.triggerDataLoad(); }
  onPageChange(event: PageEvent) { this.currentPage = event.pageIndex; this.pageSize = event.pageSize; this.triggerDataLoad(); }
  applyFilter() { this.currentPage = 0; this.triggerDataLoad(); }
  triggerDataLoad() {
    const state = { pageIndex: this.currentPage, pageSize: this.pageSize, sortField: this.sortField, sortOrder: this.sortDirection, fromDate: this.fromDate, toDate: this.toDate, globalSearch: this.globalSearchQuery, filters: this.columns.filter(c => c.filterValue).map(c => ({ field: c.field, value: c.filterValue })) };
    this.onGridStateChange.emit(state);
  }
  clearAllFilters() { this.columns.forEach(col => col.filterValue = ''); this.fromDate = ''; this.toDate = ''; this.globalSearchQuery = ''; this.applyFilter(); }
  toggleRow(element: any) { this.expandedElement = this.expandedElement === element ? null : element; this.cdr.detectChanges(); }
  onResize(column: GridColumn, event: MouseEvent) {
    if (!column.isResizable) return;
    const startX = event.pageX; const startWidth = column.width || 150;
    const move = (e: MouseEvent) => { column.width = Math.max(80, startWidth + (e.pageX - startX)); this.cdr.detectChanges(); };
    const up = () => { document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up); };
    document.addEventListener('mousemove', move); document.addEventListener('mouseup', up);
  }
  toggleColumn(column: GridColumn) { column.visible = !column.visible; this.cdr.detectChanges(); }
  applyChildFilter(element: any, column: any) {
    if (!element.originalChildData) element.originalChildData = [...element[this.childDataField]];
    const val = column.filterValue?.toLowerCase().trim();
    element[this.childDataField] = val ? element.originalChildData.filter((r: any) => String(r[column.field]).toLowerCase().includes(val)) : element.originalChildData;
  }
  onAddNewClick() { if (this.addNewRoute) this.router.navigate([this.addNewRoute]); }

  dropChild(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.childColumns, event.previousIndex, event.currentIndex);
    this.cdr.detectChanges();
  }
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
  clearGlobalSearch() {
    this.globalSearchQuery = '';
    this.currentPage = 0;
    this.triggerDataLoad();
  }
  // Edit Function
  onEdit(row: any) {
    this.editRecord.emit(row);
  }

  // Single Delete
  onDelete(row: any) {
    if (confirm('Are you sure you want to delete this record?')) {
      this.deleteRecord.emit(row);
    }
  }

  // Bulk Delete
  onBulkDelete() {
    const selectedRows = this.selection.selected;
    if (confirm(`Delete ${selectedRows.length} selected records?`)) {
      this.bulkDeleteRecords.emit(selectedRows);
      // Delete ke baad selection clear karein
      this.selection.clear();
    }
  }
  onEditChild(parent: any, child: any) {
    this.editChildRecord.emit({ parent, child });
  }

  onDeleteChild(parent: any, child: any) {
    if (confirm('Delete this line item?')) {
      this.deleteChildRecord.emit({ parent, child });
    }
  }
}