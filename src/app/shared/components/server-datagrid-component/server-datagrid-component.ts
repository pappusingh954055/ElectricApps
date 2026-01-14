import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { GridRequest } from '../../models/grid-request.model';
import { GridColumn } from '../../../shared/models/grid-column.model';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../material/material/material-module';

import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';


@Component({
  selector: 'app-server-datagrid',
  imports: [CommonModule, MaterialModule, DragDropModule],
  templateUrl: './server-datagrid-component.html',
  styleUrl: './server-datagrid-component.scss',
})
export class ServerDatagridComponent<T> implements OnChanges {

  @Input() columns: GridColumn[] = [];
  @Input() data: T[] = [];
  @Input() totalCount = 0;
  @Input() loading = false;

  hoveredColumn: string | null = null;


  private resizingColumn?: GridColumn;
  private startX = 0;
  private startWidth = 0;

  @Output() loadData = new EventEmitter<GridRequest>();

  @Output() edit = new EventEmitter<any>();
  @Output() delete = new EventEmitter<any[]>();

  @Output() selectionChange = new EventEmitter<any[]>();

  @Output() rowClick = new EventEmitter<any>();

  selection = new Set<any>();

  displayedColumnsWithActions(): string[] {
    return [
      'select',
      ...this.columns.filter(c => c.visible).map(c => c.field),
      'actions'
    ];
  }



  toggleRow(row: any): void {
    if (this.selection.has(row)) {
      this.selection.delete(row);
    } else {
      this.selection.add(row);
    }
    this.emitSelection();
  }


  toggleAll(event: any): void {
    if (event.checked) {
      this.data.forEach(row => this.selection.add(row));
    } else {
      this.selection.clear();
    }
    this.emitSelection();
  }



  // private emitSelection(): void {
  //   this.selectionChange.emit([...this.selection]);
  // }

  emitSelection(): void {
    this.selectionChange.emit(Array.from(this.selection));
  }

  isHeaderChecked(): boolean {
    return this.selection.size > 0;
  }



  deleteSelected(): void {
    if (this.selection.size === 0) return;
    this.delete.emit([...this.selection]);
  }



  request: GridRequest = {
    pageNumber: 1,
    pageSize: 10,
    sortDirection: 'desc'
  };

  displayedColumns(): string[] {
    return this.columns.map(c => c.field);
  }

  onSearch(value: string): void {
    this.request.search = value;
    this.request.pageNumber = 1;
    this.loadData.emit({ ...this.request });
  }

  onSort(column: GridColumn): void {
    if (!column.sortable) return;

    this.request.sortBy = column.field;
    this.request.sortDirection =
      this.request.sortDirection === 'asc' ? 'desc' : 'asc';

    this.request.pageNumber = 1; // ✅ reset page on sort
    this.loadData.emit({ ...this.request });
  }

  onPageChange(event: PageEvent): void {
    this.request.pageNumber = event.pageIndex + 1;
    this.request.pageSize = event.pageSize;

    this.loadData.emit({ ...this.request });
  }

  clearSelection(): void {
    this.selection.clear();
    this.selectionChange.emit([]);
  }

  startResize(event: MouseEvent, column: GridColumn): void {
    event.preventDefault();
    event.stopPropagation();

    this.resizingColumn = column;
    this.startX = event.pageX;
    this.startWidth = column.width ?? 150;

    document.addEventListener('mousemove', this.resizeMouseMove);
    document.addEventListener('mouseup', this.resizeMouseUp);
  }

  resizeMouseMove = (event: MouseEvent) => {
    if (!this.resizingColumn) return;

    const delta = event.pageX - this.startX;
    this.resizingColumn.width = Math.max(80, this.startWidth + delta);
  };

  resizeMouseUp = () => {
    this.resizingColumn = undefined;

    document.removeEventListener('mousemove', this.resizeMouseMove);
    document.removeEventListener('mouseup', this.resizeMouseUp);
  };
  updateDisplayedColumns(): void {
    // Trigger Angular change detection for mat-table
    this.columns = [...this.columns];
  }

  onRowClick(event: MouseEvent, row: any): void {
    const target = event.target as HTMLElement;

    // ❌ Ignore clicks on buttons, icons, checkboxes
    if (
      target.closest('button') ||
      target.closest('mat-checkbox') ||
      target.closest('mat-icon')
    ) {
      return;
    }

    this.rowClick.emit(row);
  }
  ngOnChanges(changes: SimpleChanges): void {

    this.selection.clear();
    this.emitSelection();

  }
  get visibleColumns() {
    return this.columns.filter(c => c.visible);
  }
  onColumnDrop(event: CdkDragDrop<string[]>): void {

    const visibleColumns = this.columns.filter(c => c.visible);

    moveItemInArray(
      visibleColumns,
      event.previousIndex,
      event.currentIndex
    );

    // rebuild original columns array
    const reordered: GridColumn[] = [];

    visibleColumns.forEach(vc => {
      const original = this.columns.find(c => c.field === vc.field);
      if (original) reordered.push(original);
    });

    this.columns
      .filter(c => !c.visible)
      .forEach(c => reordered.push(c));

    this.columns = reordered;

    this.updateDisplayedColumns();
  }
  dropColumn(event: CdkDragDrop<any[]>) {
    moveItemInArray(this.visibleColumns, event.previousIndex, event.currentIndex);
    this.updateDisplayedColumns();
  }

}