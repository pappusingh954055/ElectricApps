import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IdleService } from './core/services/idle.service';
import { ThemeService } from './core/services/theme.service';
import { OverlayContainer } from '@angular/cdk/overlay';
import { LoadingService } from './core/services/loading.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, MatProgressSpinnerModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  private idleService = inject(IdleService);
  private themeService = inject(ThemeService);
  private overlayContainer = inject(OverlayContainer);
  private loadingService = inject(LoadingService);
  private cdr = inject(ChangeDetectorRef);

  isGlobalLoading = false;

  ngOnInit(): void {
    if (localStorage.getItem('access_token')) {
      this.idleService.startWatching();
    }

    this.loadingService.loading$.subscribe(isLoading => {
      this.isGlobalLoading = isLoading;
      this.cdr.detectChanges(); // Ensure the loader shows/hides immediately even if outside zone
    });
  }
}