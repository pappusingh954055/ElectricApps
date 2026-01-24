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

    localStorage.setItem('access_token', res.accessToken);
    localStorage.setItem('refresh_token', res.refreshToken);
  }

  // 🔍 CHECK LOGIN STATUS
  isLoggedIn(): boolean {
    return !!localStorage.getItem('access_token');
  }

  // 🚪 LOGOUT
  logout(): void {
    localStorage.clear();
    this.router.navigate(['/login']);
  }

  // 🔑 GET TOKEN
  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }
}
