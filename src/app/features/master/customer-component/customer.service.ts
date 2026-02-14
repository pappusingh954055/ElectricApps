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
    return this.api.post('customers', customer, this.baseUrl);
  }

  getAllCustomers() {
    return this.api.get('customers', this.baseUrl);
  }

  getCustomersLookup(): Observable<any[]> {
    return this.api.get<any[]>('customers/lookup', this.baseUrl);
  }

  getPaged(request: any): Observable<any> {
    return this.api.post<any>('customers/paged', request, this.baseUrl);
  }
}

