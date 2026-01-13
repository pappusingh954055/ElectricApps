import { Injectable } from '@angular/core';
import { ApiService } from '../../../../shared/api.service';
import { Observable } from 'rxjs';
import { PriceListModel } from '../models/pricelist.model';
import { GridRequest } from '../../../../shared/models/grid-request.model';
import { GridResponse } from '../../../../shared/models/grid-response.model';





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
    getPaged(request: GridRequest): Observable<GridResponse<PriceListModel>> {
        return this.api.get<GridResponse<PriceListModel>>(
            `pricelists/paged?${this.api.toQueryString(request)}`
        );
    }

    // 🔹 Bulk delete (THIS IS WHAT YOU ASKED)
    deleteMany(ids: string[]): Observable<any> {
        return this.api.post<any>(`pricelists/bulk-delete`, ids);
    }

}
