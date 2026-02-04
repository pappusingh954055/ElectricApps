import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';


@Injectable({
    providedIn: 'root'
})
export class PurchaseReturnService {
    // private apiUrl = `${environment.apiUrl}/api/PurchaseReturn`;
    private apiUrl = "https://localhost:7052/api";

    constructor(private http: HttpClient) { }

    // Supplier ke rejected items mangwane ke liye
    getSuppliersWithRejections(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/PurchaseReturn/suppliers-with-rejections`);
    }

    // 2. Supplier select hone ke baad items ke liye
    getRejectedItems(supplierId: number): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/PurchaseReturn/rejected-items/${supplierId}`);
    }

    // Naya Return save karne ke liye [cite: 2026-02-03]
    savePurchaseReturn(data: any): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/PurchaseReturn/create`, data);
    }

    // getPurchaseReturns(): Observable<any[]> {
    //     return this.http.get<any[]>(`${this.apiUrl}/PurchaseReturn/list`);
    // }

    getPurchaseReturns(search: string = '', pageIndex: number = 0, pageSize: number = 10): Observable<any> {
        let params = new HttpParams()
            .set('search', search)
            .set('pageIndex', pageIndex.toString())
            .set('pageSize', pageSize.toString());

        return this.http.get(`${this.apiUrl}/PurchaseReturn/list`, { params }); // Backend 'list' endpoint [cite: 2026-02-04]
    }

    getPurchaseReturnById(id: number): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/PurchaseReturn/details/${id}`);
    }
}