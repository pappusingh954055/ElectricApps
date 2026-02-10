import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { CompanyProfileDto, UpsertCompanyRequest } from '../model/company.model';
import { ApiService } from '../../../shared/api.service';
import { environment } from '../../../enviornments/environment';


@Injectable({
    providedIn: 'root'
})
export class CompanyService {
    private readonly api = inject(ApiService);
    private readonly baseUrl = environment.CompanyApiBaseUrl;

    /**
     * Master Company Profile fetch karne ke liye (Report Headers ke liye best)
     */
    getCompanyProfile(): Observable<CompanyProfileDto> {
        return this.api.get<CompanyProfileDto>('company/profile', this.baseUrl);
    }

    /**
     * Paged list fetch karne ke liye
     */
    getPaged(request: any): Observable<any> {
        return this.api.post<any>('company/paged', request, this.baseUrl);
    }

    /**
     * Paged list fetch karne ke liye
     */
    getPaged(request: any): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/company/paged`, request);
    }

    /**
     * ID ke base par specific company data lane ke liye
     */
    getById(id: number): Observable<CompanyProfileDto> {
        return this.api.get<CompanyProfileDto>(`company/${id}`, this.baseUrl);
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
        return this.api.delete<boolean>(`company/${id}`, this.baseUrl);
    }

    /**
     * Bulk delete profiles
     */
    deleteMany(ids: number[]): Observable<any> {
        return this.api.post<any>('company/bulk-delete', ids, this.baseUrl);
    }

    /**
     * Company Logo upload karne ke liye
     */
    uploadLogo(id: number, file: File): Observable<any> {
        const formData = new FormData();
        formData.append('file', file, file.name);
        return this.api.post<any>(`company/upload-logo/${id}`, formData, this.baseUrl);
    }
}