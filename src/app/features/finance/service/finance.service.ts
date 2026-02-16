import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
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
        return this.http.post(`${this.supplierApi}/payments`, payment);
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

    // P&L Methods
    getProfitAndLossReport(filters: any): Observable<any> {
        // We aggregate data from Suppliers (Expenses/Payments) and Customers (Income/Receipts)
        const paymentReq = this.http.post<any>(`${this.supplierApi}/total-payments`, filters);
        const receiptReq = this.http.post<any>(`${this.customerApi}/total-receipts`, filters);

        return forkJoin([paymentReq, receiptReq]).pipe(
            map(([paymentRes, receiptRes]) => {
                return {
                    totalIncome: receiptRes.totalReceipts,
                    totalExpenses: paymentRes.totalPayments
                };
            })
        );
    }
}
