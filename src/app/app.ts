import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { IdleService } from './core/services/idle.service';
import { ThemeService } from './core/services/theme.service';
import { OverlayContainer } from '@angular/cdk/overlay';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  private idleService = inject(IdleService);
  private themeService = inject(ThemeService);
  private overlayContainer = inject(OverlayContainer);

  ngOnInit(): void {
    if (localStorage.getItem('access_token')) {
      this.idleService.startWatching();
    }

    // Theme is automatically applied by ThemeService constructor
    this.themeService.darkMode$.subscribe(); // Ensure subscription to keep it alive if needed, or just let it exist. 
    // Actually, just injecting it is enough if it does work in constructor. 
    // But to be safe, I'll just leave it injected.
  }
}