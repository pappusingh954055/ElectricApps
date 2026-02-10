import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../shared/api.service';


@Injectable({
    providedIn: 'root'
})
export class DashboardService {
    private api = inject(ApiService);

    // Top 4 widgets ka data lane ke liye
    getSummary(): Observable<any> {
        return this.api.get<any>('dashboard/summary');
    }

    // Charts ka data lane ke liye
    getChartData(): Observable<any> {
        return this.api.get<any>('dashboard/charts');
    }

    getRecentActivities(): Observable<any[]> {
        return this.api.get<any[]>('dashboard/recent-activities');
    }

    /**
   * Virtual Scrolling ke liye Paginated Stock Movements
   * @param page Default 1
   * @param size Default 10 (Ek baar mein kitne records chahiye)
   */
    getRecentMovements(page: number = 1, size: number = 10): Observable<any[]> {
        return this.api.get<any[]>(`dashboard/recent-movements?pageNumber=${page}&pageSize=${size}`);
    }
}
