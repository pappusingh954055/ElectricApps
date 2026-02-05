import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

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
        fromDate?: string,
        toDate?: string,
        sortField: string = 'ReturnDate',
        sortOrder: string = 'desc'
    ): Observable<any> {
        let params = new HttpParams()
            .set('filter', search)
            .set('pageIndex', pageIndex.toString())
            .set('pageSize', pageSize.toString())
            .set('sortField', sortField)
            .set('sortOrder', sortOrder);

        if (fromDate) params = params.set('fromDate', fromDate);
        if (toDate) params = params.set('toDate', toDate);

        return this.http.get(`${this.apiUrl}/SaleReturn/list`, { params });
    }

    // Create Sale Return
    saveSaleReturn(data: any): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/SaleReturn/create`, data);
    }

    // Get Sale Return Details by ID
    getSaleReturnById(id: number): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/SaleReturn/details/${id}`);
    }

    // Get Customers who have items that can be returned (if applicable)
    // Or just a list of customers to start the return process
    getCustomers(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/SaleReturn/customers`); 
    }

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
}
