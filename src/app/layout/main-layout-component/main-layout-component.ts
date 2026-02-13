import { Component, inject, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { MaterialModule } from '../../shared/material/material/material-module';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet, Router } from '@angular/router';
import { BreadcrumbComponent } from './breadcrumb-component/breadcrumb-component';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MatSidenav } from '@angular/material/sidenav';
import { MenuItem } from '../../core/models/menu-item.model';
import { MenuService } from '../../core/services/menu.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../features/dashboard/services/notification.service';
import { NotificationDto } from '../../features/dashboard/services/notification.service';
import { ThemeService } from '../../core/services/theme.service';
import { NestedTreeControl } from '@angular/cdk/tree';
import { MatTreeNestedDataSource } from '@angular/material/tree';
import { LoadingService } from '../../core/services/loading.service';
import { CompanyService } from '../../features/company/services/company.service';
import { environment } from '../../enviornments/environment';

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
  private loadingService = inject(LoadingService);
  private companyService = inject(CompanyService);

  isMobile = false;
  isDarkMode = false;
  currentTheme = '';
  isGlobalLoading = false; // Track global loading state
  userEmail: string | null = null;
  notifications: NotificationDto[] = [];
  unreadCount = 0;

  currentYear = new Date().getFullYear();

  companyName = 'Electric Inventory';
  companyTagline = 'Inventory Management System';
  companyLogoUrl: string | null = null;

  availableThemes: { name: string, label: string, color: string }[] = [];

  // Tree Components
  treeControl = new NestedTreeControl<MenuItem>(node => node.children);
  dataSource = new MatTreeNestedDataSource<MenuItem>();

  hasChild = (_: number, node: MenuItem) => !!node.children && node.children.length > 0;

  ngOnInit(): void {
    this.userEmail = localStorage.getItem('email');

    // Subscribe to Menu Service
    this.menuService.getMenu().subscribe(menus => {
      this.dataSource.data = menus;
    });

    // Fetch Company Profile for Dynamic Branding
    this.companyService.getCompanyProfile().subscribe({
      next: (profile) => {
        if (profile) {
          this.companyName = profile.name || 'Electric Inventory';
          this.companyTagline = profile.tagline || 'Inventory Management System';

          if (profile.logoUrl && !profile.logoUrl.startsWith('http')) {
            // Remove leading slash from logoUrl if present to avoid double slashes
            const cleanLogoUrl = profile.logoUrl.startsWith('/') ? profile.logoUrl.substring(1) : profile.logoUrl;
            this.companyLogoUrl = `${environment.CompanyRootUrl}/${cleanLogoUrl}`;
          } else {
            this.companyLogoUrl = profile.logoUrl;
          }
          this.cdr.detectChanges();
        }
      },
      error: (err) => console.error('Failed to load company profile', err)
    });

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

    // Theme subscription
    this.themeService.activeTheme$.subscribe(theme => {
      this.currentTheme = theme;
      this.cdr.detectChanges();
    });

    // Subscribe to global loading state
    this.loadingService.loading$.subscribe(isLoading => {
      this.isGlobalLoading = isLoading;
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
