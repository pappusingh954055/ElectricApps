import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SaleReturnPagedResponse } from '../models/sale-return.model';
import { CreateSaleReturnDto } from '../models/create-sale-return.model';

@Injectable({
    providedIn: 'root'
})
export class SaleReturnService {
    // Assuming the API structure is similar to PurchaseReturn
    private apiUrl = "https://localhost:7052/api";

    constructor(private http: HttpClient) { }

    // Get Sale Returns List
    getSaleReturns(
        search: string = '',
        pageIndex: number = 0,
        pageSize: number = 10,
        sortField: string = 'ReturnDate',
        sortOrder: string = 'desc',
        fromDate?: Date, // Naya parameter [cite: 2026-02-05]
        toDate?: Date    // Naya parameter [cite: 2026-02-05]
    ): Observable<SaleReturnPagedResponse> {
        let params = new HttpParams()
            .set('search', search)
            .set('pageIndex', pageIndex.toString())
            .set('pageSize', pageSize.toString())
            .set('sortField', sortField)
            .set('sortOrder', sortOrder);

        // Agar date hai toh params mein add karein [cite: 2026-02-05]
        if (fromDate) params = params.set('fromDate', fromDate.toISOString());
        if (toDate) params = params.set('toDate', toDate.toISOString());

        return this.http.get<SaleReturnPagedResponse>(`${this.apiUrl}/SaleReturn/list`, { params });
    }

    // Create Sale Return
    saveSaleReturn(data: CreateSaleReturnDto): Observable<any> {
        return this.http.post(`${this.apiUrl}/SaleReturn/create`, data); // Backend Controller [cite: 2026-02-05]
    }

    deleteSaleReturn(id: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/SaleReturn/delete/${id}`);
    }

    // Get Sale Return Details by ID
    getSaleReturnById(id: number): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/SaleReturn/details/${id}`);
    }

    // Get Customers who have items that can be returned (if applicable)
    // Or just a list of customers to start the return process

    // Get Sale Orders/Invoices for a specific customer
    getSaleOrders(customerId: number): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/SaleReturn/sale-orders/${customerId}`);
    }

    // Get Items for a specific Sale Order
    getSaleOrderItems(soId: number): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/SaleReturn/sale-order-items/${soId}`);
    }

    // Export to Excel
    downloadExcel(fromDate?: string, toDate?: string): Observable<Blob> {
        let params = new HttpParams();
        if (fromDate) params = params.set('fromDate', fromDate);
        if (toDate) params = params.set('toDate', toDate);

        return this.http.get(`${this.apiUrl}/SaleReturn/export-excel`, {
            params: params,
            responseType: 'blob'
        });
    }

    getPrintData(id: number): Observable<any> {
        return this.http.get(`${this.apiUrl}/SaleReturn/print-data/${id}`);
    }

    printCreditNote(id: number): Observable<Blob> {
        const url = `${this.apiUrl}/SaleReturn/print/${id}`;
        return this.http.get(url, { responseType: 'blob' });
    }
}
