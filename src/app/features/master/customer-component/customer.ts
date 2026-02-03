import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class Customer {

  readonly Url = 'https://localhost:7173/api/customers';

  constructor(private http: HttpClient) { }

  addCustomer(customer: any) {
    return this.http.post(this.Url, customer);
  }

  getAllCustomers() {
    return this.http.get(this.Url);
  }

}
