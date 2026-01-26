import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../enviornments/environment';
import { LoginDto } from '../models/user.model';
import { Router } from '@angular/router';



@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly baseUrl = environment.LoginApiBaseUrl;

  constructor(private http: HttpClient, private router: Router) { }

  // 🔐 LOGIN
  login(data: LoginDto): Observable<any> {

    const payload = {
      dto: data
    };

    console.log('[AuthService] login payload:', payload);

    return this.http.post<LoginDto>(`${this.baseUrl}/login`, payload).pipe(
      tap(res => this.storeTokens(res))
    );
  }

  // 💾 STORE TOKENS
  private storeTokens(res: any): void {
    if (!res) return;

    console.log('[AuthService] saving tokens');

    localStorage.setItem('accessToken', res.accessToken);
    localStorage.setItem('refreshToken', res.refreshToken);
  }

  // 🔍 CHECK LOGIN STATUS
  isLoggedIn(): boolean {
    return !!localStorage.getItem('accessToken');
  }

  // 🚪 LOGOUT
  logout(): void {
    localStorage.clear();
    this.router.navigate(['/login']);
  }

  // 🔑 GET TOKEN
  getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }
  getUserRole(): string {
    const roles = localStorage.getItem('roles');
    if (roles) {
      const parsedRoles = JSON.parse(roles);
      // Agar array hai ["User"], toh pehla element dein, warna string dein
      return Array.isArray(parsedRoles) ? parsedRoles[0] : parsedRoles;
    }
    return 'User'; // Default role agar kuch na mile
  }
}
