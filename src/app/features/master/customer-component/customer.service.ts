import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../shared/api.service';
import { environment } from '../../../enviornments/environment';

@Injectable({
  providedIn: 'root',
})
export class customerService {
  private api = inject(ApiService);
  private readonly baseUrl = environment.CustomerApiBaseUrl;

  addCustomer(customer: any) {
    return this.api.post('Customers', customer, this.baseUrl);
  }

  getAllCustomers() {
    return this.api.get('Customers', this.baseUrl);
  }

  getCustomersLookup(): Observable<any[]> {
    return this.api.get<any[]>('Customers/lookup', this.baseUrl);
  }

  getPaged(request: any): Observable<any> {
    return this.api.post<any>('Customers/paged', request, this.baseUrl);
  }

  getById(id: any): Observable<any> {
    return this.api.get(`Customers/${id}`, this.baseUrl);
  }

  update(id: any, customer: any): Observable<any> {
    return this.api.put(`Customers/${id}`, customer, this.baseUrl);
  }

  delete(id: any): Observable<any> {
    return this.api.delete(`Customers/${id}`, this.baseUrl);
  }
}

