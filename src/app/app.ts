import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { IdleService } from './core/services/idle.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  private idleService = inject(IdleService);

  ngOnInit(): void {
    if (localStorage.getItem('access_token')) {
      this.idleService.startWatching();
    }
  }
}