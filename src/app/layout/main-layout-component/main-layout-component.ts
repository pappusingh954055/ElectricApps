import { Component, inject, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { MaterialModule } from '../../shared/material/material/material-module';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet, Router } from '@angular/router';
import { ToolbarComponent } from './toolbar-component/toolbar-component';
import { SidenavComponent } from './sidenav-component/sidenav-component';
import { BreadcrumbComponent } from './breadcrumb-component/breadcrumb-component';
import { FooterComponent } from './footer-component/footer-component';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MatSidenav } from '@angular/material/sidenav';
import { MenuItem } from '../../core/models/menu-item.model';
import { MenuService } from '../../core/services/menu.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../features/dashboard/services/notification.service';
import { NotificationDto } from '../../features/dashboard/services/notification.service';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-main-layout-component',
  imports: [CommonModule, RouterOutlet, RouterModule, BreadcrumbComponent,
    MaterialModule],
  templateUrl: './main-layout-component.html',
  styleUrl: './main-layout-component.scss',
})
export class MainLayoutComponent implements OnInit {

  @ViewChild(MatSidenav) sidenav!: MatSidenav;

  private breakpointObserver = inject(BreakpointObserver);
  private cdr = inject(ChangeDetectorRef);
  private menuService = inject(MenuService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private notificationService = inject(NotificationService);
  private themeService = inject(ThemeService);

  isMobile = false;
  isDarkMode = false;
  currentTheme = '';
  menuItems: MenuItem[] = [];
  userEmail: string | null = null;
  notifications: NotificationDto[] = [];
  unreadCount = 0;

  availableThemes: { name: string, label: string, color: string }[] = [];

  ngOnInit(): void {
    this.userEmail = localStorage.getItem('email');
    this.menuItems = this.menuService.getMenu();
    this.availableThemes = this.themeService.availableThemes;

    this.breakpointObserver
      .observe([Breakpoints.Handset])
      .subscribe(result => {
        this.isMobile = result.matches;
        this.cdr.detectChanges();
      });

    // Theme subscription
    this.themeService.darkMode$.subscribe(isDark => {
      this.isDarkMode = isDark;
      this.cdr.detectChanges();
    });

    this.themeService.activeTheme$.subscribe(theme => {
      this.currentTheme = theme;
      this.cdr.detectChanges();
    });

    // Step 1: Count Check on Page Load
    this.loadUnreadCount();
  }

  toggleTheme(): void {
    this.themeService.toggleDarkMode();
  }

  setTheme(themeName: string): void {
    this.themeService.setTheme(themeName);
  }

  toggleSidenav(): void {
    this.sidenav.toggle();
  }

  logout(): void {
    this.authService.logout();
  }

  openProfile() { }
  openSettings() { }

  // Step 1 Helper: Load count
  loadUnreadCount(): void {
    this.notificationService.getUnreadCount().subscribe({
      next: (count) => {
        this.unreadCount = count;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Failed to load notification count', err)
    });
  }

  // Step 2: List Load on Bell Click
  loadNotifications(): void {
    this.cdr.detectChanges();
    this.notificationService.getUnreadNotifications().subscribe({
      next: (data) => {
        this.notifications = data;
        this.unreadCount = data.length;

        // Count update logic is fine, but we also rely on separate count API. 
        // This keeps them in sync when list is opened.
      },
      error: (err) => console.error('Failed to load notifications', err)
    });
  }

  // Step 3: Single Read on Click
  markAsRead(notification: NotificationDto): void {
    if (!notification.isRead) {
      this.cdr.detectChanges();
      this.notificationService.markAsRead(notification.id).subscribe({
        next: () => {
          // Remove from local list or mark as read
          notification.isRead = true;
          this.cdr.detectChanges();
          this.notifications = this.notifications.filter(n => !n.isRead);
          if (this.unreadCount > 0) this.unreadCount--;

          // Navigate
          if (notification.targetUrl) {
            this.navigateTo(notification.targetUrl);
            this.cdr.detectChanges();
          }
        },
        error: (err) => console.error('Failed to mark as read', err)
      });
    } else {
      if (notification.targetUrl) {
        this.navigateTo(notification.targetUrl);
      }
    }
  }

  // Step 4: Bulk Read
  markAllAsRead(): void {
    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        this.notifications = [];
        this.unreadCount = 0;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Failed to mark all as read', err)
    });
  }

  navigateTo(link: string): void {
    if (link) {
      this.router.navigate([link]);
    }
  }

  viewAllNotifications(): void {
    this.router.navigate(['/notifications']);
    this.cdr.detectChanges();
  }

  // Method to be called when menu is opened
  onMenuOpened(): void {
    this.loadNotifications();
  }

  getIconForType(type: string): string {
    switch (type?.toLowerCase()) {
      case 'warning': return 'warning';
      case 'success': return 'check_circle';
      case 'alert': return 'error';
      case 'info': return 'info';
      default: return 'notifications';
    }
  }
}
