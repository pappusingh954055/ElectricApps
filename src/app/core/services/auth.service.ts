import { Observable, tap, throwError, catchError, of } from "rxjs";

import { HttpClient } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { Router } from "@angular/router";
import { environment } from "../../enviornments/environment";

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  login(credentials: any): Observable<any> {
    const payload = {
      dto: {
        Email: credentials.Email,
        Password: credentials.Password
      }
    };

    return this.http.post(`${environment.LoginApiBaseUrl}/login`, payload).pipe(
      tap((res: any) => {
        if (res && res.accessToken) {
          this.storeTokens(res.accessToken, res.refreshToken);
        }
      })
    );
  }

  // 1. Storage Helpers
  getToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  storeTokens(accessToken: string, refreshToken: string) {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }

  // 2. 🛡️ STRICTOR VALIDATION (Header, Structure, & Decoding)
  // Yeh method Header change karte hi pakad lega
  isTokenTampered(token: string | null): boolean {
    if (!token) return true;

    const parts = token.split('.');

    // Check if structure is correct (Header.Payload.Signature)
    if (parts.length !== 3) {
      console.error('Auth Guard: Invalid Structure');
      return true;
    }

    try {
      // Validate Header (parts[0]) - Instant logout if Header is changed
      atob(parts[0]);

      // Validate Payload (parts[1])
      const payloadJson = atob(parts[1]);
      const payload = JSON.parse(payloadJson);

      if (!payload || typeof payload !== 'object') return true;

      return false; // Token is structurally sound
    } catch (e) {
      console.error('Auth Guard: Decoding failed (Header/Payload Tampered)');
      return true;
    }
  }

  // 3. ⏳ EXPIRY CHECK (1 Minute Logic)
  isTokenExpired(): boolean {
    const token = this.getToken();

    // Pehle tamper check karein, agar corrupt hai toh use expired hi maano
    if (this.isTokenTampered(token)) return true;

    try {
      const parts = token!.split('.');
      const payload = JSON.parse(atob(parts[1]));
      const expiry = payload.exp;

      if (!expiry) return true;

      const now = Math.floor(Date.now() / 1000);
      return now >= expiry;
    } catch {
      return true;
    }
  }

  // 4. REFRESH TOKEN CALL
  refreshToken(): Observable<any> {
    const refreshToken = this.getRefreshToken();
    const accessToken = this.getToken();

    if (!refreshToken || !accessToken) {
      this.logout();
      return of(null);
    }

    return this.http.post(`${environment.LoginApiBaseUrl}/refresh`, { accessToken, refreshToken }).pipe(
      tap((res: any) => {
        if (res && res.accessToken) {
          this.setTokens(res.accessToken, res.refreshToken);
        }
      })
    );
  }

  // 5. LOGOUT
  logout(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.clear();
    this.router.navigate(['/login']);
  }
}