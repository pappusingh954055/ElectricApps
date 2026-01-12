import { Injectable } from '@angular/core';
import { Product } from '../model/product.model';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../shared/api.service';
import { SubCategory } from '../../subcategory/modesls/subcategory.model';


@Injectable({ providedIn: 'root' })
export class ProductService {

  constructor(private api: ApiService) { }
  
      create(payload: Product): Observable<any> {
          console.log('payload', payload)
          return this.api.post('products', payload);
      }
  
      update(id: string, payload: Product): Observable<any> {
          return this.api.put(`products/${id}`, payload);
      }
  
      delete(id: string): Observable<any> {
          return this.api.delete(`products/${id}`);
      }
  
      getAll(): Observable<Product[]> {
          return this.api.get('products');
      }
       
}
