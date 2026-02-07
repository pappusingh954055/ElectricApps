import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';


@Injectable({
    providedIn: 'root'
})
export class DashboardService {
    private apiUrl = `https://localhost:7052/api`;

    constructor(private http: HttpClient) { }

    // Top 4 widgets ka data lane ke liye
    getSummary(): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/dashboard/summary`);
    }

    // Charts ka data lane ke liye
    getChartData(): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/dashboard/charts`);
    }

    getRecentActivities(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/dashboard/recent-activities`);
    }

    /**
   * Virtual Scrolling ke liye Paginated Stock Movements
   * @param page Default 1
   * @param size Default 10 (Ek baar mein kitne records chahiye)
   */
    getRecentMovements(page: number = 1, size: number = 10): Observable<any[]> {
        // HttpParams ka use karke query string banayein: ?pageNumber=1&pageSize=10
        const params = new HttpParams()
            .set('pageNumber', page.toString())
            .set('pageSize', size.toString());

        return this.http.get<any[]>(`${this.apiUrl}/dashboard/recent-movements`, { params });
    }
}