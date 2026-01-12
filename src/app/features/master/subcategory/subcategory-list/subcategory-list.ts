import { ChangeDetectorRef, Component, OnChanges, OnInit, inject } from '@angular/core';


import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../../../shared/material/material/material-module';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { SubCategoryService } from '../services/subcategory.service';
import { SubCategory } from '../modesls/subcategory.model';

import { CategoryService } from '../../category/services/category.service';




@Component({
  selector: 'app-subcategory-list',
  imports: [CommonModule, MaterialModule, ReactiveFormsModule, RouterLink],
  templateUrl: './subcategory-list.html',
  styleUrl: './subcategory-list.scss',
})
export class SubcategoryList implements OnInit, OnChanges {

  columns = [
    { columnDef: 'categoryName', header: 'Category' },
    { columnDef: 'subcategoryName', header: 'Subcategory' },
    { columnDef: 'subcategoryCode', header: 'Code' },
    { columnDef: 'defaultGst', header: 'GST %' },
    {
      columnDef: 'isActive',
      header: 'Status',
      cell: (row: any) => row.isActive ? 'Yes' : 'No'
    }
  ];

  isLoading = false;


  constructor(
    private subCatservice: SubCategoryService,
    private categoriesService: CategoryService,
    private cdr: ChangeDetectorRef

  ) { }



  subcategories: SubCategory[] = [];

  loadSubCategories(): void {
    this.isLoading = true;

    this.subCatservice.getAll().subscribe({
      next: (data) => {
        console.log(data)
        this.subcategories = data ?? [];
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

 

  ngOnInit(): void {

    this.loadSubCategories();
  }
  onEdit(event: string) { }
  onDelete(event: string) { }

  ngOnChanges(): void {
    if (!this.columns || this.columns.length === 0) {
      return;
    }
  }
}