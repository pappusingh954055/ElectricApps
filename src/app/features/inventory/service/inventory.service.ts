import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../enviornments/environment';
import { ApiService } from '../../../shared/api.service';



@Injectable({
    providedIn: 'root'
})
export class InventoryService {

    private http = inject(HttpClient);



    private apiUrl = "https://localhost:7052/api";

    getNextPoNumber(): Observable<{ poNumber: string }> {

        return this.http.get<{ poNumber: string }>(`${this.apiUrl}/next-number`);
    }

    // PO Save karne ke liye
    createPurchaseOrder(payload: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/purchaseorders`, payload);
    }
    // 1. Saari active Price Lists load karne ke liye
    getPriceLists(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/pricelists`);
    }

    // 2. Kisi specific Price List se product ka rate aur discount nikalne ke liye
    getPriceListRate(priceListId: string, productId: number): Observable<any> {
        // Query parameters ke saath request bhejenge
        return this.http.get<any>(`${this.apiUrl}/pricelists/${priceListId}/product-rate/${productId}`);
    }
}