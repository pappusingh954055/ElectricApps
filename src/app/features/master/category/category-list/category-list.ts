import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';

import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../shared/material/material/material-module';
import { RouterLink } from '@angular/router';

import { CategoryGridview } from '../category-gridview/category-gridview';
import { Category } from '../models/category.model';
import { CategoryService } from '../services/category.service';
import { DataGrid } from '../../../../shared/components/data-grid/data-grid';
import { GridColumn } from '../../../../shared/models/grid-column.model';
import { GridRequest } from '../../../../shared/models/grid-request.model';
import { GridResponse } from '../../../../shared/models/grid-response.model';
import { ServerDatagridComponent } from '../../../../shared/components/server-datagrid-component/server-datagrid-component';
import { CategoryGridDto } from '../models/category-grid-response.model';

@Component({
  selector: 'app-category-list',
  imports: [CommonModule, ReactiveFormsModule, MaterialModule, RouterLink, ServerDatagridComponent
  ],
  templateUrl: './category-list.html',
  styleUrl: './category-list.scss',
})
export class CategoryList {

  constructor(private cdr: ChangeDetectorRef) {

  }

  readonly categoryService = inject(CategoryService)

  categories: Category[] = [];
  isLoading = false;

  data: CategoryGridDto[] = [];
  totalCount = 0;


  // columns: GridColumn[] = [
  //   { field: 'categoryName', header: 'Category', sortable: true },
  //   { field: 'categoryCode', header: 'Code', sortable: true },
  //   { field: 'defaultGst', header: 'GST %', sortable: true },
  //   { field: 'isActive', header: 'Active' }
  // ];

  // data: any[] = [];
  // totalCount = 0;


  // columns = [
  //   { columnDef: 'categoryName', header: 'Name' },
  //   { columnDef: 'categoryCode', header: 'Code' },
  //   { columnDef: 'defaultGst', header: 'GST %' },
  //   {
  //     columnDef: 'isActive',
  //     header: 'Status',
  //     cell: (row: any) => row.isActive ? 'Active' : 'Inactive'
  //   }
  // ];

  columns: GridColumn[] = [
    { field: 'categoryName', header: 'Category', sortable: true },
    { field: 'categoryCode', header: 'Code', sortable: true },
    { field: 'defaultGst', header: 'GST %', sortable: true },
    { field: 'isActive', 
      header: 'Status',
      cell: (row: any) => row.isActive ? 'Yes' : 'No'
    }
  ];


  ngOnInit(): void {
    // Initial load
    this.loadCategories({
      pageNumber: 1,
      pageSize: 10,
      sortDirection: 'desc'
    });
  }

  loadCategories(request: GridRequest): void {
    this.isLoading = true;

    this.categoryService.getPagedCategories(request).subscribe({
      next: res => {
        this.data = res.items;
        this.totalCount = res.totalCount;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: err => {
        console.error('Failed to load categories', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onEdit(event: string) { }
  onDelete(event: string) { }
}