import { Injectable } from '@angular/core';
import { ApiService } from '../../../../shared/api.service';
import { Observable } from 'rxjs';
import { PriceListModel } from '../models/pricelist.model';





@Injectable({ providedIn: 'root' })
export class PriceListService {

    constructor(private api: ApiService) { }

    create(payload: PriceListModel): Observable<any> {
        console.log('payload', payload)
        return this.api.post('pricelists', payload);
    }

    update(id: string, payload: PriceListModel): Observable<any> {
        return this.api.put(`pricelists/${id}`, payload);
    }

    delete(id: string): Observable<any> {
        return this.api.delete(`pricelists/${id}`);
    }

    getAll(): Observable<PriceListModel[]> {
        return this.api.get('pricelists');
    }
}
