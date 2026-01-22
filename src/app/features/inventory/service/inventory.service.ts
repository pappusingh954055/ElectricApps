import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../enviornments/environment';
import { ApiService } from '../../../shared/api.service';
import { PurchaseOrderPayload } from '../models/purchaseorder.model';



@Injectable({
    providedIn: 'root'
})
export class InventoryService {

    private http = inject(HttpClient);



    private apiUrl = "https://localhost:7052/api";

    getNextPoNumber(): Observable<{ poNumber: string }> {

        return this.http.get<{ poNumber: string }>(`${this.apiUrl}/purchaseorders/next-number`);
    }

    // PO Save karne ke liye
    savePoDraft(payload: PurchaseOrderPayload): Observable<any> {
        return this.http.post(`${this.apiUrl}/PurchaseOrders/save-po`, payload);
    }

    // Paged aur Sorted Data fetch karne ke liye
 getOrders(state: any): Observable<any> {
    // Backend record ke parameters Case-Sensitive ho sakte hain
    const params = new HttpParams()
        .set('PageIndex', state.pageIndex.toString())
        .set('PageSize', state.pageSize.toString())
        .set('SortField', state.sortField || 'PoDate')
        .set('SortOrder', state.sortOrder || 'desc')
        .set('Filter', state.filter || ''); // Ensure empty string, null nahi

    return this.http.get<any>(`${this.apiUrl}/purchaseorders`, { params });
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

    /**
   * Price List ke basis par product ka rate fetch karne ke liye
   * @param productId - Selected Product ki ID
   * @param priceListId - Selected Price List ki ID
   */
    // inventory.service.ts
    // inventory.service.ts
    getProductRate(productId: string, priceListId: string): Observable<any> {
        // Params ensure karte hain ki data URL ke piche ?productId=... bankar jaye
        const params = new HttpParams()
            .set('productId', productId)
            .set('priceListId', priceListId);

        return this.http.get(`${this.apiUrl}/products/rate`, { params });
    }
}