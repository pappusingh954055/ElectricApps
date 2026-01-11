import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { GridColumn } from '../data-grid.model';
import { MaterialModule } from '../../material/material/material-module';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-data-grid',
  imports: [MaterialModule, CommonModule],
  templateUrl: './data-grid.html',
  styleUrl: './data-grid.scss',
})
export class DataGrid {
  @Input() columns: GridColumn[] = [];
  @Input() data: any[] = [];
  @Input() isLoading = false;
  @Input() showActions = false;

  @Output() edit = new EventEmitter<any>();
  @Output() delete = new EventEmitter<any>();



  get displayedColumns(): string[] {
    if (!this.columns || this.columns.length === 0) {
      return [];
    }

    const cols = this.columns.map(c => c.columnDef);
    return this.showActions ? [...cols, 'actions'] : cols;
  }

  get dataSource(): MatTableDataSource<any> {
    return new MatTableDataSource(this.data);
  }
}
