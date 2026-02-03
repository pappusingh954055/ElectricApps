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
}