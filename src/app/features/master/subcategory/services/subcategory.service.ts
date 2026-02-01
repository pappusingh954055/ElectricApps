import { Injectable } from '@angular/core';
import { ApiService } from '../../../../shared/api.service';
import { Observable } from 'rxjs';
import { SubCategory } from '../modesls/subcategory.model';
import { GridRequest } from '../../../../shared/models/grid-request.model';
import { GridResponse } from '../../../../shared/models/grid-response.model';
import { CategoryGridDto } from '../../category/models/category-grid-response.model';



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
    // 🔹 Bulk delete (THIS IS WHAT YOU ASKED)
    deleteMany(ids: string[]): Observable<any> {
        return this.api.post<any>(`subcategories/bulk-delete`, ids);
    }

    getAll(): Observable<SubCategory[]> {
        return this.api.get('subcategories');
    }

    getPaged(request: GridRequest): Observable<GridResponse<SubCategory>> {
        return this.api.post<GridResponse<SubCategory>>(
            `subcategories/paged`, request
        );
    }

    getById(id: string): Observable<SubCategory> {
        return this.api.get<SubCategory>(`subcategories/${id}`);
    }
}


