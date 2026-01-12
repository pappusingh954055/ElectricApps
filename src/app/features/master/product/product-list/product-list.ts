import { ChangeDetectorRef, Component, OnChanges, OnInit } from '@angular/core';

import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../shared/material/material/material-module';
import { Product } from '../model/product.model';
import { ProductService } from '../service/product.service';


@Component({
  selector: 'app-product-list',
  imports: [CommonModule, RouterLink, ReactiveFormsModule, MaterialModule],
  templateUrl: './product-list.html',
  styleUrl: './product-list.scss',
})
export class ProductList implements OnInit, OnChanges {

  columns = [
    { columnDef: 'categoryName', header: 'Category' },
    { columnDef: 'subcategoryName', header: 'Subcategory' },
    { columnDef: 'productname', header: 'Product' },
    { columnDef: 'sku', header: 'SKU' },
    { columnDef: 'unit', header: 'Unit' },

    { columnDef: 'defaultGst', header: 'GST %' },
    { columnDef: 'hsncode', header: 'HSN Code' },
    { columnDef: 'minstock', header: 'Min Stock' },
    {
      columnDef: 'trackinventory',
      header: 'Status',
      cell: (row: any) => row.trackinventory ? 'Yes' : 'No'
    }
  ];

  isLoading = false;

  products: Product[] = [];

  constructor(private ProductService: ProductService,
    private cdr: ChangeDetectorRef) { }

  ngOnInit() {
    this.loadProducts();
  }
  loadProducts(): void {
    this.isLoading = true;

    this.ProductService.getAll().subscribe({
      next: (data) => {
        console.log(data)
        this.products = data ?? [];
        console.log(this.products);
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

  toggleStatus(product: Product) {
    product.trackinventory = !product.trackinventory;
  }
  ngOnChanges(): void {
    if (!this.columns || this.columns.length === 0) {
      return;
    }
  }
  onEdit(event: any) { }

  onDelete(event: any) { }
}