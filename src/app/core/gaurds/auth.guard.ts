import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { AuthService } from "../services/auth.service";

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Check karein ki token expire toh nahi ho gaya
  if (authService.isTokenExpired()) {
    console.warn('Token expired, redirecting to login...');
    authService.logout(); // Storage clear karega
    router.navigate(['/login']);
    return false;
  }

  return true;
};