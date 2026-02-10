import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../shared/api.service';

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
    private api = inject(ApiService);

    getUnreadNotifications(): Observable<NotificationDto[]> {
        return this.api.get<NotificationDto[]>('Notifications/unread');
    }

    getUnreadCount(): Observable<number> {
        return this.api.get<number>('Notifications/count');
    }

    markAsRead(id: number): Observable<any> {
        return this.api.post(`Notifications/${id}/mark-read`, {});
    }

    markAllAsRead(): Observable<any> {
        return this.api.post('Notifications/mark-all-read', {});
    }
}
