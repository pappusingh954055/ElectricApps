import { Component, OnInit } from '@angular/core';

import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../shared/material/material/material-module';
import { RouterLink } from '@angular/router';
import { Category } from '../../../../core/models/category-models/category.model';
import { CategoryService } from '../services/category.service';


@Component({
  selector: 'app-category-list',
  imports: [CommonModule, ReactiveFormsModule, MaterialModule, RouterLink],
  templateUrl: './category-list.html',
  styleUrl: './category-list.scss',
})
export class CategoryList implements OnInit {

  displayedColumns = ['name', 'code', 'gst', 'status', 'actions'];
  categories: Category[] = [];

  constructor(private service: CategoryService) {}

  ngOnInit() {
   // this.categories = this.service.getAll();
  }

  toggleStatus(category: Category) {
    category.isActive = !category.isActive;
  }
}