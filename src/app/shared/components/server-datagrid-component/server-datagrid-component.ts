import { Component, EventEmitter, Input, Output } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { GridRequest } from '../../models/grid-request.model';
import { GridColumn } from '../../../shared/models/grid-column.model';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../material/material/material-module';

@Component({
  selector: 'app-server-datagrid',
  imports: [CommonModule, MaterialModule],
  templateUrl: './server-datagrid-component.html',
  styleUrl: './server-datagrid-component.scss',
})
export class ServerDatagridComponent <T> {

  @Input() columns: GridColumn[] = [];
  @Input() data: T[] = [];
  @Input() totalCount = 0;
  @Input() loading = false;

  @Output() loadData = new EventEmitter<GridRequest>();

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
    this.loadData.emit(this.request);
  }

  onSort(column: GridColumn): void {
    if (!column.sortable) return;

    this.request.sortBy = column.field;
    this.request.sortDirection =
      this.request.sortDirection === 'asc' ? 'desc' : 'asc';

    this.loadData.emit(this.request);
  }

  onPageChange(event: PageEvent): void {
    this.request.pageNumber = event.pageIndex + 1;
    this.request.pageSize = event.pageSize;
    this.loadData.emit(this.request);
  }
}