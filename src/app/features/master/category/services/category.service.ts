import { Injectable } from '@angular/core';
import { ApiService } from '../../../../shared/api.service';
import { Observable } from 'rxjs';
import { Category } from '../models/category.model';
import { HttpParams } from '@angular/common/http';
import { GridRequest } from '../../../../shared/models/grid-request.model';
import { GridResponse } from '../../../../shared/models/grid-response.model';
import { CategoryGridDto } from '../models/category-grid-response.model';


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

    delete(id: any): Observable<any> {
        return this.api.delete(`categories/${id}`);
    }

    // 🔹 Bulk delete (THIS IS WHAT YOU ASKED)
  deleteMany(ids: string[]): Observable<any> {
    return this.api.post(`categories/bulk-delete`, ids);
  }

    getAll(): Observable<Category[]> {
        return this.api.get('categories');
    }

    getPagedCategories(
        request: GridRequest
    ): Observable<GridResponse<CategoryGridDto>> {

        const query: string[] = [];

        query.push(`pageNumber=${request.pageNumber}`);
        query.push(`pageSize=${request.pageSize}`);

        if (request.search) {
            query.push(`search=${encodeURIComponent(request.search)}`);
        }

        if (request.sortBy) {
            query.push(`sortBy=${request.sortBy}`);
            query.push(`sortDirection=${request.sortDirection ?? 'desc'}`);
        }

        const queryString = query.join('&');

        return this.api.get<GridResponse<CategoryGridDto>>(
            `categories?${queryString}`
        );
    }

}
