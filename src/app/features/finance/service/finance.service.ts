import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../enviornments/environment';

@Injectable({
    providedIn: 'root'
})
export class FinanceService {
    private supplierApi = `${environment.api.supplier}/finance`;
    private customerApi = `${environment.api.customer}/finance`;

    constructor(private http: HttpClient) { }

    // Supplier Methods
    getSupplierLedger(supplierId: number): Observable<any> {
        return this.http.get(`${this.supplierApi}/ledger/${supplierId}`);
    }

    recordSupplierPayment(payment: any): Observable<any> {
        return this.http.post(`${this.supplierApi}/payment`, payment);
    }

    getPendingDues(): Observable<any> {
        return this.http.get(`${this.supplierApi}/pending-dues`);
    }

    // Customer Methods
    getCustomerLedger(customerId: number): Observable<any> {
        return this.http.get(`${this.customerApi}/ledger/${customerId}`);
    }

    recordCustomerReceipt(receipt: any): Observable<any> {
        return this.http.post(`${this.customerApi}/receipt`, receipt);
    }

    getOutstandingTracker(): Observable<any> {
        return this.http.get(`${this.customerApi}/outstanding`);
    }

    // P&L Methods (Placeholder for now)
    getProfitAndLossReport(filters: any): Observable<any> {
        return this.http.post(`${environment.api.inventory}/api/dashboard/p-and-l`, filters);
    }
}
