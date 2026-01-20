import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';

import { Router } from '@angular/router';
import { catchError, switchMap, throwError, BehaviorSubject, filter, take } from 'rxjs';
import { AuthService } from './services/auth.service';

let isRefreshing = false;
const refreshTokenSubject: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const token = authService.getToken();

    let authReq = req;
    if (token) {
        authReq = addTokenHeader(req, token);
    }

    return next(authReq).pipe(
        catchError((error: HttpErrorResponse) => {
            // 1. Skip if it's a login request
            if (req.url.includes('login')) {
                return throwError(() => error);
            }

            // 2. Handle 401 Unauthorized
            if (error.status === 401) {
                return handle401Error(req, next, authService, router);
            }

            // 3. Handle 403 Forbidden
            if (error.status === 403) {
                return throwError(() => error);
            }

            return throwError(() => error);
        })
    );
};

function addTokenHeader(request: HttpRequest<any>, token: string) {
    return request.clone({
        setHeaders: { Authorization: `Bearer ${token}` }
    });
}

function handle401Error(req: HttpRequest<any>, next: HttpHandlerFn, authService: AuthService, router: Router) {
    const token = authService.getToken();
//   if (currentToken) {
//         const parts = currentToken.split('.');
        
//         // Agar token 3 parts mein nahi hai (jaise aapne random text dala)
//         // Ya decode karne par error aa raha hai
//         if (parts.length !== 3 || authService.isTokenFormatInvalid(currentToken)) {
//             console.error('Tampering detected! Blocking Refresh.');
//             authService.logout(); // Storage saaf karo
//             router.navigate(['/login']); // Login par bhejo
//             return throwError(() => new Error('Tampered Token'));
//         }
//     }

// 🛡️ YAHAN HAI FIX: 
    // Agar token tampered hai, toh refresh call MAT KARO. Seedha logout!
    if (authService.isTokenTampered(token)) {
        console.error('Tampering detected! Blocking refresh call.');
        authService.logout();
        router.navigate(['/login']);
        return throwError(() => new Error('Invalid Token Format'));
    }

    if (!isRefreshing) {
        isRefreshing = true;
        refreshTokenSubject.next(null);

        return authService.refreshToken().pipe(
            switchMap((res: any) => {
                isRefreshing = false;
                const newToken = res.accessToken || res.token;
                refreshTokenSubject.next(newToken);
                return next(addTokenHeader(req, newToken));
            }),
            catchError((err) => {
                isRefreshing = false;
                // Agar Refresh Token bhi fail ho jaye (Expired Refresh Token)
                authService.logout();
                router.navigate(['/login']);
                return throwError(() => err);
            })
        );
    } else {
        // Wait for current refresh to complete
        return refreshTokenSubject.pipe(
            filter(token => token !== null),
            take(1),
            switchMap((token) => next(addTokenHeader(req, token!)))
        );
    }
}