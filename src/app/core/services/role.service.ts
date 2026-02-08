import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "../../enviornments/environment";
import { Role, RolePermission } from "../models/role.model";

@Injectable({ providedIn: 'root' })
export class RoleService {

    private readonly baseUrl = environment.LoginApiBaseUrl.replace('/auth', '').replace(/\/$/, '') + '/roles';

    constructor(private http: HttpClient) { }

    getAllRoles(): Observable<Role[]> {
        return this.http.get<Role[]>(this.baseUrl);
    }

    getRoleById(id: number): Observable<Role> {
        return this.http.get<Role>(`${this.baseUrl}/${id}`);
    }

    createRole(role: Role): Observable<Role> {
        return this.http.post<Role>(this.baseUrl, role);
    }

    updateRole(id: number, role: Role): Observable<Role> {
        return this.http.put<Role>(`${this.baseUrl}/${id}`, role);
    }

    deleteRole(id: number): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/${id}`);
    }

    // Permissions
    getRolePermissions(roleId: number): Observable<RolePermission[]> {
        return this.http.get<RolePermission[]>(`${this.baseUrl}/${roleId}/permissions`);
    }

    updateRolePermissions(roleId: number, permissions: RolePermission[]): Observable<void> {
        return this.http.put<void>(`${this.baseUrl}/${roleId}/permissions`, permissions);
    }
}
