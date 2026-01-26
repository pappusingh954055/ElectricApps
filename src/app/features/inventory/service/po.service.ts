import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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
    console.log('payload', id+ payload)
    // Ensure id is present to avoid 'undefined' in URL
    return this.http.put(`${this.apiUrl}/purchaseorders/${id}`, payload);
  }

  
}