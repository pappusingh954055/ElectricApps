import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';

import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../shared/material/material/material-module';
import { RouterLink } from '@angular/router';

import { CategoryGridview } from '../category-gridview/category-gridview';
import { Category } from '../models/category.model';
import { CategoryService } from '../services/category.service';
import { DataGrid } from '../../../../shared/components/data-grid/data-grid';

@Component({
  selector: 'app-category-list',
  imports: [CommonModule, ReactiveFormsModule, MaterialModule, RouterLink, DataGrid],
  templateUrl: './category-list.html',
  styleUrl: './category-list.scss',
})
export class CategoryList {

  constructor(private cdr: ChangeDetectorRef) {

  }

  readonly categoryService = inject(CategoryService)

  columns = [
    { columnDef: 'categoryName', header: 'Name' },
    { columnDef: 'categoryCode', header: 'Code' },
    { columnDef: 'defaultGst', header: 'GST %' },
    {
      columnDef: 'isActive',
      header: 'Status',
      cell: (row: any) => row.isActive ? 'Active' : 'Inactive'
    }
  ];

  categories: Category[] = [];
  isLoading = false;

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.isLoading = true;

    this.categoryService.getAll().subscribe({
      next: (data) => {
        console.log(data)
        this.categories = data ?? [];
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
}