import { Injectable } from '@angular/core';
import { ApiService } from '../../../../shared/api.service';
import { Observable } from 'rxjs';
import { PriceListModel } from '../models/pricelist.model';
import { GridRequest } from '../../../../shared/models/grid-request.model';
import { GridResponse } from '../../../../shared/models/grid-response.model';
import { HttpClient } from '@angular/common/http';





@Injectable({ providedIn: 'root' })
export class PriceListService {

    constructor(private api: ApiService,
        private http: HttpClient
    ) { }

    private apiUrl = "https://localhost:7052/api/";

    create(payload: PriceListModel): Observable<any> {
        console.log('payload', payload)
        return this.http.post(this.apiUrl + 'pricelists', payload);
    }

    update(id: string, payload: PriceListModel): Observable<any> {
        return this.http.put(this.apiUrl + `pricelists/${id}`, payload);
    }

    delete(id: string): Observable<any> {
        return this.http.delete(this.apiUrl + `pricelists/${id}`);
    }

    deletePriceList(id: string): Observable<any> {
        return this.http.delete<any>(this.apiUrl + `pricelists/${id}`);
    }

    getAll(): Observable<PriceListModel[]> {
        return this.http.get<PriceListModel[]>(this.apiUrl + 'pricelists');
    }

    getPriceLists(): Observable<PriceListModel[]> {
        return this.http.get<PriceListModel[]>(this.apiUrl + 'pricelists');
    }



    getPaged(request: GridRequest): Observable<GridResponse<PriceListModel>> {
        return this.http.get<GridResponse<PriceListModel>>(
            this.apiUrl + `pricelists/paged?${this.toQueryString(request)}`
        );
    }

    // 🔹 Bulk delete (THIS IS WHAT YOU ASKED)
    deleteMany(ids: string[]): Observable<any> {
        return this.http.post<any>(this.apiUrl + `pricelists/bulk-delete`, ids);
    }

    createPriceList(payload: any): Observable<any> {
        console.log('Creating Price List with payload:', payload);
        // Dhan rakhein ki URL aapke backend controller se match kare
        return this.http.post(this.apiUrl + 'pricelists', payload);
    }

    // 4. Existing Price List ko update karne ke liye
    updatePriceList(id: string, payload: any): Observable<any> {
        return this.http.put<any>(this.apiUrl + `pricelists/${id}`, payload);
    }

    getPriceListById(id: string): Observable<any> {
        return this.http.get<any>(this.apiUrl + `pricelists/${id}`);
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
}
