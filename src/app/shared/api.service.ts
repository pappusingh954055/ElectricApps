import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../enviornments/environment';
import { GridRequest } from './models/grid-request.model';

@Injectable({ providedIn: 'root' })
export class ApiService {

    constructor(private http: HttpClient) { }

    post<T>(url: string, body: any): Observable<T> {
        console.log('body', body)
        return this.http.post<T>(`${environment.ApiBaseUrl}/${url}`, body);
    }

    put<T>(url: string, body: any): Observable<T> {
        return this.http.put<T>(`${environment.ApiBaseUrl}/${url}`, body);
    }

    delete<T>(url: string): Observable<T> {
        return this.http.delete<T>(`${environment.ApiBaseUrl}/${url}`);
    }

    get<T>(url: string): Observable<T> {
        return this.http.get<T>(`${environment.ApiBaseUrl}/${url}`);
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

        return query.join('&');
    }
}
