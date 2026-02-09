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

    //console.log('[AuthService] login payload:', payload);

    return this.http.post<any>(`${this.baseUrl}/login`, payload).pipe(
      tap(res => this.storeTokens(res))
    );
  }

  // 🔄 REFRESH TOKENS
  refreshTokens(): Observable<any> {
    const payload = {
      accessToken: this.getAccessToken(),
      refreshToken: this.getRefreshToken()
    };
    return this.http.post<any>(`${this.baseUrl}/refresh`, payload).pipe(
      tap(res => this.storeTokens(res))
    );
  }

  // 💾 STORE TOKENS
  storeTokens(res: any): void {
    if (!res) return;

    console.log('[AuthService] saving tokens');

    localStorage.setItem('accessToken', res.accessToken);
    localStorage.setItem('refreshToken', res.refreshToken);

    // Save roles and other info if available in response
    if (res.roles) {
      localStorage.setItem('roles', JSON.stringify(res.roles));
    }
    if (res.email) {
      localStorage.setItem('email', res.email);
    }
    if (res.userId) {
      localStorage.setItem('userId', res.userId);
    }
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
      return Array.isArray(parsedRoles) ? parsedRoles[0] : parsedRoles;
    }
    return 'User';
  }
}
