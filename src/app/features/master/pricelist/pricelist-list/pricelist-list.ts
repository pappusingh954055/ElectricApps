import { ChangeDetectorRef, Component, OnChanges, OnInit } from '@angular/core';

import { PriceListService } from '../service/pricelist.service';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { materialize } from 'rxjs';
import { MaterialModule } from '../../../../shared/material/material/material-module';
import { RouterLink } from '@angular/router';
import { PriceListModel } from '../models/pricelist.model';
import { DataGrid } from '../../../../shared/components/data-grid/data-grid';

@Component({
  selector: 'app-pricelist-list',
  imports: [CommonModule, ReactiveFormsModule, MaterialModule, RouterLink, DataGrid],
  templateUrl: './pricelist-list.html',
  styleUrl: './pricelist-list.scss',
})
export class PricelistList implements OnInit, OnChanges {

  columns = [
    { columnDef: 'name', header: 'Price List Name' },
    { columnDef: 'code', header: 'Code' },
    { columnDef: 'pricetype', header: 'Price Type' },
    { columnDef: 'validfrom', header: 'Effective From' },
    { columnDef: 'validto', header: 'Effective To' },
    { columnDef: 'description', header: 'Description' },
    {
      columnDef: 'isactive',
      header: 'Status',
      cell: (row: any) => row.isactive ? 'Yes' : 'No'
    }
  ];

  isLoading = false;

  priceLists: PriceListModel[] = [];

  constructor(private service: PriceListService, private cdr: ChangeDetectorRef) { }

  ngOnInit() {
    this.loadPriceLists();
  }


  loadPriceLists(): void {
    this.isLoading = true;

    this.service.getAll().subscribe({
      next: (data) => {
        console.log(data)
        this.priceLists = data ?? [];
        this.cdr.detectChanges();
        this.isLoading = false;

      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }


  onEdit(event: string) { }
  onDelete(event: string) { }

  ngOnChanges(): void {
    if (!this.columns || this.columns.length === 0) {
      return;
    }
  }
}