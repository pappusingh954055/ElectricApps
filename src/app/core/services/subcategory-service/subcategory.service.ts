import { Injectable } from '@angular/core';
import { Subcategory } from '../../models/subcategory-models/subcategory.model';



@Injectable({ providedIn: 'root' })
export class SubcategoryService {

  private subcategories: Subcategory[] = [
    {
      id: 1,
      categoryId: 1,
      categoryName: 'Electronics',
      name: 'Mobile Phones',
      isActive: true
    },
    {
      id: 2,
      categoryId: 2,
      categoryName: 'Grocery',
      name: 'Rice',
      isActive: true
    }
  ];

  getAll(): Subcategory[] {
    return this.subcategories;
  }

  add(subcategory: Subcategory) {
    subcategory.id = Date.now();
    this.subcategories.push(subcategory);
  }

  update(subcategory: Subcategory) {
    const index = this.subcategories.findIndex(s => s.id === subcategory.id);
    if (index > -1) this.subcategories[index] = subcategory;
  }
  getById(id: number) {
  return this.subcategories.find(s => s.id === id);
}

}
