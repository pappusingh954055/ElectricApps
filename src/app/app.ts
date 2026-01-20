import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private intervalId: any; // Interval ko track karne ke liye

  ngOnInit(): void {
    // 1. Storage Listener: Jaise hi console se header badloge, ye turant pakad lega
    window.addEventListener('storage', (event) => {
      if (event.key === 'accessToken') {
        console.log('Token changed manually! Verifying...');
        this.checkSession();
      }
    });

    // 2. Interval: Har 5 second mein idle check ke liye
    setInterval(() => {
      this.checkSession();
    }, 5000);
  }

  private checkSession(): void {
    const token = this.authService.getToken();
    if (token) {
      // Agar Header badla (Tampered) ya Time khatam hua (Expired)
      if (this.authService.isTokenTampered(token) || this.authService.isTokenExpired()) {
        this.authService.logout();
      }
    }
  }

  isTokenTampered(token: string | null): boolean {
    if (!token) return true;
    const parts = token.split('.');
    if (parts.length !== 3) return true;

    try {
      // Header (parts[0]) ko decode karke check karo ki kya wo ek JSON object hai
      const header = JSON.parse(atob(parts[0]));

      // Header mein hamesha "alg" (algorithm) field hoti hai
      if (!header || !header.alg) {
        return true; // Agar 'alg' nahi hai, matlab token fake hai
      }

      // Payload check
      const payload = JSON.parse(atob(parts[1]));
      return !payload || typeof payload !== 'object';
    } catch (e) {
      // Agar decoding fail hui (Header mein random text dalne par)
      return true;
    }
  }

  ngOnDestroy(): void {
    // Component destroy hone par interval ko band karein (Good Practice)
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }
}