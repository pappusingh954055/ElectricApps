import { Component, OnInit } from '@angular/core';

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
export class ProductList  implements OnInit {

  displayedColumns = [
    'name',
    'category',
    'subcategory',
    'unit',
    'gst',
    'status',
    'actions'
  ];

  products: Product[] = [];

  constructor(private service: ProductService) {}

  ngOnInit() {
    this.products = this.service.getAll();
  }

  toggleStatus(product: Product) {
    product.isActive = !product.isActive;
  }
}