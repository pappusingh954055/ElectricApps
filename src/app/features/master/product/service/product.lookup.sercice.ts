import { Injectable } from '@angular/core';
import { Product } from '../model/product.model';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../shared/api.service';



export interface CategoryLookup {
    id: string;
    name: string;
}
export interface SubcategoryLookup {
    id: string;
    categoryId: string;
    name: string;
}

export interface ProductLookupResponse {
    categories: CategoryLookup[];
    subcategories: SubcategoryLookup[];
}


@Injectable({ providedIn: 'root' })
export class ProductLookUpService {

    constructor(private api: ApiService) { }

    //pageload
    getLookups(): Observable<CategoryLookup> {
        return this.api.get<CategoryLookup>('products/lookups');
    }

    //category change
    getSubcategoriesByCategory(categoryId: string): Observable<SubcategoryLookup> {
        return this.api.get<SubcategoryLookup>(`subcategories/by-category/${categoryId}`);
    }
}
