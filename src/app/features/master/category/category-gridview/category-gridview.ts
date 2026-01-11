import { CommonModule } from '@angular/common';
import { Component, Input, input, OnInit } from '@angular/core';
import { MaterialModule } from '../../../../shared/material/material/material-module';
import { MatTableDataSource } from '@angular/material/table';
import { Category } from '../models/category.model';
import { CategoryService } from '../services/category.service';

@Component({
  selector: 'category-gridview',
  imports: [CommonModule, MaterialModule],
  templateUrl: './category-gridview.html',
  styleUrl: './category-gridview.scss',
})
export class CategoryGridview implements OnInit {
  displayedColumns = [
    'categoryName',
    'categoryCode',
    'defaultGst',
    'isActive'
  ];

  dataSource = new MatTableDataSource<Category>();
  isLoading = false;

  @Input() categoryData: any;

  constructor(private categoryService: CategoryService) { }

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.isLoading = true;

    this.categoryService.getAll().subscribe({
      next: data => {
        this.dataSource.data = data;
        this.categoryData= this.dataSource.data;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }
}
