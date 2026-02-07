import { Injectable } from '@angular/core';
import { LowStockProductDto, Product } from '../model/product.model';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../shared/api.service';
import { SubCategory } from '../../subcategory/modesls/subcategory.model';
import { GridResponse } from '../../../../shared/models/grid-response.model';
import { GridRequest } from '../../../../shared/models/grid-request.model';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class ProductService {

    constructor(private api: ApiService, private http: HttpClient) { }

    url = ' https://localhost:7052/api/products';

    /**
     * 🔍 Search Products for Autocomplete
     * @param term Search string (Name or SKU)
     * @returns Observable of Product array
     */
    searchProducts(term: string): Observable<Product[]> {
        // Agar term khali hai toh empty array return karein
        if (!term || term.trim() === '') {
            return new Observable(observer => observer.next([]));
        }

        // Backend API ko query parameter bhej raha hai: e.g., /products/search?term=laptop
        return this.api.get<Product[]>(`products/search?term=${encodeURIComponent(term)}`);
    }

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

    getPaged(request: GridRequest): Observable<GridResponse<Product>> {
        return this.api.get<GridResponse<Product>>(
            `products/paged?${this.toQueryString(request)}`
        );
    }

    getById(id: string): Observable<Product> {
        return this.api.get<Product>(`products/${id}`);
    }

    deleteMany(ids: string[]): Observable<any> {
        return this.api.post<any>(`products/bulk-delete`, ids);
    }

    searchProductsData(term: string): Observable<any[]> {
        // API call jo product name ya code ke base par search karegi
        return this.api.get<any[]>(`${this.url}/search?term=${term}`);
    }

    public toQueryString(request: GridRequest): string {
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

        // ✅ ADD COLUMN FILTERS
        if (request.filters) {
            Object.keys(request.filters).forEach(key => {
                const value = request.filters![key];
                if (value !== undefined && value !== null && value !== '') {
                    query.push(
                        `filters[${encodeURIComponent(key)}]=${encodeURIComponent(value)}`
                    );
                }
            });
        }

        return query.join('&');
    }

    getLowStockProducts(): Observable<LowStockProductDto[]> {
        return this.http.get<LowStockProductDto[]>(`${this.url}/products/low-stock`);
    }
}