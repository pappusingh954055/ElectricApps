import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { CdkDragDrop, moveItemInArray, DragDropModule } from '@angular/cdk/drag-drop';
import { GridColumn } from '../../../shared/models/grid-column.model'
import { MaterialModule } from '../../material/material/material-module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-enterprise-hierarchical-grid',
  standalone: true,
  imports: [CommonModule, MaterialModule, DragDropModule, MatTableModule, ReactiveFormsModule, FormsModule],
  templateUrl: './enterprise-hierarchical-grid-component.html',
  styleUrl: './enterprise-hierarchical-grid-component.scss'
})
export class EnterpriseHierarchicalGridComponent implements OnInit {
  @Input() columns: GridColumn[] = [];
  @Input() dataSource = new MatTableDataSource<any>();
  @Input() childColumns: GridColumn[] = [];
  @Input() childDataField: string = 'items';

  expandedElement: any | null = null;

  constructor(private cdr: ChangeDetectorRef) { }

  ngOnInit() {
    // Custom predicate for multi-column filtering
    this.dataSource.filterPredicate = (data: any, filter: string) => {
      const searchData = JSON.parse(filter);
      return searchData.every((col: any) => {
        if (!col.isFilterable || !col.filterValue) return true;
        return data[col.field]?.toString().toLowerCase().includes(col.filterValue.toLowerCase());
      });
    };
  }

  get displayedColumns(): string[] {
    return this.columns.filter(c => c.visible !== false).map(c => c.field);
  }

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

  applyFilter() {
    this.dataSource.filter = JSON.stringify(this.columns);
  }

  clearAllFilters() {
    this.columns.forEach(col => col.filterValue = '');
    this.applyFilter();
  }

  hasActiveFilters(): boolean {
    return this.columns.some(col => col.filterValue && col.filterValue.trim().length > 0);
  }
}