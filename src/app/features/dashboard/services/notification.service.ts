import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface NotificationDto {
    id: number;
    title: string;
    message: string;
    type: string;
    isRead: boolean;
    createdAtFormatted: string;
    targetUrl: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
    
    private apiUrl = `https://localhost:7052/api`;

    constructor(private http: HttpClient) { }

    getUnreadNotifications(): Observable<NotificationDto[]> {
        return this.http.get<NotificationDto[]>(`${this.apiUrl}/Notifications/unread`);
    }

    getUnreadCount(): Observable<number> {
        return this.http.get<number>(`${this.apiUrl}/Notifications/count`);
    }

    markAsRead(id: number): Observable<any> {
        return this.http.post(`${this.apiUrl}/Notifications/${id}/mark-read`, {});
    }

    markAllAsRead(): Observable<any> {
        return this.http.post(`${this.apiUrl}/Notifications/mark-all-read`, {});
    }
}