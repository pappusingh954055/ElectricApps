import { Injectable } from '@angular/core';
import { Product } from '../model/product.model';


@Injectable({ providedIn: 'root' })
export class ProductService {

  private products: Product[] = [];

  getAll(): Product[] {
    return this.products;
  }

  getById(id: number): Product | undefined {
    return this.products.find(p => p.id === id);
  }

  add(product: Product) {
    product.id = Date.now();
    this.products.push(product);
  }

  update(product: Product) {
    const index = this.products.findIndex(p => p.id === product.id);
    if (index > -1) this.products[index] = product;
  }
}
