import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, OnDestroy } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { GridRequest } from '../../models/grid-request.model';
import { GridColumn } from '../../../shared/models/grid-column.model';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../material/material/material-module';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-server-datagrid',
  standalone: true,
  imports: [CommonModule, MaterialModule, DragDropModule],
  templateUrl: './server-datagrid-component.html',
  styleUrl: './server-datagrid-component.scss',
})
export class ServerDatagridComponent<T> implements OnChanges, OnInit, OnDestroy {
  @Input() columns: GridColumn[] = [];
  @Input() data: T[] = [];
  @Input() totalCount = 0;
  @Input() loading = false;

  @Output() loadData = new EventEmitter<GridRequest>();
  @Output() edit = new EventEmitter<any>();
  @Output() delete = new EventEmitter<any[]>();
  @Output() selectionChange = new EventEmitter<any[]>();
  @Output() rowClick = new EventEmitter<any>();

  selection = new Set<any>();
  private readonly STORAGE_KEY = 'grid-settings-state';
  private searchSubject = new Subject<string>();

  request: GridRequest = { pageNumber: 1, pageSize: 10, sortDirection: 'desc' };

  private resizingColumn?: GridColumn;
  private startX = 0;
  private startWidth = 0;

  constructor() {
    this.searchSubject.pipe(debounceTime(400), distinctUntilChanged()).subscribe(val => {
      this.request.search = val;
      this.request.pageNumber = 1;
      this.emitRequest();
    });
  }

  ngOnInit(): void { this.restoreColumnState(); }
  ngOnDestroy(): void { this.searchSubject.complete(); }
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data']) { this.selection.clear(); this.emitSelection(); }
  }

  emitRequest() { this.loadData.emit({ ...this.request }); }
  onSearch(value: string): void { this.searchSubject.next(value); }

  onSort(event: MouseEvent, column: GridColumn): void {
    if (!column.sortable || this.loading) return;
    this.request.sortDirection = (this.request.sortBy === column.field && this.request.sortDirection === 'asc') ? 'desc' : 'asc';
    this.request.sortBy = column.field;
    this.request.pageNumber = 1;
    this.emitRequest();
  }

  onPageChange(event: PageEvent): void {
    this.request.pageNumber = event.pageIndex + 1;
    this.request.pageSize = event.pageSize;
    this.emitRequest();
  }

  clearSelection(): void { this.selection.clear(); this.emitSelection(); }

  get visibleColumns() { return this.columns.filter(c => c.visible); }

  displayedColumnsWithActions(): string[] {
    return ['select', ...this.visibleColumns.map(c => c.field), 'actions'];
  }

  toggleRow(row: any): void {
    this.selection.has(row) ? this.selection.delete(row) : this.selection.add(row);
    this.emitSelection();
  }

  toggleAll(event: any): void {
    event.checked ? this.data.forEach(row => this.selection.add(row)) : this.selection.clear();
    this.emitSelection();
  }

  emitSelection(): void { this.selectionChange.emit(Array.from(this.selection)); }
  isHeaderChecked(): boolean { return this.data.length > 0 && this.selection.size === this.data.length; }

  onRowClick(event: MouseEvent, row: any): void {
    if ((event.target as HTMLElement).closest('button, mat-checkbox, mat-icon')) return;
    this.rowClick.emit(row);
  }

  // --- Smooth Resize ---
  startResize(event: MouseEvent, column: GridColumn): void {
    event.preventDefault();
    this.resizingColumn = column;
    this.startX = event.pageX;
    this.startWidth = column.width ?? 150;
    document.addEventListener('mousemove', this.resizeMouseMove);
    document.addEventListener('mouseup', this.resizeMouseUp);
  }

  resizeMouseMove = (event: MouseEvent) => {
    if (!this.resizingColumn) return;
    window.requestAnimationFrame(() => {
      if (this.resizingColumn) {
        const delta = event.pageX - this.startX;
        this.resizingColumn.width = Math.max(80, this.startWidth + delta);
      }
    });
  }

  resizeMouseUp = () => {
    this.saveColumnState();
    this.resizingColumn = undefined;
    document.removeEventListener('mousemove', this.resizeMouseMove);
    document.removeEventListener('mouseup', this.resizeMouseUp);
  }

  // --- Drag Drop ---
  dropColumn(event: CdkDragDrop<any[]>) {
    if (event.previousIndex === event.currentIndex) return;
    const visibleArr = this.visibleColumns;
    const fromIdx = this.columns.indexOf(visibleArr[event.previousIndex]);
    const toIdx = this.columns.indexOf(visibleArr[event.currentIndex]);
    moveItemInArray(this.columns, fromIdx, toIdx);
    this.saveColumnState();
  }

  saveColumnState(): void {
    const state = this.columns.map(col => ({ field: col.field, visible: col.visible, width: col.width }));
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
  }

  private restoreColumnState(): void {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (!saved) return;
    const savedState = JSON.parse(saved);
    this.columns = this.columns.map(col => {
      const savedCol = savedState.find((s: any) => s.field === col.field);
      return savedCol ? { ...col, visible: savedCol.visible, width: savedCol.width } : col;
    });
  }

  updateDisplayedColumns() { this.columns = [...this.columns]; this.saveColumnState(); }
}