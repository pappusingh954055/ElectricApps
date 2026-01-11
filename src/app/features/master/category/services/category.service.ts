import { Injectable } from '@angular/core';
import { ApiService } from '../../../../shared/api.service';
import { Observable } from 'rxjs';
import { Category } from '../models/category.model';


@Injectable({ providedIn: 'root' })
export class CategoryService {

    constructor(private api: ApiService) { }

    create(payload: Category): Observable<any> {
        console.log('payload', payload)
        return this.api.post('categories', payload);
    }

    update(id: string, payload: Category): Observable<any> {
        return this.api.put(`categories/${id}`, payload);
    }

    delete(id: string): Observable<any> {
        return this.api.delete(`categories/${id}`);
    }

    getAll(): Observable<Category[]> {
        return this.api.get('categories');
    }
}
