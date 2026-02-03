import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { POHeaderDetailsDto } from '../models/poheader-details-dto';

@Injectable({ providedIn: 'root' })
export class SaleOrderService {
    private apiUrl = "https://localhost:7052/api";

    constructor(private http: HttpClient) { }


    saveSaleOrder(orderData: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/SaleOrder/save`, orderData);
    }

    exportSaleOrderList(): Observable<Blob> {
        // Bina IDs ke call
        return this.http.get(`${this.apiUrl}/saleorder/export-list`, {
            responseType: 'blob'
        });
    }


    getSaleOrders(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/saleorder`);
    }


    updateSaleOrderStatus(id: number, status: string): Observable<any> {
        // Fix: PATCH use karein taaki backend se sync ho jaye
        return this.http.patch(`${this.apiUrl}/saleorder/${id}/status`, { status: status });
    }


    getSaleOrderById(id: number): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/saleorder/${id}`);
    }

    SaleOrderReportDownload(productIds: string[]) {
        return this.http.post(`${this.apiUrl}/saleorder/export`, productIds, { responseType: 'blob' });
    }
}