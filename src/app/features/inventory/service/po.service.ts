import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { POHeaderDetailsDto } from '../models/poheader-details-dto';
import { ApiService } from '../../../shared/api.service';

@Injectable({ providedIn: 'root' })
export class POService {
  private api = inject(ApiService);

  // Edit mode ke liye data fetch karna
  getById(id: number): Observable<any> {
    return this.api.get(`purchaseorders/${id}`);
  }

  // Update karne ke liye
  update(id: any, payload: any): Observable<any> {
    return this.api.put(`purchaseorders/${id}`, payload);
  }

  getPOHeaderDetails(lastPoId: number): Observable<POHeaderDetailsDto> {
    return this.api.get<POHeaderDetailsDto>(`PurchaseOrders/header-details/${lastPoId}`);
  }

  getProductRate(productId: string, priceListId: string): Observable<any> {
    return this.api.get(`PurchaseOrders/get-product-rate?productId=${productId}&priceListId=${priceListId}`);
  }

  bulkSentForDraftApproval(ids: number[]): Observable<any> {
    return this.api.post('PurchaseOrders/bulk-sent-for-approval', ids);
  }

  bulkDraftApprove(ids: number[]): Observable<any> {
    return this.api.post('PurchaseOrders/bulk-approve', ids);
  }

  bulkPOReject(ids: number[]): Observable<any> {
    return this.api.post('PurchaseOrders/bulk-reject', ids);
  }

  getPrintDetails(id: number): Observable<any> {
    return this.api.get<any>(`PurchaseOrders/${id}/print-details`);
  }

  downloadPOReport(id: number): Observable<Blob> {
    return (this.api as any).http.get(`${(this.api as any).environment.ApiBaseUrl}/PurchaseOrders/${id}/download-pdf`, {
      responseType: 'blob'
    });
  }
}
