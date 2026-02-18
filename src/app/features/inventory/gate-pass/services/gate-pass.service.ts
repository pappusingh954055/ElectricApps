import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../enviornments/environment';
import { GatePass } from '../models/gate-pass.model';

@Injectable({
    providedIn: 'root'
})
export class GatePassService {
    private apiUrl = `${environment.ApiBaseUrl}/gate-passes`;

    constructor(private http: HttpClient) { }

    createGatePass(gatePass: GatePass): Observable<GatePass> {
        return this.http.post<GatePass>(this.apiUrl, gatePass);
    }

    getGatePass(id: number): Observable<GatePass> {
        return this.http.get<GatePass>(`${this.apiUrl}/${id}`);
    }

    // Helper to fetch source document details if needed
    // getSourceDocument(type: string, id: number) { ... }
}
