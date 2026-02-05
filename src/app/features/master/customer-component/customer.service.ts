import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class customerService {

  readonly Url = 'https://localhost:7173/api/customers';

  constructor(private http: HttpClient) { }

  addCustomer(customer: any) {
    return this.http.post(this.Url, customer);
  }

  getAllCustomers() {
    return this.http.get(this.Url);
  }

  getCustomersLookup(): Observable<any[]> {
    return this.http.get<any[]>(`${this.Url}/lookup`);
  } 

}
