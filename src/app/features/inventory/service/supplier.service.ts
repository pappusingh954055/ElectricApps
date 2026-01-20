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

    private http = inject(HttpClient);



    private apiUrl = "https://localhost:7224/api/supplier";



    // Sare suppliers fetch karne ke liye (PO Dropdown ke liye)
    getSuppliers(): Observable<Supplier[]> {
        return this.http.get<Supplier[]>(this.apiUrl);
    }


    addSupplier(supplier: Supplier): Observable<Supplier> {
        //const userId = localStorage.getItem('userId'); // Ya authService.getUserId()

        const dataWithUser = { ...supplier };

        console.log('Debug: Sending supplier data', dataWithUser);

        return this.http.post<Supplier>(this.apiUrl, dataWithUser);
    }
    
    getSupplierById(id: number): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/${id}`);
    }
}