import { Component, OnInit, inject } from '@angular/core';


import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../../../shared/material/material/material-module';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SubcategoryService } from '../../../../core/services/subcategory-service/subcategory.service';

import { Subcategory } from '../../../../core/models/subcategory-models/subcategory.model';





@Component({
  selector: 'app-subcategory-list',
  imports: [CommonModule, MaterialModule, ReactiveFormsModule, RouterLink],
  templateUrl: './subcategory-list.html',
  styleUrl: './subcategory-list.scss',
})
export class SubcategoryList implements OnInit {

  displayedColumns = ['category', 'name', 'status', 'actions'];

  constructor(
    private service: SubcategoryService,

  ) { }

  // readonly categoryService = inject(CategoryService);

  subcategories: Subcategory[] = [];

  filteredSubcategories: Subcategory[] = [];

  // categories = this.categoryService.getAll();
  selectedCategoryId: number | null = null;


  ngOnInit() {
    this.subcategories = this.service.getAll();
    this.filteredSubcategories = this.subcategories;
  }

  filterByCategory() {
    if (!this.selectedCategoryId) {
      this.filteredSubcategories = this.subcategories;
      return;
    }

    this.filteredSubcategories = this.subcategories.filter(
      s => s.categoryId === this.selectedCategoryId
    );
  }

  toggleStatus(sub: Subcategory) {
    sub.isActive = !sub.isActive;
  }
}