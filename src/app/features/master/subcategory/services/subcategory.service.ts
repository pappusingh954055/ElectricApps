import { Injectable } from '@angular/core';
import { ApiService } from '../../../../shared/api.service';
import { Observable } from 'rxjs';
import { SubCategory } from '../modesls/subcategory.model';



@Injectable({ providedIn: 'root' })
export class SubCategoryService {

    constructor(private api: ApiService) { }

    create(payload: SubCategory): Observable<any> {
        console.log('payload', payload)
        return this.api.post('subcategories', payload);
    }

    update(id: string, payload: SubCategory): Observable<any> {
        return this.api.put(`subcategories/${id}`, payload);
    }

    delete(id: string): Observable<any> {
        return this.api.delete(`subcategories/${id}`);
    }

    getAll(): Observable<SubCategory[]> {
        return this.api.get('subcategories');
    }
}
