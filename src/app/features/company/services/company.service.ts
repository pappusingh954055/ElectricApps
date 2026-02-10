import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CompanyProfileDto, UpsertCompanyRequest } from '../model/company.model';


@Injectable({
    providedIn: 'root'
})
export class CompanyService {
    // Aapke API ka base URL
    private readonly apiUrl = 'https://localhost:7065/api';

    constructor(private http: HttpClient) { }

    /**
     * Master Company Profile fetch karne ke liye (Report Headers ke liye best)
     */
    getCompanyProfile(): Observable<CompanyProfileDto> {
        return this.http.get<CompanyProfileDto>(`${this.apiUrl}/company/profile`);
    }

    /**
     * ID ke base par specific company data lane ke liye
     */
    getById(id: number): Observable<CompanyProfileDto> {
        return this.http.get<CompanyProfileDto>(`${this.apiUrl}/company/${id}`);
    }

    /**
     * Nayi company profile create karne ke liye
     */
    insertCompany(company: UpsertCompanyRequest): Observable<number> {
        return this.http.post<number>(`${this.apiUrl}/company/create`, company);
    }

    /**
     * Existing profile ko update karne ke liye
     */
    updateCompany(id: number, profile: UpsertCompanyRequest): Observable<number> {
        return this.http.put<number>(`${this.apiUrl}/company/update/${id}`, profile);
    }

    /**
     * Profile delete karne ke liye
     */
    deleteCompany(id: number): Observable<boolean> {
        return this.http.delete<boolean>(`${this.apiUrl}/company/${id}`);
    }
}