import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { POHeaderDetailsDto } from '../models/poheader-details-dto';

@Injectable({ providedIn: 'root' })
export class POService {
  private apiUrl = "https://localhost:7052/api";

  constructor(private http: HttpClient) { }

  // Edit mode ke liye data fetch karna
  getById(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/purchaseorders/${id}`);
  }

  // Update karne ke liye
  update(id: any, payload: any): Observable<any> {
    console.log('payload', id + payload)
    // Ensure id is present to avoid 'undefined' in URL
    return this.http.put(`${this.apiUrl}/purchaseorders/${id}`, payload);
  }
  getPOHeaderDetails(lastPoId: number): Observable<POHeaderDetailsDto> {
    // Yahan '33' pass hoga
    return this.http.get<POHeaderDetailsDto>(`${this.apiUrl}/PurchaseOrders/header-details/${lastPoId}`);
  }
  // purchase.service.ts
  // inventory.service.ts
  getProductRate(productId: string, priceListId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/PurchaseOrders/get-product-rate`, {
      params: { productId, priceListId }
    });
  }

  bulkSentForDraftApproval(ids: number[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/PurchaseOrders/bulk-sent-for-approval`, ids);
  }

  bulkDraftApprove(ids: number[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/PurchaseOrders/bulk-approve`, ids);
  }

  bulkPOReject(ids: number[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/PurchaseOrders/bulk-reject`, ids);
  }
}