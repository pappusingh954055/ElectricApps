import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../enviornments/environment';
import { ApiService } from '../../../shared/api.service';


// Supplier Interface
export interface Supplier {
    id?: number;
    name?: string;
    phone?: string;
    gstIn?: string;
    address?: string;
    createdBy?: string;
    defaultpricelistId?: string;
    isActive?: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class SupplierService {
    private api = inject(ApiService);
    private readonly baseUrl = environment.SupplierApiBaseUrl;

    // Sare suppliers fetch karne ke liye (PO Dropdown ke liye)
    getSuppliers(): Observable<Supplier[]> {
        return this.api.get<Supplier[]>('', this.baseUrl);
    }


    addSupplier(supplier: Supplier): Observable<Supplier> {
        return this.api.post<Supplier>('', supplier, this.baseUrl);
    }

    getSupplierById(id: number): Observable<any> {
        return this.api.get<any>(`${id}`, this.baseUrl);
    }
}
