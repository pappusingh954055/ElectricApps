import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../../../shared/api.service';
import { Observable } from 'rxjs';
import { PriceListModel } from '../models/pricelist.model';
import { GridRequest } from '../../../../shared/models/grid-request.model';
import { GridResponse } from '../../../../shared/models/grid-response.model';

@Injectable({ providedIn: 'root' })
export class PriceListService {
    private api = inject(ApiService);

    create(payload: PriceListModel): Observable<any> {
        return this.api.post('pricelists', payload);
    }

    update(id: string, payload: PriceListModel): Observable<any> {
        return this.api.put(`pricelists/${id}`, payload);
    }

    delete(id: string): Observable<any> {
        return this.api.delete(`pricelists/${id}`);
    }

    deletePriceList(id: string): Observable<any> {
        return this.api.delete<any>(`pricelists/${id}`);
    }

    getAll(): Observable<PriceListModel[]> {
        return this.api.get<PriceListModel[]>('pricelists');
    }

    getPriceLists(): Observable<PriceListModel[]> {
        return this.api.get<PriceListModel[]>('pricelists');
    }

    getPaged(request: GridRequest): Observable<GridResponse<PriceListModel>> {
        return this.api.get<GridResponse<PriceListModel>>(
            `pricelists/paged?${this.api.toQueryString(request)}`
        );
    }

    deleteMany(ids: string[]): Observable<any> {
        return this.api.post<any>('pricelists/bulk-delete', ids);
    }

    createPriceList(payload: any): Observable<any> {
        return this.api.post('pricelists', payload);
    }

    updatePriceList(id: string, payload: any): Observable<any> {
        return this.api.put<any>(`pricelists/${id}`, payload);
    }

    getPriceListById(id: string): Observable<any> {
        return this.api.get<any>(`pricelists/${id}`);
    }
}

