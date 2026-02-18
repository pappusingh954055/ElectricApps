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
    private inventoryApi = `${environment.api.inventory}`;

    constructor(private http: HttpClient) { }

    // Supplier Methods
    getSupplierLedger(request: any): Observable<any> {
        return this.http.post(`${this.supplierApi}/ledger`, request);
    }

    recordSupplierPayment(payment: any): Observable<any> {
        return this.http.post(`${this.supplierApi}/payment-entry`, payment);
    }

    getPendingDues(): Observable<any[]> {
        return this.http.get<any[]>(`${this.supplierApi}/pending-dues`).pipe(
            map(dues => {
                if (!Array.isArray(dues)) return [];
                return dues.map(d => ({
                    supplierId: d.supplierId || d.SupplierId,
                    supplierName: d.supplierName || d.SupplierName,
                    pendingAmount: d.pendingAmount || d.PendingAmount,
                    status: d.status || d.Status,
                    dueDate: d.dueDate || d.DueDate
                }));
            })
        );
    }

    getPaymentsReport(request: any): Observable<any> {
        return this.http.post<any>(`${this.supplierApi}/payments-report`, request);
    }

    // Customer Methods
    getCustomerLedger(request: any): Observable<any> {
        return this.http.post(`${this.customerApi}/ledger`, request);
    }

    recordCustomerReceipt(receipt: any): Observable<any> {
        return this.http.post(`${this.customerApi}/receipt`, receipt);
    }

    getOutstandingTracker(request: any): Observable<any> {
        return this.http.post(`${this.customerApi}/outstanding`, request);
    }

    getTotalReceivables(): Observable<any> {
        return this.http.get(`${this.customerApi}/outstanding-total`);
    }

    getTotalPayables(): Observable<any> {
        return this.http.get(`${this.supplierApi}/pending-total`);
    }

    getPendingCustomerDues(): Observable<any[]> {
        return this.http.get<any[]>(`${this.customerApi}/pending-dues`).pipe(
            map(dues => {
                if (!Array.isArray(dues)) return [];
                return dues.map(d => ({
                    customerId: d.customerId || d.CustomerId,
                    customerName: d.customerName || d.CustomerName,
                    pendingAmount: d.pendingAmount || d.PendingAmount,
                    status: d.status || d.Status,
                    dueDate: d.dueDate || d.DueDate
                }));
            })
        );
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

    // Expense Category Methods
    getExpenseCategories(): Observable<any[]> {
        return this.http.get<any[]>(`${this.inventoryApi}/expense-categories`);
    }

    createExpenseCategory(category: any): Observable<any> {
        return this.http.post(`${this.inventoryApi}/expense-categories`, category);
    }

    updateExpenseCategory(id: number, category: any): Observable<any> {
        return this.http.put(`${this.inventoryApi}/expense-categories/${id}`, category);
    }

    deleteExpenseCategory(id: number): Observable<any> {
        return this.http.delete(`${this.inventoryApi}/expense-categories/${id}`);
    }

    // Expense Entry Methods
    getExpenseEntries(pageNumber: number = 1, pageSize: number = 50, search: string = ''): Observable<any> {
        return this.http.get<any>(`${this.inventoryApi}/expense-entries?pageNumber=${pageNumber}&pageSize=${pageSize}&search=${search}`);
    }

    createExpenseEntry(entry: any): Observable<any> {
        return this.http.post(`${this.inventoryApi}/expense-entries`, entry);
    }

    updateExpenseEntry(id: number, entry: any): Observable<any> {
        return this.http.put(`${this.inventoryApi}/expense-entries/${id}`, entry);
    }

    deleteExpenseEntry(id: number): Observable<any> {
        return this.http.delete(`${this.inventoryApi}/expense-entries/${id}`);
    }

    getExpenseChartData(filters: any = {}): Observable<any[]> {
        return this.http.post<any[]>(`${this.inventoryApi}/expense-entries/chart-data`, filters);
    }

    getMonthlyTrends(months: number = 6): Observable<any> {
        const receiptsReq = this.http.get<any[]>(`${this.customerApi}/monthly-receipts?months=${months}`);
        const paymentsReq = this.http.get<any[]>(`${this.supplierApi}/monthly-payments?months=${months}`);
        const expensesReq = this.http.get<any[]>(`${this.inventoryApi}/expense-entries/monthly-totals?months=${months}`);

        return forkJoin([receiptsReq, paymentsReq, expensesReq]).pipe(
            map(([receipts, payments, expenses]) => {
                // Return unified data
                return {
                    receipts,
                    payments,
                    expenses
                };
            })
        );
    }
}
