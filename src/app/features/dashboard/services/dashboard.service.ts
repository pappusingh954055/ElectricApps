import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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
}