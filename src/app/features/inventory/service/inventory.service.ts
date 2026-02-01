import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../enviornments/environment';
import { ApiService } from '../../../shared/api.service';
import { PurchaseOrderPayload } from '../models/purchaseorder.model';
import { StockSummary } from '../models/stock-summary.model';
import { PriceListItemDto } from '../models/price-list-item.dto';



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
    // getOrders(state: any): Observable<any> {
    //     // Backend record ke parameters Case-Sensitive ho sakte hain
    //     const params = new HttpParams()
    //         .set('PageIndex', state.pageIndex.toString())
    //         .set('PageSize', state.pageSize.toString())
    //         .set('SortField', state.sortField || 'PoDate')
    //         .set('SortOrder', state.sortOrder || 'desc')
    //         .set('Filter', state.filter || ''); // Ensure empty string, null nahi

    //     return this.http.get<any>(`${this.apiUrl}/purchaseorders`, { params });
    // }

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

    // purchase-order.service.ts
    getPagedOrders(request: any): Observable<any> {
        // Ye POST call aapke naye [HttpPost("get-paged-orders")] endpoint ko hit karega
        return this.http.post<any>(`${this.apiUrl}/PurchaseOrders/get-paged-orders`, request);
    }



    /**
     * 2. Delete Single Purchase Order (From Grid/List)
     * Method: DELETE
     * Purpose: Poore Purchase Order record ko database se khatam karna
     */
    deletePurchaseOrder(poId: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/PurchaseOrders/${poId}`);
    }



    bulkDeletePurchaseOrders(ids: number[]): Observable<any> {
        // Method: POST ya DELETE (Aapke backend ke hisaab se)
        return this.http.post(`${this.apiUrl}/PurchaseOrders/bulk-delete-orders`, { ids });
    }

    /**
     * 1. Bulk Delete Items (From Entry Screen)
     * Method: POST
     * Purpose: PO ke andar se selected products ko delete karna
     */
    bulkDeletePOItems(poId: number, itemIds: number[]): Observable<any> {
        const payload = {
            purchaseOrderId: poId,
            itemIds: itemIds
        };
        return this.http.post(`${this.apiUrl}/PurchaseOrders/bulk-delete-items`, payload);
    }

    /** * PO Status update karne ke liye nullable reason parameter ke sath [cite: 2026-01-22]
   */
    updatePOStatus(id: number, status: string, reason?: string): Observable<any> {
        // Payload mein 'Reason' add kiya gaya hai [cite: 2026-01-22]
        const payload = {
            Id: id,
            Status: status,
            Reason: reason || null  // Agar reason undefined hai toh null bhejein [cite: 2026-01-22]
        };

        return this.http.put(`${this.apiUrl}/PurchaseOrders/UpdateStatus`, payload);
    }

    // PO Data pick karne ke liye
    // Thoda aur safe version
    getPODataForGRN(poId: number, grnHeaderId: number | null = null): Observable<any> {
        console.log(`Calling API with PO: ${poId}, GRN: ${grnHeaderId}`);
        let url = `${this.apiUrl}/GRN/GetPOData/${poId}`;

        // Explicit null/undefined check
        if (grnHeaderId !== null && grnHeaderId !== undefined) {
            url += `?grnHeaderId=${grnHeaderId}`;
        }
        return this.http.get(url);
    }
    // GRN save aur stock update ke liye (CQRS Command)
    saveGRN(payload: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/GRN/Save`, payload);
    }
    getCurrentStock(
        sortField: string = '',
        sortOrder: string = '',
        pageIndex: number = 0,
        pageSize: number = 10,
        search: string = '',
        startDate: Date | null = null, // Naya Parameter
        endDate: Date | null = null    // Naya Parameter
    ): Observable<any> {
        // 1. Query parameters build karein
        let params = new HttpParams()
            .set('sortField', sortField)
            .set('sortOrder', sortOrder)
            .set('pageIndex', pageIndex.toString())
            .set('pageSize', pageSize.toString())
            .set('search', search);

        // 2. Date filters add karein agar user ne select kiye hain
        if (startDate) {
            // ISO string format (YYYY-MM-DD) bhej rahe hain taaki C# easily parse kar le
            params = params.set('startDate', startDate.toISOString());
        }
        if (endDate) {
            params = params.set('endDate', endDate.toISOString());
        }

        // 3. API call [cite: 2026-01-22]
        return this.http.get<any>(`${this.apiUrl}/stock/current-stock`, { params });
    }
    /**
   * GRN List fetch karne ke liye (with Paging, Sorting, Searching)
   *
   */
    getGRNPagedList(
        sortField: string = '',
        sortOrder: string = '',
        pageIndex: number = 0,
        pageSize: number = 10,
        search: string = ''
    ): Observable<any> {
        // Query parameters build karein [cite: 2026-01-22]
        let params = new HttpParams()
            .set('sortField', sortField)
            .set('sortOrder', sortOrder)
            .set('pageIndex', pageIndex.toString())
            .set('pageSize', pageSize.toString())
            .set('search', search);

        return this.http.get<any>(`${this.apiUrl}/grn/grn-list`, { params });
    }

    getPendingPurchaseOrders(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/PurchaseOrders/pending-pos`);
    }

    getPOItemsForGRN(poId: number): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/PurchaseOrders/po-items/${poId}`);
    }

    getPriceListItems(priceListId: string): Observable<PriceListItemDto[]> {
        // Ye API wahi DTO return karegi jo humne abhi C# mein banaya hai [cite: 2026-01-22]
        return this.http.get<PriceListItemDto[]>(`${this.apiUrl}/pricelists/price-list-items/${priceListId}`);
    }

    downloadStockReport(productIds: string[]): Observable<Blob> {
        const url = `${this.apiUrl}/Stock/ExportExcel`;

        return this.http.post(url, productIds, {
            responseType: 'blob' // Yeh bilkul sahi hai file download ke liye
        });
    }
}