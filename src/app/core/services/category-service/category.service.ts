import { Injectable } from '@angular/core';
import { Category } from '../../models/category-models/category.model';

@Injectable({ providedIn: 'root' })
export class CategoryService {

  private categories: Category[] = [
    { id: 1, name: 'Electronics', code: 'ELEC', defaultGst: 18, isActive: true },
    { id: 2, name: 'Grocery', code: 'GROC', defaultGst: 5, isActive: true }
  ];

  getAll(): Category[] {
    return this.categories;
  }

  add(category: Category) {
    category.id = Date.now();
    this.categories.push(category);
  }

  update(category: Category) {
    const index = this.categories.findIndex(c => c.id === category.id);
    if (index > -1) this.categories[index] = category;
  }
}
